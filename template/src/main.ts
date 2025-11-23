import { UniversalSheetsClient } from './core/client.js';
import { TodoUseCase } from './features/todo/TodoUseCase.js';
import { UniversalTodoRepo } from './features/todo/UniversalTodoRepo.js';

// Global functions for GAS
declare const global: any;

const SPREADSHEET_ID = ScriptApp.getActiveSpreadsheet().getId();

function getUseCase() {
  const client = new UniversalSheetsClient();
  const repo = new UniversalTodoRepo(client, SPREADSHEET_ID);
  return new TodoUseCase(repo);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wyside Todo')
    .addItem('Show Todos', 'showTodoUI')
    .addToUi();
}

function showTodoUI() {
  const html =
    HtmlService.createHtmlOutputFromFile('index').setTitle('Wyside Todo');
  SpreadsheetApp.getUi().showSidebar(html);
}

// API Functions exposed to client-side script
function apiListTodos() {
  return getUseCase().listTodos();
}

function apiAddTodo(title: string) {
  return getUseCase().addTodo(title);
}

function apiToggleTodo(id: string) {
  return getUseCase().toggleTodo(id);
}

function apiDeleteTodo(id: string) {
  return getUseCase().deleteTodo(id);
}

// Expose to global for GAS
(global as any).onOpen = onOpen;
(global as any).showTodoUI = showTodoUI;
(global as any).apiListTodos = apiListTodos;
(global as any).apiAddTodo = apiAddTodo;
(global as any).apiToggleTodo = apiToggleTodo;
(global as any).apiDeleteTodo = apiDeleteTodo;
