import * as Factory from 'factory.ts';

/**
 * Google Sheets API spreadsheets.values.get レスポンスの型定義
 */
export interface SheetsValuesGetResponse {
  data: {
    values?: string[][];
  };
}

/**
 * Google Translate API translations.list レスポンスの型定義
 */
export interface TranslateListResponse {
  data: {
    translations?: Array<{
      translatedText: string;
    }>;
  };
}

// ============================================
// Factory Instances
// ============================================

/**
 * Sheets API values.get レスポンスファクトリー（内部）
 * @internal
 */
const sheetsValuesGetResponseFactory =
  Factory.Sync.makeFactory<SheetsValuesGetResponse>({
    data: {
      values: [],
    },
  });

/**
 * Translate API translations.list レスポンスファクトリー（内部）
 * @internal
 */
const translateListResponseFactory =
  Factory.Sync.makeFactory<TranslateListResponse>({
    data: {
      translations: [],
    },
  });

// ============================================
// Exported Factory Objects
// ============================================

/**
 * Google Sheets API spreadsheets.values.get レスポンスファクトリー
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * const response = SheetsValuesGetResponseFactory.build();
 *
 * // ヘッダー行を含むレスポンス
 * const response = SheetsValuesGetResponseFactory.withHeaders(['ID', '名前']);
 *
 * // ヘッダーとデータ行を含むレスポンス
 * const response = SheetsValuesGetResponseFactory.withValues([
 *   ['ID', '名前'],
 *   ['1', 'foo']
 * ]);
 * ```
 */
export const SheetsValuesGetResponseFactory = {
  /**
   * テストデータの独立性を保証するためにシーケンス番号をリセット
   *
   * @remarks
   * 各テストの beforeEach フック内で呼び出すことを推奨
   */
  resetSequenceNumber: () =>
    sheetsValuesGetResponseFactory.resetSequenceNumber(),

  /**
   * Sheets API レスポンスインスタンスを生成
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns SheetsValuesGetResponse インスタンス
   */
  build: (overrides?: Partial<SheetsValuesGetResponse>) =>
    sheetsValuesGetResponseFactory.build(overrides),

  /**
   * ヘッダー行のみを含むレスポンスプリセット
   *
   * @param headers - ヘッダー行の配列
   * @param overrides - 上書きする値（オプショナル）
   * @returns SheetsValuesGetResponse インスタンス
   * @example
   * ```typescript
   * const response = SheetsValuesGetResponseFactory.withHeaders(['ID', '名前']);
   * // => { data: { values: [['ID', '名前']] } }
   * ```
   */
  withHeaders: (
    headers: string[],
    overrides?: Partial<SheetsValuesGetResponse>
  ) =>
    sheetsValuesGetResponseFactory.build({
      data: {
        values: [headers],
      },
      ...overrides,
    }),

  /**
   * 複数行のデータを含むレスポンスプリセット
   *
   * @param values - 2次元配列のデータ（ヘッダー行を含む）
   * @param overrides - 上書きする値（オプショナル）
   * @returns SheetsValuesGetResponse インスタンス
   * @example
   * ```typescript
   * const response = SheetsValuesGetResponseFactory.withValues([
   *   ['ID', '名前'],
   *   ['1', 'foo'],
   *   ['2', 'bar']
   * ]);
   * ```
   */
  withValues: (
    values: string[][],
    overrides?: Partial<SheetsValuesGetResponse>
  ) =>
    sheetsValuesGetResponseFactory.build({
      data: {
        values,
      },
      ...overrides,
    }),

  /**
   * 空のレスポンスプリセット（エラーテスト用）
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns SheetsValuesGetResponse インスタンス
   * @example
   * ```typescript
   * const response = SheetsValuesGetResponseFactory.empty();
   * // => { data: { values: [] } }
   * ```
   */
  empty: (overrides?: Partial<SheetsValuesGetResponse>) =>
    sheetsValuesGetResponseFactory.build({
      data: {
        values: [],
      },
      ...overrides,
    }),
} as const;

/**
 * Google Translate API translations.list レスポンスファクトリー
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * const response = TranslateListResponseFactory.build();
 *
 * // 翻訳結果を含むレスポンス
 * const response = TranslateListResponseFactory.withTranslations([
 *   'ID', 'Name', 'Number'
 * ]);
 * ```
 */
export const TranslateListResponseFactory = {
  /**
   * テストデータの独立性を保証するためにシーケンス番号をリセット
   *
   * @remarks
   * 各テストの beforeEach フック内で呼び出すことを推奨
   */
  resetSequenceNumber: () => translateListResponseFactory.resetSequenceNumber(),

  /**
   * Translate API レスポンスインスタンスを生成
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns TranslateListResponse インスタンス
   */
  build: (overrides?: Partial<TranslateListResponse>) =>
    translateListResponseFactory.build(overrides),

  /**
   * 翻訳結果を含むレスポンスプリセット
   *
   * @param translations - 翻訳されたテキストの配列
   * @param overrides - 上書きする値（オプショナル）
   * @returns TranslateListResponse インスタンス
   * @example
   * ```typescript
   * const response = TranslateListResponseFactory.withTranslations([
   *   'ID', 'Name', 'Number'
   * ]);
   * // => { data: { translations: [
   * //   { translatedText: 'ID' },
   * //   { translatedText: 'Name' },
   * //   { translatedText: 'Number' }
   * // ] } }
   * ```
   */
  withTranslations: (
    translations: string[],
    overrides?: Partial<TranslateListResponse>
  ) =>
    translateListResponseFactory.build({
      data: {
        translations: translations.map(text => ({ translatedText: text })),
      },
      ...overrides,
    }),

  /**
   * 空のレスポンスプリセット（エラーテスト用）
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns TranslateListResponse インスタンス
   * @example
   * ```typescript
   * const response = TranslateListResponseFactory.empty();
   * // => { data: { translations: [] } }
   * ```
   */
  empty: (overrides?: Partial<TranslateListResponse>) =>
    translateListResponseFactory.build({
      data: {
        translations: [],
      },
      ...overrides,
    }),
} as const;

/**
 * すべてのGoogle APIファクトリーのシーケンス番号を一括リセット
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetAllGoogleApisFactories();
 * });
 * ```
 */
export const resetAllGoogleApisFactories = () => {
  SheetsValuesGetResponseFactory.resetSequenceNumber();
  TranslateListResponseFactory.resetSequenceNumber();
};
