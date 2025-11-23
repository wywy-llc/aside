import { UniversalSheetsClient } from '@/core/client';
import { TodoUseCase } from '@/features/todo/TodoUseCase';
import { UniversalTodoRepo } from '@/features/todo/UniversalTodoRepo';
import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

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

describe('TodoUseCase Integration', () => {
  let client: UniversalSheetsClient;
  let repo: UniversalTodoRepo;
  let useCase: TodoUseCase;

  beforeEach(async () => {
    if (!SHOULD_RUN_TESTS) {
      return;
    }
    client = new UniversalSheetsClient();
    repo = new UniversalTodoRepo(client, SPREADSHEET_ID);
    useCase = new TodoUseCase(repo);
  });

  it('should add and retrieve a todo', async () => {
    if (!SHOULD_RUN_TESTS) {
      console.warn('Skipping test: No valid service account or SPREADSHEET_ID');
      return;
    }
    const title = `Test Todo ${Date.now()}`;
    const todo = await useCase.addTodo(title);

    expect(todo.title).toBe(title);
    expect(todo.id).toBeDefined();
    expect(todo.completed).toBe(false);

    const list = await useCase.listTodos();
    const found = list.find(t => t.id === todo.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe(title);

    // Cleanup
    await useCase.deleteTodo(todo.id);
  });

  it('should toggle completion status', async () => {
    if (!SHOULD_RUN_TESTS) {
      console.warn('Skipping test: No valid service account or SPREADSHEET_ID');
      return;
    }
    const title = `Toggle Test ${Date.now()}`;
    const todo = await useCase.addTodo(title);

    await useCase.toggleTodo(todo.id);

    const list = await useCase.listTodos();
    const updated = list.find(t => t.id === todo.id);
    expect(updated?.completed).toBe(true);

    // Cleanup
    await useCase.deleteTodo(todo.id);
  });
});
