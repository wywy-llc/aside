import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inferSchemaFromSheet } from '../../src/tools/infer-schema-from-sheet.js';
import {
  SheetsValuesGetResponseFactory,
  TranslateListResponseFactory,
} from '../factories/googleapis.factory.js';

const mockGet = vi.fn();
const mockTranslateList = vi.fn();

vi.mock('google-auth-library', () => {
  // コンストラクタとして new GoogleAuth() を許容するモック
  function GoogleAuthMock(this: unknown) {
    return { getClient: vi.fn() };
  }
  return { GoogleAuth: vi.fn(GoogleAuthMock) };
});

vi.mock('googleapis', () => {
  const sheetsMock = vi.fn(() => ({
    spreadsheets: {
      values: {
        get: mockGet,
      },
    },
  }));
  const translateMock = vi.fn(() => ({
    translations: {
      list: mockTranslateList,
    },
  }));
  return {
    google: {
      sheets: sheetsMock,
      translate: translateMock,
    },
  };
});

// テストデータ定数
const TEST_SPREADSHEET_ID = 'test-spreadsheet-id';
const TEST_SHEET_NAME = 'Sheet1';
const TEST_HEADERS_JA = ['ID', '名前'];
const TEST_HEADERS_JA_EXTENDED = ['ID', '名前', '数値'];
const TEST_TRANSLATIONS = ['ID', 'Name'];
const TEST_TRANSLATIONS_EXTENDED = ['ID', 'Name', 'Number'];

// Expected値定数
const EXPECTED_HEADER_RANGE_2_COLS = `${TEST_SHEET_NAME}!A1:B1`;
const EXPECTED_DATA_RANGE_2_COLS = `${TEST_SHEET_NAME}!A2:B`;
const EXPECTED_HEADER_RANGE_3_COLS = `${TEST_SHEET_NAME}!A1:C1`;
const EXPECTED_DATA_RANGE_3_COLS = `${TEST_SHEET_NAME}!A2:C`;

/**
 * モックセットアップヘルパー: Sheets API と Translate API の正常応答を設定
 *
 * @param sheetValues - Sheets API が返す2次元配列
 * @param translations - Translate API が返す翻訳結果
 */
const setupSuccessfulMocks = (
  sheetValues: string[][],
  translations: string[]
) => {
  mockGet.mockResolvedValueOnce(
    SheetsValuesGetResponseFactory.withValues(sheetValues)
  );
  mockTranslateList.mockResolvedValueOnce(
    TranslateListResponseFactory.withTranslations(translations)
  );
};

describe('inferSchemaFromSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SheetsValuesGetResponseFactory.resetSequenceNumber();
    TranslateListResponseFactory.resetSequenceNumber();
  });

  describe('正常系', () => {
    it('2列のヘッダーを持つシートからFeatureSchemaを推論できる', async () => {
      // モック: 日本語ヘッダー（ID, 名前）→ 英語翻訳（ID, Name）
      setupSuccessfulMocks([TEST_HEADERS_JA, ['1', 'foo']], TEST_TRANSLATIONS);

      const result = await inferSchemaFromSheet({
        spreadsheetId: TEST_SPREADSHEET_ID,
        sheetName: TEST_SHEET_NAME,
        headers: TEST_HEADERS_JA,
        lang: 'ja',
      });

      // 検証1: エラーなし
      expect(result.isError).toBeUndefined();

      // 検証2: レスポンス構造
      const payload = JSON.parse(result.content[0].text);
      expect(payload.sheetName).toBe(TEST_SHEET_NAME);
      expect(payload.headerRange).toBe(EXPECTED_HEADER_RANGE_2_COLS);
      expect(payload.dataRange).toBe(EXPECTED_DATA_RANGE_2_COLS);

      // 検証3: フィールド定義（2列: A, B）
      expect(payload.fields).toHaveLength(2);
      expect(payload.fields[0]).toMatchObject({
        name: 'id',
        column: 'A',
      });
      expect(payload.fields[1]).toMatchObject({
        name: 'name',
        column: 'B',
      });
    });

    it('3列以上のヘッダーを持つシートからFeatureSchemaを推論できる', async () => {
      // モック: 日本語ヘッダー（ID, 名前, 数値）→ 英語翻訳（ID, Name, Number）
      setupSuccessfulMocks(
        [TEST_HEADERS_JA_EXTENDED, ['1', 'foo', '123']],
        TEST_TRANSLATIONS_EXTENDED
      );

      const result = await inferSchemaFromSheet({
        spreadsheetId: TEST_SPREADSHEET_ID,
        sheetName: TEST_SHEET_NAME,
        headers: TEST_HEADERS_JA_EXTENDED,
        lang: 'ja',
      });

      // 検証1: エラーなし
      expect(result.isError).toBeUndefined();

      // 検証2: レスポンス構造
      const payload = JSON.parse(result.content[0].text);
      expect(payload.headerRange).toBe(EXPECTED_HEADER_RANGE_3_COLS);
      expect(payload.dataRange).toBe(EXPECTED_DATA_RANGE_3_COLS);

      // 検証3: フィールド定義（3列: A, B, C）
      expect(payload.fields).toHaveLength(3);
      expect(payload.fields[2]).toMatchObject({
        name: 'number',
        column: 'C',
      });
    });

    it('langパラメータなしの場合、翻訳せずに英語ヘッダーをそのまま使用できる', async () => {
      // モック: 英語ヘッダー（翻訳不要）
      const englishHeaders = ['ID', 'Name'];
      mockGet.mockResolvedValueOnce(
        SheetsValuesGetResponseFactory.withValues([
          englishHeaders,
          ['1', 'foo'],
        ])
      );

      const result = await inferSchemaFromSheet({
        spreadsheetId: TEST_SPREADSHEET_ID,
        sheetName: TEST_SHEET_NAME,
        headers: englishHeaders,
        // lang: undefined → 翻訳スキップ
      });

      // 検証1: エラーなし
      expect(result.isError).toBeUndefined();

      // 検証2: 翻訳APIが呼ばれていない
      expect(mockTranslateList).not.toHaveBeenCalled();

      // 検証3: フィールド名が小文字化されている
      const payload = JSON.parse(result.content[0].text);
      expect(payload.fields[0].name).toBe('id');
      expect(payload.fields[1].name).toBe('name');
    });
  });

  describe('異常系', () => {
    it('指定したヘッダーが見つからない場合、エラーを返す', async () => {
      // テストデータ: 異なるヘッダー（X, Y）
      mockGet.mockResolvedValueOnce(
        SheetsValuesGetResponseFactory.withValues([['X', 'Y']])
      );

      const result = await inferSchemaFromSheet({
        spreadsheetId: TEST_SPREADSHEET_ID,
        sheetName: TEST_SHEET_NAME,
        headers: TEST_HEADERS_JA,
      });

      // 検証1: エラーフラグ
      expect(result.isError).toBe(true);

      // 検証2: エラーメッセージ（実装の文言に合わせる）
      expect(result.content[0].text).toContain(
        'header row not found in the provided sheet/headers'
      );
    });

    it('空のシートデータの場合、エラーを返す', async () => {
      // テストデータ: 空の values
      mockGet.mockResolvedValueOnce(SheetsValuesGetResponseFactory.empty());

      const result = await inferSchemaFromSheet({
        spreadsheetId: TEST_SPREADSHEET_ID,
        sheetName: TEST_SHEET_NAME,
        headers: TEST_HEADERS_JA,
      });

      // 検証: エラーレスポンス
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('header row not found');
    });
  });
});
