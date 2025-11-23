import { beforeEach, describe, expect, it } from 'vitest';
import { UniversalSheetsClient } from '../../src/core/client.js';
import { TodoUseCase } from '../../src/features/todo/TodoUseCase.js';
import { UniversalTodoRepo } from '../../src/features/todo/UniversalTodoRepo.js';

const SPREADSHEET_ID = process.env.TEST_SPREADSHEET_ID || '';

describe('TodoUseCase Integration', () => {
  let client: UniversalSheetsClient;
  let repo: UniversalTodoRepo;
  let useCase: TodoUseCase;

  beforeEach(async () => {
    if (!SPREADSHEET_ID) {
      return;
    }
    client = new UniversalSheetsClient();
    repo = new UniversalTodoRepo(client, SPREADSHEET_ID);
    useCase = new TodoUseCase(repo);
  });

  it('should add and retrieve a todo', async () => {
    if (!SPREADSHEET_ID) {
      console.warn('Skipping test: No SPREADSHEET_ID');
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
    if (!SPREADSHEET_ID) return;
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
