import {
  generateExportsList,
  generateOperationCode,
  generateOperationsCodes,
  getAllOperationIds,
  getOperationDefinition,
  getOperationsByCategory,
  type OperationContext,
} from '@/tools/operation-catalog';
import type { FeatureSchema } from '@/tools/schema-generator';
import { describe, expect, it } from 'vitest';

describe('Operation Catalog', () => {
  const testSchema: FeatureSchema = {
    fields: [
      { name: 'id', type: 'string', column: 'A', required: true },
      { name: 'title', type: 'string', column: 'B', required: true },
    ],
    range: 'Tasks!A2:E',
    rangeName: 'TASK_RANGE',
  };

  describe('getOperationDefinition', () => {
    it('should return operation definition for valid ID', () => {
      const operation = getOperationDefinition('getAll');

      expect(operation).toBeDefined();
      expect(operation?.id).toBe('getAll');
      expect(operation?.category).toBe('data');
      expect(operation?.description).toBeTruthy();
    });

    it('should return undefined for invalid ID', () => {
      const operation = getOperationDefinition('nonexistent');

      expect(operation).toBeUndefined();
    });

    it('should have all required properties', () => {
      const operation = getOperationDefinition('create');

      expect(operation).toHaveProperty('id');
      expect(operation).toHaveProperty('category');
      expect(operation).toHaveProperty('description');
      expect(operation).toHaveProperty('parameters');
      expect(operation).toHaveProperty('returnType');
      expect(operation).toHaveProperty('generate');
      expect(typeof operation?.generate).toBe('function');
    });
  });

  describe('getOperationsByCategory', () => {
    it('should return operations for data category', () => {
      const operations = getOperationsByCategory('data');

      expect(operations.length).toBeGreaterThan(0);
      operations.forEach(op => {
        expect(op.category).toBe('data');
      });
    });

    it('should return operations for format category', () => {
      const operations = getOperationsByCategory('format');

      expect(operations.length).toBeGreaterThan(0);
      operations.forEach(op => {
        expect(op.category).toBe('format');
      });
    });

    it('should return operations for structure category', () => {
      const operations = getOperationsByCategory('structure');

      expect(operations.length).toBeGreaterThan(0);
      operations.forEach(op => {
        expect(op.category).toBe('structure');
      });
    });
  });

  describe('getAllOperationIds', () => {
    it('should return all operation IDs', () => {
      const ids = getAllOperationIds();

      expect(ids.length).toBeGreaterThan(0);
      expect(ids).toContain('getAll');
      expect(ids).toContain('create');
      expect(ids).toContain('update');
      expect(ids).toContain('delete');
    });

    it('should return unique IDs', () => {
      const ids = getAllOperationIds();
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('generateOperationCode', () => {
    const context: OperationContext = {
      featureName: 'Todo',
      featureNameCamel: 'todo',
      schema: testSchema,
      rangeName: 'TASK_RANGE',
    };

    it('should generate code for getAll operation', () => {
      const code = generateOperationCode('getAll', context);

      expect(code).toContain('const getAll');
      expect(code).toContain('TASK_RANGE');
      expect(code).toContain('SheetsClient.batchGet');
      expect(code).toContain('async');
    });

    it('should generate code for create operation', () => {
      const code = generateOperationCode('create', context);

      expect(code).toContain('const create');
      expect(code).toContain('Todo');
      expect(code).toContain('SheetsClient');
    });

    it('should generate code for update operation', () => {
      const code = generateOperationCode('update', context);

      expect(code).toContain('const update');
      expect(code).toContain('rowIndex');
      expect(code).toContain('SheetsClient');
    });

    it('should generate code for delete operation', () => {
      const code = generateOperationCode('delete', context);

      expect(code).toContain('const delete');
      expect(code).toContain('rowIndex');
      expect(code).toContain('SheetsClient');
    });

    it('should throw error for unknown operation', () => {
      expect(() => {
        generateOperationCode('nonexistent', context);
      }).toThrow('Unknown operation: nonexistent');
    });

    it('should use feature name in generated function names', () => {
      const customContext = { ...context, featureName: 'Task' };
      const code = generateOperationCode('getById', customContext);

      expect(code).toContain('Task');
    });
  });

  describe('generateOperationsCodes', () => {
    const context: OperationContext = {
      featureName: 'Item',
      featureNameCamel: 'item',
      schema: testSchema,
      rangeName: 'ITEM_RANGE',
    };

    it('should generate code for multiple operations', () => {
      const code = generateOperationsCodes(
        ['create', 'getAll', 'update'],
        context
      );

      expect(code).toContain('const create');
      expect(code).toContain('const getAll');
      expect(code).toContain('const update');
    });

    it('should separate operations with double newlines', () => {
      const code = generateOperationsCodes(['create', 'getAll'], context);

      expect(code).toMatch(/const create[\s\S]+\n\n[\s\S]+const getAll/);
    });

    it('should handle empty operations array', () => {
      const code = generateOperationsCodes([], context);

      expect(code).toBe('');
    });

    it('should maintain order of operations', () => {
      const code = generateOperationsCodes(
        ['delete', 'create', 'getAll'],
        context
      );

      const deleteIndex = code.indexOf('const delete');
      const createIndex = code.indexOf('const create');
      const getAllIndex = code.indexOf('const getAll');

      expect(deleteIndex).toBeLessThan(createIndex);
      expect(createIndex).toBeLessThan(getAllIndex);
    });
  });

  describe('generateExportsList', () => {
    it('should generate exports list for operations', () => {
      const exports = generateExportsList([
        'create',
        'getAll',
        'update',
        'delete',
      ]);

      expect(exports).toContain('export {');
      expect(exports).toContain('create');
      expect(exports).toContain('getAll');
      expect(exports).toContain('update');
      expect(exports).toContain('delete');
      expect(exports).toContain('};');
    });

    it('should handle single operation', () => {
      const exports = generateExportsList(['create']);

      expect(exports).toContain('export {');
      expect(exports).toContain('create');
      expect(exports).toContain('};');
    });

    it('should handle empty array', () => {
      const exports = generateExportsList([]);

      expect(exports).toContain('export {');
      expect(exports).toContain('};');
    });

    it('should format with proper indentation', () => {
      const exports = generateExportsList(['create', 'getAll']);

      expect(exports).toMatch(/export \{\n {2}\w+,\n {2}\w+,?\n\};/);
    });
  });

  describe('Operation Parameters Validation', () => {
    it('should have valid parameters for getAll', () => {
      const operation = getOperationDefinition('getAll');

      expect(operation?.parameters).toBeDefined();
      expect(Array.isArray(operation?.parameters)).toBe(true);
    });

    it('should have required parameters for create', () => {
      const operation = getOperationDefinition('create');

      expect(operation?.parameters.length).toBeGreaterThan(0);
      const hasRequiredParam = operation?.parameters.some(p => p.required);
      expect(hasRequiredParam).toBe(true);
    });

    it('should have rowIndex parameter for update', () => {
      const operation = getOperationDefinition('update');

      const hasRowIndex = operation?.parameters.some(
        p => p.name === 'rowIndex' || p.name.includes('index')
      );
      expect(hasRowIndex).toBe(true);
    });
  });

  describe('Return Types', () => {
    it('should have appropriate return types', () => {
      const getAll = getOperationDefinition('getAll');
      const create = getOperationDefinition('create');
      const update = getOperationDefinition('update');

      expect(getAll?.returnType).toBeTruthy();
      expect(create?.returnType).toBeTruthy();
      expect(update?.returnType).toBeTruthy();
    });

    it('should have array return type for getAll operation', () => {
      const getAll = getOperationDefinition('getAll');

      expect(getAll?.returnType).toContain('[]');
    });
  });

  describe('Integration Test', () => {
    it('should work with complete workflow', () => {
      // 1. Get all operation IDs
      const allIds = getAllOperationIds();
      expect(allIds.length).toBeGreaterThan(0);

      // 2. Get operations by category
      const dataOps = getOperationsByCategory('data');
      expect(dataOps.length).toBeGreaterThan(0);

      // 3. Generate code for selected operations
      const context: OperationContext = {
        featureName: 'Test',
        featureNameCamel: 'test',
        schema: testSchema,
        rangeName: 'TEST_RANGE',
      };

      const selectedOps = dataOps.slice(0, 2).map(op => op.id);
      const code = generateOperationsCodes(selectedOps, context);
      expect(code).toBeTruthy();

      // 4. Generate exports
      const exports = generateExportsList(selectedOps);
      expect(exports).toContain('export {');
    });
  });
});
