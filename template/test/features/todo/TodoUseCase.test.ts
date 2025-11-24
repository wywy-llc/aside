import { SheetsClient } from '@/core/client';
import { TodoUseCase } from '@/features/todo/TodoUseCase';
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Todo } from '@/core/types';

const SPREADSHEET_ID = process.env.APP_SPREADSHEET_ID_1_DEV || '';

// Check if service account key is a dummy
function isValidServiceAccount(): boolean {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) return false;

  try {
    const keyContent = fs.readFileSync(path.resolve(keyPath), 'utf-8');
    const key = JSON.parse(keyContent);
    // Check if it's a dummy key
    return (
      key.private_key &&
      !key.private_key.includes('DUMMY_PRIVATE_KEY') &&
      key.project_id !== 'dummy-project'
    );
  } catch {
    return false;
  }
}

const SHOULD_RUN_TESTS =
  SPREADSHEET_ID &&
  isValidServiceAccount() &&
  !SPREADSHEET_ID.includes('_abc123');

// Helper to check if a sheet exists
async function sheetExists(
  client: typeof SheetsClient,
  spreadsheetId: string,
  sheetName: string
): Promise<boolean> {
  try {
    await client.batchGet(spreadsheetId, [`${sheetName}!A1`]);
    return true;
  } catch (error: any) {
    if (error?.message?.includes('Unable to parse range')) {
      return false;
    }
    throw error;
  }
}

// Helper to rename the first sheet to 'Todos' and add headers
async function createSheet(
  client: typeof SheetsClient,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  // Rename the first sheet (sheetId: 0) to 'Todos'
  await client.batchUpdate(spreadsheetId, [
    {
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          title: sheetName,
        },
        fields: 'title',
      },
    },
  ]);

  // Add header row to the first sheet
  await client.batchUpdate(spreadsheetId, [
    {
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        rows: [
          {
            values: [
              { userEnteredValue: { stringValue: 'ID' } },
              { userEnteredValue: { stringValue: 'Title' } },
              { userEnteredValue: { stringValue: 'Completed' } },
              { userEnteredValue: { stringValue: 'Created' } },
              { userEnteredValue: { stringValue: 'Updated' } },
            ],
          },
        ],
        fields: 'userEnteredValue',
      },
    },
  ]);
}

describe('TodoUseCase Integration', () => {
  beforeAll(async () => {
    if (!SHOULD_RUN_TESTS) {
      return;
    }

    // Ensure Todos sheet exists
    const exists = await sheetExists(SheetsClient, SPREADSHEET_ID, 'Todos');
    if (!exists) {
      console.log('Creating Todos sheet...');
      await createSheet(SheetsClient, SPREADSHEET_ID, 'Todos');
    }
  });

  it('should add and retrieve a todo', async () => {
    if (!SHOULD_RUN_TESTS) {
      console.warn('Skipping test: No valid service account or SPREADSHEET_ID');
      return;
    }
    const title = `Test Todo ${Date.now()}`;
    const todo = await TodoUseCase.addTodo(title);

    expect(todo.title).toBe(title);
    expect(todo.id).toBeDefined();
    expect(todo.completed).toBe(false);

    const list = await TodoUseCase.listTodos();
    const found = list.find((t: Todo) => t.id === todo.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe(title);

    // Cleanup
    await TodoUseCase.deleteTodo(todo.id);
  });

  it('should toggle completion status', async () => {
    if (!SHOULD_RUN_TESTS) {
      console.warn('Skipping test: No valid service account or SPREADSHEET_ID');
      return;
    }
    const title = `Toggle Test ${Date.now()}`;
    const todo = await TodoUseCase.addTodo(title);

    await TodoUseCase.toggleTodo(todo.id);

    const list = await TodoUseCase.listTodos();
    const updated = list.find((t: Todo) => t.id === todo.id);
    expect(updated?.completed).toBe(true);

    // Cleanup
    await TodoUseCase.deleteTodo(todo.id);
  });
});
