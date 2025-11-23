import { Todo } from '../../core/types.js';
import { UniversalTodoRepo } from './UniversalTodoRepo.js';

export class TodoUseCase {
  constructor(private repo: UniversalTodoRepo) {}

  async listTodos(): Promise<Todo[]> {
    return this.repo.getTodos();
  }

  async addTodo(title: string): Promise<Todo> {
    if (!title) throw new Error('Title is required');
    return this.repo.addTodo(title);
  }

  async toggleTodo(id: string): Promise<void> {
    const todos = await this.repo.getTodos();
    const todo = todos.find(t => t.id === id);
    if (!todo) throw new Error('Todo not found');

    await this.repo.updateTodo(id, { completed: !todo.completed });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.repo.deleteTodo(id);
  }
}
