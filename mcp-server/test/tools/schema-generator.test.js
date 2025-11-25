import { generateDefaults, generateObjectToRow, generateRowToObject, generateTypeDefinition, generateValidation, } from '@/tools/schema-generator';
import { describe, expect, it } from 'vitest';
describe('Schema Generator', () => {
    describe('generateTypeDefinition', () => {
        it('should generate correct TypeScript interface', () => {
            const schema = {
                fields: [
                    { name: 'id', type: 'string', column: 'A', required: true },
                    { name: 'title', type: 'string', column: 'B', required: true },
                    { name: 'completed', type: 'boolean', column: 'C' },
                ],
                range: 'Tasks!A2:E',
                rangeName: 'TASK_RANGE',
            };
            const result = generateTypeDefinition('Task', schema);
            expect(result).toContain('export interface Task {');
            expect(result).toContain('id: string;');
            expect(result).toContain('title: string;');
            expect(result).toContain('completed?: boolean;');
        });
        it('should handle optional fields', () => {
            const schema = {
                fields: [
                    { name: 'name', type: 'string', column: 'A', required: true },
                    { name: 'age', type: 'number', column: 'B' },
                ],
                range: 'Users!A2:B',
                rangeName: 'USER_RANGE',
            };
            const result = generateTypeDefinition('User', schema);
            expect(result).toContain('name: string;');
            expect(result).toContain('age?: number;');
        });
        it('should convert date type to string', () => {
            const schema = {
                fields: [
                    { name: 'createdAt', type: 'date', column: 'A', required: true },
                ],
                range: 'Events!A2:A',
                rangeName: 'EVENT_RANGE',
            };
            const result = generateTypeDefinition('Event', schema);
            expect(result).toContain('createdAt: string;');
        });
        it('should include field descriptions as JSDoc comments', () => {
            const schema = {
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
            };
            const result = generateTypeDefinition('User', schema);
            expect(result).toContain('/** User email address */');
            expect(result).toContain('email?: string;');
        });
    });
    describe('generateRowToObject', () => {
        it('should generate row-to-object conversion function', () => {
            const schema = {
                fields: [
                    { name: 'id', type: 'string', column: 'A' },
                    { name: 'title', type: 'string', column: 'B' },
                ],
                range: 'Tasks!A2:C',
                rangeName: 'TASK_RANGE',
            };
            const result = generateRowToObject('Task', schema);
            expect(result).toContain('const rowToTask = (row: string[]): Task =>');
            expect(result).toContain('id: row[0]');
            expect(result).toContain('title: row[1]');
        });
        it('should handle boolean conversion with TRUE/FALSE format', () => {
            const schema = {
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
            };
            const result = generateRowToObject('User', schema);
            expect(result).toContain("active: row[0] === 'TRUE'");
        });
        it('should handle number conversion', () => {
            const schema = {
                fields: [
                    { name: 'count', type: 'number', column: 'A' },
                    { name: 'price', type: 'number', column: 'B' },
                ],
                range: 'Products!A2:B',
                rangeName: 'PRODUCT_RANGE',
            };
            const result = generateRowToObject('Product', schema);
            expect(result).toContain('count: Number(row[0])');
            expect(result).toContain('price: Number(row[1])');
        });
        it('should sort fields by column index', () => {
            const schema = {
                fields: [
                    { name: 'third', type: 'string', column: 'C' },
                    { name: 'first', type: 'string', column: 'A' },
                    { name: 'second', type: 'string', column: 'B' },
                ],
                range: 'Data!A2:C',
                rangeName: 'DATA_RANGE',
            };
            const result = generateRowToObject('Data', schema);
            const firstIndex = result.indexOf('first: row[0]');
            const secondIndex = result.indexOf('second: row[1]');
            const thirdIndex = result.indexOf('third: row[2]');
            expect(firstIndex).toBeLessThan(secondIndex);
            expect(secondIndex).toBeLessThan(thirdIndex);
        });
    });
    describe('generateObjectToRow', () => {
        it('should generate object-to-row conversion function', () => {
            const schema = {
                fields: [
                    { name: 'id', type: 'string', column: 'A' },
                    { name: 'name', type: 'string', column: 'B' },
                ],
                range: 'Users!A2:B',
                rangeName: 'USER_RANGE',
            };
            const result = generateObjectToRow('User', schema);
            expect(result).toContain('const userToRow = (obj: User): string[] =>');
            expect(result).toContain('obj.id');
            expect(result).toContain('obj.name');
        });
        it('should handle boolean conversion with TRUE/FALSE format', () => {
            const schema = {
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
            };
            const result = generateObjectToRow('Setting', schema);
            expect(result).toContain("obj.enabled ? 'TRUE' : 'FALSE'");
        });
        it('should convert numbers to strings', () => {
            const schema = {
                fields: [{ name: 'quantity', type: 'number', column: 'A' }],
                range: 'Items!A2:A',
                rangeName: 'ITEM_RANGE',
            };
            const result = generateObjectToRow('Item', schema);
            expect(result).toContain('String(obj.quantity ?? "")');
        });
    });
    describe('generateValidation', () => {
        it('should generate validation function for required fields', () => {
            const schema = {
                fields: [
                    { name: 'email', type: 'string', column: 'A', required: true },
                    { name: 'age', type: 'number', column: 'B' },
                ],
                range: 'Users!A2:B',
                rangeName: 'USER_RANGE',
            };
            const result = generateValidation('User', schema);
            expect(result).toContain('const validateUser = (obj: Partial<User>)');
            expect(result).toContain("throw new Error('email is required')");
        });
        it('should handle schemas with no required fields', () => {
            const schema = {
                fields: [
                    { name: 'note', type: 'string', column: 'A' },
                    { name: 'tag', type: 'string', column: 'B' },
                ],
                range: 'Notes!A2:B',
                rangeName: 'NOTE_RANGE',
            };
            const result = generateValidation('Note', schema);
            expect(result).toContain('const validateNote = (obj: Partial<Note>)');
            // No validation checks should be generated
            expect(result).not.toContain('throw new Error');
        });
    });
    describe('generateDefaults', () => {
        it('should generate default values based on field types', () => {
            const schema = {
                fields: [
                    { name: 'name', type: 'string', column: 'A' },
                    { name: 'count', type: 'number', column: 'B' },
                    { name: 'active', type: 'boolean', column: 'C' },
                    { name: 'createdAt', type: 'date', column: 'D' },
                ],
                range: 'Items!A2:D',
                rangeName: 'ITEM_RANGE',
            };
            const result = generateDefaults('Item', schema);
            expect(result).toContain('const defaultItem: Item = {');
            expect(result).toContain("name: ''");
            expect(result).toContain('count: 0');
            expect(result).toContain('active: false');
            expect(result).toContain('createdAt: new Date().toISOString()');
        });
    });
    describe('Edge Cases', () => {
        it('should handle empty schema', () => {
            const schema = {
                fields: [],
                range: 'Empty!A2:A',
                rangeName: 'EMPTY_RANGE',
            };
            const result = generateTypeDefinition('Empty', schema);
            expect(result).toContain('export interface Empty {');
            expect(result).toContain('}');
        });
        it('should handle single field schema', () => {
            const schema = {
                fields: [{ name: 'value', type: 'string', column: 'A' }],
                range: 'Single!A2:A',
                rangeName: 'SINGLE_RANGE',
            };
            const result = generateTypeDefinition('Single', schema);
            expect(result).toContain('value?: string;');
        });
    });
});
