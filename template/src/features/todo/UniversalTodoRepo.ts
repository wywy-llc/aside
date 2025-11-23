import { UniversalSheetsClient } from '../../core/client.js';
import { TODO_RANGE } from '../../core/constants.js';
import { Todo } from '../../core/types.js';

// Utility for UUID
function generateUuid(): string {
  if (typeof Utilities !== 'undefined') {
    return Utilities.getUuid();
  }
  // Node.js environment setup should provide crypto
  return crypto.randomUUID();
}

export class UniversalTodoRepo {
  constructor(
    private client: UniversalSheetsClient,
    private spreadsheetId: string
  ) {}

  async getTodos(): Promise<Todo[]> {
    const response = await this.client.batchGet(this.spreadsheetId, [
      TODO_RANGE,
    ]);
    const rows = response.valueRanges?.[0]?.values || [];
    return rows.map((row: string[]) => ({
      id: row[0],
      title: row[1],
      completed: row[2] === 'TRUE',
      createdAt: row[3],
      updatedAt: row[4],
    }));
  }

  async addTodo(title: string): Promise<Todo> {
    const todo: Todo = {
      id: generateUuid(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rowValues = [
      todo.id,
      todo.title,
      todo.completed ? 'TRUE' : 'FALSE',
      todo.createdAt,
      todo.updatedAt,
    ];

    // Use AppendCellsRequest via batchUpdate
    const request = {
      appendCells: {
        sheetId: 0, // Assumes first sheet.
        rows: [
          {
            values: rowValues.map(v => ({
              userEnteredValue: { stringValue: v },
            })),
          },
        ],
        fields: '*',
      },
    };

    await this.client.batchUpdate(this.spreadsheetId, [request]);
    return todo;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    // Fetch current data to find row index
    const todos = await this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Todo ${id} not found`);

    // Row index in sheet = index + 1 (0-based API index, considering header is at 0)
    // If A2 is first data, header is A1. API index 0 is Row 1. API index 1 is Row 2.
    const rowIndex = index + 1;

    const current = todos[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const values = [
      updated.id,
      updated.title,
      updated.completed ? 'TRUE' : 'FALSE',
      updated.createdAt,
      updated.updatedAt,
    ];

    const request = {
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        rows: [
          {
            values: values.map(v => ({ userEnteredValue: { stringValue: v } })),
          },
        ],
        fields: '*',
      },
    };

    await this.client.batchUpdate(this.spreadsheetId, [request]);
  }

  async deleteTodo(id: string): Promise<void> {
    const todos = await this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Todo ${id} not found`);

    const rowIndex = index + 1;

    const request = {
      deleteDimension: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    };

    await this.client.batchUpdate(this.spreadsheetId, [request]);
  }
}
