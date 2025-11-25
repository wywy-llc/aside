import * as Factory from 'factory.ts';
import { OperationContext } from '../../src/tools/operation-catalog';
import { FeatureSchema } from '../../src/tools/schema-generator';

/**
 * FeatureSchema ファクトリー（内部）
 * @internal
 */
const featureSchemaFactory = Factory.Sync.makeFactory<FeatureSchema>({
  fields: [
    { name: 'id', type: 'string', column: 'A', required: true },
    { name: 'title', type: 'string', column: 'B', required: true },
  ],
  range: Factory.each(i => `Sheet${i}!A2:E`),
  rangeName: Factory.each(i => `RANGE_${i}`),
});

/**
 * OperationContext ファクトリー（内部）
 * @internal
 */
const operationContextFactory = Factory.Sync.makeFactory<OperationContext>({
  featureName: Factory.each(i => `Feature${i}`),
  featureNameCamel: Factory.each(i => `feature${i}`),
  schema: Factory.each(() => featureSchemaFactory.build()),
  rangeName: Factory.each(i => `RANGE_${i}`),
});

/**
 * FeatureSchema ファクトリー
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * const schema = FeatureSchemaFactory.build();
 *
 * // カスタムフィールド
 * const schema = FeatureSchemaFactory.build({
 *   fields: [
 *     { name: 'id', type: 'string', column: 'A' },
 *     { name: 'name', type: 'string', column: 'B' }
 *   ]
 * });
 *
 * // テスト前にシーケンスをリセット
 * beforeEach(() => {
 *   FeatureSchemaFactory.resetSequenceNumber();
 * });
 * ```
 */
export const FeatureSchemaFactory = {
  /**
   * テストデータの独立性を保証するためにシーケンス番号をリセット
   *
   * @remarks
   * 各テストの beforeEach フック内で呼び出すことを推奨
   */
  resetSequenceNumber: () => featureSchemaFactory.resetSequenceNumber(),

  /**
   * FeatureSchema インスタンスを生成
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns FeatureSchema インスタンス
   */
  build: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build(overrides),

  /**
   * Task プリセット（Todos シート）
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.task();
   * ```
   */
  task: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'id', type: 'string', column: 'A', required: true },
        { name: 'title', type: 'string', column: 'B', required: true },
      ],
      range: 'Tasks!A2:E',
      rangeName: 'TASK_RANGE',
      ...overrides,
    }),

  /**
   * Item プリセット（Items シート）
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.item();
   * ```
   */
  item: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'id', type: 'string', column: 'A', required: true },
        { name: 'title', type: 'string', column: 'B', required: true },
      ],
      range: 'Items!A2:E',
      rangeName: 'ITEM_RANGE',
      ...overrides,
    }),

  /**
   * 完全なTask プリセット（id, title, completed）
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.taskWithCompletion();
   * ```
   */
  taskWithCompletion: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'id', type: 'string', column: 'A', required: true },
        { name: 'title', type: 'string', column: 'B', required: true },
        { name: 'completed', type: 'boolean', column: 'C' },
      ],
      range: 'Tasks!A2:E',
      rangeName: 'TASK_RANGE',
      ...overrides,
    }),

  /**
   * User プリセット（name, age - ageはoptional）
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.user();
   * ```
   */
  user: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'name', type: 'string', column: 'A', required: true },
        { name: 'age', type: 'number', column: 'B' },
      ],
      range: 'Users!A2:B',
      rangeName: 'USER_RANGE',
      ...overrides,
    }),

  /**
   * Event プリセット（date型フィールド含む）
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.event();
   * ```
   */
  event: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'createdAt', type: 'date', column: 'A', required: true },
      ],
      range: 'Events!A2:A',
      rangeName: 'EVENT_RANGE',
      ...overrides,
    }),

  /**
   * User（email with description）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.userWithEmail();
   * ```
   */
  userWithEmail: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        {
          name: 'email',
          type: 'string',
          column: 'A',
          description: 'User email address',
        },
      ],
      range: 'Users!A2:A',
      rangeName: 'USER_RANGE',
      ...overrides,
    }),

  /**
   * User（boolean TRUE/FALSE format）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.userWithActive();
   * ```
   */
  userWithActive: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        {
          name: 'active',
          type: 'boolean',
          column: 'A',
          sheetsFormat: 'TRUE/FALSE',
        },
      ],
      range: 'Users!A2:A',
      rangeName: 'USER_RANGE',
      ...overrides,
    }),

  /**
   * Product（number fields）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.product();
   * ```
   */
  product: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'count', type: 'number', column: 'A' },
        { name: 'price', type: 'number', column: 'B' },
      ],
      range: 'Products!A2:B',
      rangeName: 'PRODUCT_RANGE',
      ...overrides,
    }),

  /**
   * Data（ソート順テスト用 - C, A, B）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.dataUnsorted();
   * ```
   */
  dataUnsorted: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'third', type: 'string', column: 'C' },
        { name: 'first', type: 'string', column: 'A' },
        { name: 'second', type: 'string', column: 'B' },
      ],
      range: 'Data!A2:C',
      rangeName: 'DATA_RANGE',
      ...overrides,
    }),

  /**
   * Setting（boolean TRUE/FALSE format）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.setting();
   * ```
   */
  setting: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        {
          name: 'enabled',
          type: 'boolean',
          column: 'A',
          sheetsFormat: 'TRUE/FALSE',
        },
      ],
      range: 'Settings!A2:A',
      rangeName: 'SETTING_RANGE',
      ...overrides,
    }),

  /**
   * Item（quantity number field）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.itemWithQuantity();
   * ```
   */
  itemWithQuantity: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [{ name: 'quantity', type: 'number', column: 'A' }],
      range: 'Items!A2:A',
      rangeName: 'ITEM_RANGE',
      ...overrides,
    }),

  /**
   * User（email required, age optional）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.userWithEmailRequired();
   * ```
   */
  userWithEmailRequired: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'email', type: 'string', column: 'A', required: true },
        { name: 'age', type: 'number', column: 'B' },
      ],
      range: 'Users!A2:B',
      rangeName: 'USER_RANGE',
      ...overrides,
    }),

  /**
   * Note（no required fields）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.note();
   * ```
   */
  note: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'note', type: 'string', column: 'A' },
        { name: 'tag', type: 'string', column: 'B' },
      ],
      range: 'Notes!A2:B',
      rangeName: 'NOTE_RANGE',
      ...overrides,
    }),

  /**
   * Item（all field types）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.itemWithAllTypes();
   * ```
   */
  itemWithAllTypes: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [
        { name: 'name', type: 'string', column: 'A' },
        { name: 'count', type: 'number', column: 'B' },
        { name: 'active', type: 'boolean', column: 'C' },
        { name: 'createdAt', type: 'date', column: 'D' },
      ],
      range: 'Items!A2:D',
      rangeName: 'ITEM_RANGE',
      ...overrides,
    }),

  /**
   * Empty（no fields）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.empty();
   * ```
   */
  empty: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [],
      range: 'Empty!A2:A',
      rangeName: 'EMPTY_RANGE',
      ...overrides,
    }),

  /**
   * Single（single field）プリセット
   *
   * @example
   * ```typescript
   * const schema = FeatureSchemaFactory.single();
   * ```
   */
  single: (overrides?: Partial<FeatureSchema>) =>
    featureSchemaFactory.build({
      fields: [{ name: 'value', type: 'string', column: 'A' }],
      range: 'Single!A2:A',
      rangeName: 'SINGLE_RANGE',
      ...overrides,
    }),
} as const;

/**
 * OperationContext ファクトリー
 *
 * @example
 * ```typescript
 * // 基本的な使用
 * const context = OperationContextFactory.build();
 *
 * // カスタム機能名
 * const context = OperationContextFactory.build({
 *   featureName: 'Todo',
 *   featureNameCamel: 'todo'
 * });
 *
 * // テスト前にシーケンスをリセット
 * beforeEach(() => {
 *   OperationContextFactory.resetSequenceNumber();
 * });
 * ```
 */
export const OperationContextFactory = {
  /**
   * テストデータの独立性を保証するためにシーケンス番号をリセット
   *
   * @remarks
   * 各テストの beforeEach フック内で呼び出すことを推奨
   */
  resetSequenceNumber: () => operationContextFactory.resetSequenceNumber(),

  /**
   * OperationContext インスタンスを生成
   *
   * @param overrides - 上書きする値（オプショナル）
   * @returns OperationContext インスタンス
   */
  build: (overrides?: Partial<OperationContext>) =>
    operationContextFactory.build(overrides),

  /**
   * Todo プリセット
   *
   * @example
   * ```typescript
   * const context = OperationContextFactory.todo();
   * ```
   */
  todo: (overrides?: Partial<OperationContext>) =>
    operationContextFactory.build({
      featureName: 'Todo',
      featureNameCamel: 'todo',
      schema: FeatureSchemaFactory.task(),
      rangeName: 'TASK_RANGE',
      ...overrides,
    }),

  /**
   * Item プリセット
   *
   * @example
   * ```typescript
   * const context = OperationContextFactory.item();
   * ```
   */
  item: (overrides?: Partial<OperationContext>) =>
    operationContextFactory.build({
      featureName: 'Item',
      featureNameCamel: 'item',
      schema: FeatureSchemaFactory.item(),
      rangeName: 'ITEM_RANGE',
      ...overrides,
    }),

  /**
   * Task プリセット
   *
   * @example
   * ```typescript
   * const context = OperationContextFactory.task();
   * ```
   */
  task: (overrides?: Partial<OperationContext>) =>
    operationContextFactory.build({
      featureName: 'Task',
      featureNameCamel: 'task',
      schema: FeatureSchemaFactory.task(),
      rangeName: 'TASK_RANGE',
      ...overrides,
    }),
} as const;

/**
 * すべてのファクトリーのシーケンス番号を一括リセット
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetAllFactories();
 * });
 * ```
 */
export const resetAllFactories = () => {
  FeatureSchemaFactory.resetSequenceNumber();
  OperationContextFactory.resetSequenceNumber();
};
