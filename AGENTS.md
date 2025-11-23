<!--
Copyright 2025 wywy LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
you may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
# Repository Guidelines

## Project Structure & Module Organization

- Core TypeScript sources live in `src/` (CLI entry in `index.ts`; helpers such as `clasp-helper.ts`, `package-helper.ts`, `config.ts`).
- Tests sit in `test/` alongside the matching module (e.g., `clasp-helper.test.ts`).
- Build artifacts are emitted to `dist/` via the TypeScript compiler and Rollup config in `rollup.config.mjs`.
- Templates for generated Apps Script projects are in `template/` and `template-ui/`; deployment helpers are in root `.mjs` files (`deploy-ui.mjs`, `setup-svelte.mjs`, `fix-animations.mjs`).

## Build, Test, and Development Commands

- `npm run lint` — runs license header check then ESLint with `--fix` over `src/` and `test/`.
- `npm run build` — cleans `build/`, lints, compiles with `tsc`, then copies `.gitignore` into `dist/`.
- `npm run test` — executes Vitest test suite headlessly.
- `npm run clean` — removes the transient `build/` directory.
- `npm run license` — verifies/adds Apache 2.0 headers as configured in `license-config.json`.
- Node.js 22+ is required (see `engines.node`); use `nvm use 22` or similar before running commands.

## Coding Style & Naming Conventions

- TypeScript throughout; prefer `const`/`let`, ES modules, and explicit return types on exported functions.
- Formatting and linting: ESLint + Prettier; rely on `npm run lint` for auto-fix. Keep default 2-space indentation.
- Naming: PascalCase for types/classes, camelCase for functions/variables, kebab-case for files. Mirror source/test file names (e.g., `compare.ts` ↔ `compare.test.ts`).
- Include minimal, purposeful comments; avoid duplication of obvious intent.

## Testing Guidelines

- Framework: Vitest with V8 coverage support available. Add new specs under `test/` with `.test.ts` suffix.
- Keep tests deterministic and file-system isolated; prefer fixtures under `__mocks__/` when needed.
- Run `npm test` before sending a PR; optionally add `vitest run --coverage` when changing core build/deploy logic.

## Commit & Pull Request Guidelines

- Follow Conventional Commits seen in history (`feat:`, `fix:`, `chore:`, `refactor:`, etc.). Keep subjects imperative and under ~72 chars.
- Ensure each commit passes `npm run lint` and `npm test`.
- PRs: include a short summary, linked issue (if any), test evidence/commands run, and notes on deployment impact (UI templates or Apps Script deploy flow).
- For template or UI changes, call out whether `deploy-ui.mjs` or `setup-svelte.mjs` behavior is affected.
