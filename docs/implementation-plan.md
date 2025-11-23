# wyside プロジェクト：TODO App テンプレート + MCP Server 統合 実装計画

## 📋 Executive Summary

### プロジェクト目的

`docs/index.html`で定義された「AI ネイティブ・ユニファイドアーキテクチャ」を実現する、wyside CLI の大規模拡張プロジェクト。

### 主要成果物

1. **Test-Separated Hybrid 構成のテンプレート** (`template/`)
2. **MCP Server 統合** (`mcp-server/`)
3. **完全 REST API 統一の TODO アプリ** (GAS/Local 両対応)
4. **GCP 自動セットアップ CLI** (`wyside init --setup-gcp`)
5. **検証環境** (`test-projects/todo-app/`)

### 技術スタック

| レイヤー    | 技術                                    |
| ----------- | --------------------------------------- |
| **Runtime** | Node.js 22+, Google Apps Script (V8)    |
| **言語**    | TypeScript (ES2020, Strict Mode)        |
| **API**     | Google Sheets API v4 (Advanced Service) |
| **認証**    | Service Account (Local), OAuth (GAS)    |
| **ビルド**  | Rollup, TSC                             |
| **テスト**  | Vitest (実 Spreadsheet 結合テスト)      |
| **MCP**     | @modelcontextprotocol/sdk               |
| **CLI**     | meow, inquirer                          |

---

## 🏗️ アーキテクチャ設計

### システム全体図

```text
┌─────────────────────────────────────────────────────────────┐
│  👨‍💻 Developer (VS Code)                                      │
│  ├─ wyside init --setup-gcp  ← 自動GCPセットアップ           │
│  ├─ wyside mcp               ← MCPサーバー起動               │
│  └─ npm test                 ← ローカル結合テスト実行        │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │  🤖 MCP Server          │
    │  (wyside内蔵)           │
    ├─────────────────────────┤
    │ Tools:                  │
    │ • sync_local_secrets    │ → GCP自動化
    │ • scaffold_feature      │ → コード生成
    │ • setup_named_range     │ → 範囲定義
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  📁 Generated Project   │
    │  (test-projects/todo)   │
    ├─────────────────────────┤
    │ src/                    │ → GAS本番コード
    │ test/                   │ → Local専用テスト
    │ secrets/                │ → Service Account
    └────────────┬────────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
    ┌─────────┐    ┌──────────┐
    │ 🚀 GAS  │    │ 💻 Local │
    │ Deploy  │    │ Vitest   │
    └─────────┘    └──────────┘
         │               │
         └───────┬───────┘
                 ▼
         ┌──────────────┐
         │ 📊 Google    │
         │ Spreadsheet  │
         │ (TODO Data)  │
         └──────────────┘
```

### Universal Client 環境分岐ロジック

```typescript
// src/core/client.ts
class UniversalSheetsClient {
  private detectEnvironment(): 'gas' | 'node' {
    return typeof UrlFetchApp !== 'undefined' ? 'gas' : 'node';
  }

  async batchUpdate(spreadsheetId, requests) {
    if (this.env === 'gas') {
      // GAS: UrlFetchApp + ScriptApp.getOAuthToken()
      return this.gasRequest(spreadsheetId, requests);
    } else {
      // Node: googleapis + Service Account
      return this.nodeRequest(spreadsheetId, requests);
    }
  }
}
```

---

## 📂 ディレクトリ構成

### 1. wyside プロジェクト全体

```text
wyside/
├── docs/
│   ├── index.html                    # 既存: アーキテクチャ仕様
│   └── implementation-plan.md        # 🆕 本ドキュメント
│
├── mcp-server/                       # 🆕 MCPサーバー実装
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # MCPエントリーポイント
│   │   ├── tools/
│   │   │   ├── sync-local-secrets.ts
│   │   │   ├── scaffold-feature.ts
│   │   │   └── setup-named-range.ts
│   │   └── templates/
│   │       ├── universal-repo.ts.hbs
│   │       └── usecase.ts.hbs
│   └── build/                        # TSビルド成果物
│
├── template/                         # 🔄 既存を大幅改修
│   ├── .clasp.json
│   ├── .claspignore
│   ├── appsscript.json               # 🆕 Advanced Services設定
│   ├── .env.example                  # 🆕
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts              # 🆕
│   │
│   ├── secrets/                      # 🆕 ローカル認証鍵
│   │   └── .gitkeep
│   │
│   ├── src/                          # 🔄 GAS本番コード
│   │   ├── main.ts                   # 🆕 エントリーポイント
│   │   │
│   │   ├── core/                     # 🆕 基盤層
│   │   │   ├── client.ts             # Universal Sheets Client
│   │   │   ├── auth.ts               # 認証ヘルパー
│   │   │   ├── types.ts              # 共通型定義
│   │   │   └── constants.ts          # 名前付き範囲定数
│   │   │
│   │   └── features/                 # 🆕 機能層
│   │       └── todo/
│   │           ├── TodoUseCase.ts
│   │           └── UniversalTodoRepo.ts
│   │
│   └── test/                         # 🆕 ローカル専用テスト
│       ├── setup.ts                  # .env読み込み
│       ├── vitest.config.ts
│       └── features/
│           └── todo/
│               └── TodoUseCase.test.ts
│
├── test-projects/                    # 🆕 検証環境
│   └── todo-app/                     # 実E2Eテスト用
│       └── (wyside init で生成)
│
└── src/                              # 既存CLI
    ├── app.ts                        # 🔄 MCP統合追加
    ├── config.ts                     # 🔄 configForTodoRest追加
    ├── mcp-setup.ts                  # 🆕 MCPヘルパー
    └── ...
```

### 2. `template/` 詳細構成 (Test-Separated Hybrid)

```text
template/
│
├── 🔧 設定ファイル群
│   ├── .clasp.json              # rootIDのみ、src/をデプロイ対象に
│   ├── .claspignore             # test/, mcp-server/, secrets/ 除外
│   ├── appsscript.json          # Advanced Services: Sheets v4有効化
│   ├── .env.example             # SPREADSHEET_ID, GCP_PROJECT_ID等
│   ├── .gitignore               # secrets/, .env 除外
│   ├── package.json             # googleapis等の依存関係
│   ├── tsconfig.json            # ES2020, strict
│   └── vitest.config.ts         # テスト設定
│
├── 🔐 secrets/                  # Local専用（.gitignore）
│   ├── .gitkeep
│   └── service-account.json     # GCP Service Account鍵
│
├── 🚀 src/                      # GAS本番コード（.claspでデプロイ）
│   │
│   ├── main.ts                  # GASエントリーポイント
│   │   • function onOpen()      → メニュー追加
│   │   • function doGet()       → Web App
│   │   • function apiAddTodo()  → google.script.run経由API
│   │   • function apiListTodos()
│   │   • function apiToggleTodo()
│   │
│   ├── core/                    # 基盤層
│   │   │
│   │   ├── client.ts            # 💜 Universal Sheets Client
│   │   │   • class UniversalSheetsClient
│   │   │   • detectEnvironment(): 'gas' | 'node'
│   │   │   • batchUpdate(spreadsheetId, requests)
│   │   │   • batchGet(spreadsheetId, ranges)
│   │   │   • getNodeAuth()      → Service Account認証
│   │   │   • gasRequest()       → UrlFetchApp実装
│   │   │
│   │   ├── auth.ts              # 認証ヘルパー
│   │   │   • getGasToken()      → ScriptApp.getOAuthToken()
│   │   │   • getLocalAuth()     → GoogleAuth from JSON
│   │   │
│   │   ├── types.ts             # 共通型定義
│   │   │   • type Todo = { id, title, completed, createdAt, updatedAt }
│   │   │   • type SheetsRequest = ...
│   │   │
│   │   └── constants.ts         # 名前付き範囲定数
│   │       • export const TODO_RANGE = 'Todos!A2:E'
│   │
│   └── features/                # 機能層（ドメイン駆動設計）
│       │
│       └── todo/
│           │
│           ├── TodoUseCase.ts   # ビジネスロジック
│           │   • addTodo(title): Promise<void>
│           │   • listTodos(): Promise<Todo[]>
│           │   • toggleTodo(id): Promise<void>
│           │   • deleteTodo(id): Promise<void>
│           │
│           └── UniversalTodoRepo.ts  # 💜 REST API統一実装
│               • constructor(spreadsheetId)
│               • addTodo(title)      → appendCells API
│               • getTodos()          → batchGet API
│               • updateTodo(id, updates) → updateCells API
│               • deleteTodo(id)      → deleteDimension API
│               • private parseRows() → APIレスポンス→Todo変換
│
└── ✅ test/                     # Local専用テスト（.claspignoreで除外）
    │
    ├── setup.ts                 # テスト前処理
    │   • dotenv.config()        → .env読み込み
    │   • 環境変数バリデーション
    │
    ├── vitest.config.ts
    │
    └── features/
        └── todo/
            └── TodoUseCase.test.ts  # 結合テスト
                • describe('TodoUseCase Integration')
                • it('should add and retrieve todo')
                • it('should toggle completion')
                • it('should delete todo')
                • 実Spreadsheet使用（TEST_SPREADSHEET_ID）
```

---

## 🔧 Phase 1: テンプレート基盤構築

### 目標

Test-Separated Hybrid 構成のテンプレート作成 + Universal Client 実装

### タスク

#### 1.1 設定ファイル群作成

**`template/.clasp.json`**

```json
{
  "scriptId": "",
  "rootDir": "./src",
  "parentId": []
}
```

**`template/.claspignore`**

```text
**/**
!src/**
!appsscript.json
test/**
secrets/**
mcp-server/**
node_modules/**
*.test.ts
*.config.ts
.env
```

**`template/appsscript.json`**

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Sheets",
        "serviceId": "sheets",
        "version": "v4"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

**`template/.env.example`**

```bash
# Google Cloud Project
GCP_PROJECT_ID=your-gcp-project-id

# Spreadsheet ID（スプレッドシートURLの/d/xxx/の部分）
SPREADSHEET_ID=your-spreadsheet-id
TEST_SPREADSHEET_ID=your-test-spreadsheet-id

# Service Account認証鍵のパス
GOOGLE_APPLICATION_CREDENTIALS=./secrets/service-account.json
```

**`template/.gitignore`**（既存に追加）

```gitignore
# Secrets
secrets/
*.json
!package.json
!tsconfig.json
!appsscript.json

# Environment
.env
.env.local
```

**`template/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['test/**', 'dist/**'],
    },
  },
});
```

#### 1.2 Universal Client 実装

**`template/src/core/client.ts`**

```typescript
/**
 * Copyright 2025 wywy LLC
 * Licensed under the Apache License, Version 2.0
 */

type Environment = 'gas' | 'node';

export class UniversalSheetsClient {
  private env: Environment;
  private auth: any;

  constructor() {
    this.env = this.detectEnvironment();
  }

  private detectEnvironment(): Environment {
    // GAS環境: UrlFetchAppが存在
    // Node環境: process.versionが存在
    return typeof UrlFetchApp !== 'undefined' ? 'gas' : 'node';
  }

  /**
   * Sheets API v4 batchUpdate実行
   */
  async batchUpdate(spreadsheetId: string, requests: any[]): Promise<any> {
    if (this.env === 'gas') {
      return this.gasBatchUpdate(spreadsheetId, requests);
    } else {
      return this.nodeBatchUpdate(spreadsheetId, requests);
    }
  }

  /**
   * Sheets API v4 batchGet実行
   */
  async batchGet(spreadsheetId: string, ranges: string[]): Promise<any> {
    if (this.env === 'gas') {
      return this.gasBatchGet(spreadsheetId, ranges);
    } else {
      return this.nodeBatchGet(spreadsheetId, ranges);
    }
  }

  // === GAS環境実装 ===

  private gasBatchUpdate(spreadsheetId: string, requests: any[]): any {
    const token = ScriptApp.getOAuthToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ requests }),
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `Sheets API Error: ${result.error?.message || 'Unknown error'}`
      );
    }

    return result;
  }

  private gasBatchGet(spreadsheetId: string, ranges: string[]): any {
    const token = ScriptApp.getOAuthToken();
    const rangesQuery = ranges
      .map(r => `ranges=${encodeURIComponent(r)}`)
      .join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      muteHttpExceptions: true,
    });

    return JSON.parse(response.getContentText());
  }

  // === Node.js環境実装 ===

  private async nodeBatchUpdate(
    spreadsheetId: string,
    requests: any[]
  ): Promise<any> {
    const { google } = await import('googleapis');
    const auth = await this.getNodeAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    return response.data;
  }

  private async nodeBatchGet(
    spreadsheetId: string,
    ranges: string[]
  ): Promise<any> {
    const { google } = await import('googleapis');
    const auth = await this.getNodeAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    return response.data;
  }

  private async getNodeAuth() {
    if (this.auth) return this.auth;

    const { google } = await import('googleapis');
    const path = await import('path');

    const keyFilePath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(process.cwd(), 'secrets/service-account.json');

    this.auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return this.auth;
  }
}
```

**`template/src/core/types.ts`**

```typescript
/**
 * Copyright 2025 wywy LLC
 * Licensed under the Apache License, Version 2.0
 */

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SheetsApiRequest {
  requests: any[];
}

export interface SheetsApiResponse {
  spreadsheetId: string;
  replies: any[];
}
```

**`template/src/core/constants.ts`**

```typescript
/**
 * Copyright 2025 wywy LLC
 * Licensed under the Apache License, Version 2.0
 */

// 名前付き範囲定数
export const TODO_RANGE = 'Todos!A2:E';
export const TODO_HEADER_RANGE = 'Todos!A1:E1';

// シート名
export const SHEET_NAMES = {
  TODOS: 'Todos',
} as const;
```

### 成果物チェックリスト

- [ ] `.clasp.json`, `.claspignore`, `appsscript.json`作成
- [ ] `.env.example`, `.gitignore`更新
- [ ] `vitest.config.ts`作成
- [ ] `src/core/client.ts` (Universal Client) 実装
- [ ] `src/core/types.ts`作成
- [ ] `src/core/constants.ts`作成
- [ ] `secrets/.gitkeep`作成

---

## 🤖 Phase 2: MCP Server 統合

### Phase 2 の目標

wyside プロジェクトに MCP Server 機能を追加し、AI 駆動の自動化ツールを提供

### Phase 2 のタスク

#### 2.1 MCP サーバー初期構築

**`mcp-server/package.json`**

```json
{
  "name": "@wywyjp/wyside-mcp",
  "version": "1.0.0",
  "type": "module",
  "description": "MCP Server for wyside - AI-driven GAS scaffolding tools",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "googleapis": "^140.0.0",
    "google-auth-library": "^9.14.1",
    "handlebars": "^4.7.8",
    "inquirer": "^12.2.0",
    "execa": "^9.5.2",
    "chalk": "^5.4.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "typescript": "^5.7.3"
  }
}
```

**`mcp-server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

#### 2.2 MCP Server Core 実装

**`mcp-server/src/index.ts`**

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { syncLocalSecrets } from './tools/sync-local-secrets.js';
import { scaffoldFeature } from './tools/scaffold-feature.js';
import { setupNamedRange } from './tools/setup-named-range.js';

const server = new Server(
  {
    name: 'wyside-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧登録
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sync_local_secrets',
        description:
          'GCPプロジェクト設定、API有効化、Service Account作成を自動実行し、ローカル環境でSheets APIを使える状態にする',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'GCPプロジェクトID（省略時は対話的に選択）',
            },
            spreadsheetId: {
              type: 'string',
              description: 'スプレッドシートID（省略時は新規作成）',
            },
          },
        },
      },
      {
        name: 'scaffold_feature',
        description:
          'REST API統一実装のリポジトリクラスを生成（GAS/Local両対応）',
        inputSchema: {
          type: 'object',
          properties: {
            featureName: {
              type: 'string',
              description: '機能名（例: "Highlight", "DataValidation"）',
            },
            operations: {
              type: 'array',
              items: { type: 'string' },
              description: '操作内容（例: ["setBackground", "setBorder"]）',
            },
          },
          required: ['featureName', 'operations'],
        },
      },
      {
        name: 'setup_named_range',
        description:
          'スプレッドシートに名前付き範囲を設定し、コード内定数と同期',
        inputSchema: {
          type: 'object',
          properties: {
            spreadsheetId: {
              type: 'string',
              description: 'スプレッドシートID',
            },
            rangeName: {
              type: 'string',
              description: '名前付き範囲の名前（例: "TODO_RANGE"）',
            },
            range: {
              type: 'string',
              description: 'A1記法の範囲（例: "Todos!A2:E"）',
            },
          },
          required: ['spreadsheetId', 'rangeName', 'range'],
        },
      },
    ],
  };
});

// ツール実行ハンドラ
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sync_local_secrets':
        return await syncLocalSecrets(args);

      case 'scaffold_feature':
        return await scaffoldFeature(args);

      case 'setup_named_range':
        return await setupNamedRange(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('wyside MCP server running on stdio');
}

main().catch(console.error);
```

#### 2.3 Tool 実装: sync_local_secrets (概要のみ)

**`mcp-server/src/tools/sync-local-secrets.ts`**

実装概要:

1. `gcloud auth login`で認証確認
2. GCP プロジェクト選択/作成
3. `gcloud services enable sheets.googleapis.com`
4. Service Account 作成 & 鍵ダウンロード
5. `secrets/service-account.json`配置
6. Spreadsheet 作成 or 共有設定
7. `.env`ファイル生成

※詳細実装は実装時にドキュメント参照

#### 2.4 CLI 統合

**`src/mcp-setup.ts`** (新規作成)

```typescript
import { spawn } from 'cross-spawn';
import path from 'path';

export function startMcpServer(): void {
  const mcpPath = path.join(__dirname, '../mcp-server/build/index.js');

  const proc = spawn('node', [mcpPath], {
    stdio: 'inherit',
  });

  proc.on('exit', code => {
    process.exit(code || 0);
  });
}
```

**`src/app.ts`** (既存に追加)

```typescript
import { startMcpServer } from './mcp-setup.js';

// 既存のinit関数を拡張
export async function init(options: InitOptions) {
  // ... 既存のテンプレートコピー処理 ...

  // 新規: GCP自動セットアップオプション
  if (options.setupGcp) {
    console.log('🤖 Running GCP setup via MCP...');
    // MCPツールを直接呼び出す実装
    // または `wyside mcp` を子プロセスで実行
  }
}

// 新規: mcpコマンド
export function handleMcpCommand() {
  startMcpServer();
}
```

### Phase 2 の成果物チェックリスト

- [ ] `mcp-server/package.json`, `tsconfig.json`作成
- [ ] `mcp-server/src/index.ts` (MCP サーバーコア) 実装
- [ ] `mcp-server/src/tools/sync-local-secrets.ts`実装
- [ ] `mcp-server/src/tools/scaffold-feature.ts`実装（簡易版）
- [ ] `mcp-server/src/tools/setup-named-range.ts`実装（簡易版）
- [ ] `src/mcp-setup.ts`作成
- [ ] `src/app.ts`に MCP 統合追加
- [ ] `npm install`で MCP 依存関係追加

---

## 💜 Phase 3: TODO App 完全実装

### Phase 3 の目標

REST API 統一の TODO アプリ（CRUD 操作）を GAS/Local 両対応で実装

### Phase 3 のタスク

#### 3.1 UniversalTodoRepo 実装

**`template/src/features/todo/UniversalTodoRepo.ts`**

主要メソッド:

- `addTodo(title)`: appendCells API で行追加
- `getTodos()`: batchGet API で全データ取得
- `updateTodo(id, updates)`: updateCells API で更新
- `deleteTodo(id)`: deleteDimension API で削除
- `parseRows()`: API レスポンスを Todo 型に変換

#### 3.2 TodoUseCase 実装

**`template/src/features/todo/TodoUseCase.ts`**

ビジネスロジック:

- バリデーション（タイトル必須等）
- エラーハンドリング
- リポジトリ層の呼び出し

#### 3.3 GAS エントリーポイント実装

**`template/src/main.ts`**

- `onOpen()`: メニュー追加
- `showTodoUI()`: サイドバー表示
- `apiAddTodo()`, `apiListTodos()`, `apiToggleTodo()`, `apiDeleteTodo()`

### Phase 3 の成果物チェックリスト

- [ ] `src/features/todo/UniversalTodoRepo.ts`実装
- [ ] `src/features/todo/TodoUseCase.ts`実装
- [ ] `src/main.ts`実装（onOpen, API 関数）
- [ ] CRUD 操作の動作確認（手動テスト）

---

## 🧪 Phase 4: テスト環境構築

### Phase 4 の目標

ローカルで実 Spreadsheet を使った結合テストを実装

### Phase 4 のタスク

#### 4.1 テストセットアップ

**`template/test/setup.ts`**

- dotenv 読み込み
- 環境変数バリデーション

#### 4.2 結合テスト実装

**`template/test/features/todo/TodoUseCase.test.ts`**

テストケース:

- `addTodo`: 正常系、バリデーションエラー
- `listTodos`: 空配列、複数件
- `toggleTodo`: 完了状態切り替え、エラー
- `deleteTodo`: 削除、エラー
- 完全な CRUD サイクル

#### 4.3 package.json 更新

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Phase 4 の成果物チェックリスト

- [ ] `test/setup.ts`実装
- [ ] `test/features/todo/TodoUseCase.test.ts`実装
- [ ] `vitest.config.ts`設定
- [ ] `package.json`のテストスクリプト追加
- [ ] ローカルテスト実行確認（`npm test`）

---

## 🚀 Phase 5: 検証環境構築と E2E テスト

### Phase 5 の目標

`test-projects/todo-app/`で wyside の完全な動作検証

### Phase 5 のタスク

#### 5.1 検証プロジェクト作成手順

1. `npm run build` (wyside ビルド)
2. `mkdir -p test-projects/todo-app`
3. `npx ../../dist/index.js init --setup-gcp --yes`
4. `npm install`
5. `npm test` (ローカルテスト)
6. `npm run deploy` (GAS デプロイ)
7. GAS UI 動作確認

#### 5.2 ドキュメント作成

**`docs/testing-guide.md`**

- E2E テスト完全手順書
- トラブルシューティング
- 検証ポイント

### Phase 5 の成果物チェックリスト

- [ ] `test-projects/todo-app/`ディレクトリ作成
- [ ] `wyside init --setup-gcp`実行成功
- [ ] `npm test`でローカルテスト全件 PASS
- [ ] `npm run deploy`で GAS デプロイ成功
- [ ] GAS UI で TODO 操作動作確認
- [ ] `docs/testing-guide.md`作成

---

## 📦 Phase 6: 依存関係とビルド設定

### template/package.json

```json
{
  "dependencies": {
    "googleapis": "^140.0.0",
    "google-auth-library": "^9.14.1",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/google-apps-script": "^1.0.83",
    "@types/node": "^22.10.5",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8",
    "@vitest/coverage-v8": "^2.1.8"
  }
}
```

### src/config.ts 更新

```typescript
export const configForTodoRest = {
  dependencies: [
    'googleapis@^140.0.0',
    'google-auth-library@^9.14.1',
    'dotenv@^16.4.5',
  ],
  // ... (省略)
};
```

---

## 📝 Phase 7: ドキュメント整備

### ドキュメント一覧

| ファイル                      | 内容                                 |
| ----------------------------- | ------------------------------------ |
| `docs/implementation-plan.md` | 本ドキュメント（実装計画）           |
| `docs/testing-guide.md`       | E2E テスト手順書                     |
| `docs/mcp-tools-reference.md` | MCP ツールリファレンス               |
| `template/README.md`          | テンプレート利用者向けガイド         |
| `CLAUDE.md`                   | プロジェクト概要更新（MCP 統合追記） |

---

## 🎯 実装マイルストーン

### Milestone 1: 基盤構築 (3-5 日)

- [ ] テンプレート構造作成
- [ ] Universal Client 実装
- [ ] 設定ファイル群作成

### Milestone 2: MCP 統合 (5-7 日)

- [ ] MCP サーバー構築
- [ ] GCP 自動化ツール実装
- [ ] CLI 統合

### Milestone 3: TODO App 実装 (3-4 日)

- [ ] CRUD 操作実装
- [ ] GAS エントリーポイント実装

### Milestone 4: テスト環境 (2-3 日)

- [ ] 結合テスト実装
- [ ] Vitest 設定

### Milestone 5: E2E 検証 (2-3 日)

- [ ] 完全動作確認
- [ ] 両環境での動作検証

### Milestone 6: ドキュメント (1-2 日)

- [ ] 全ドキュメント整備

**総推定工数**: 14-21 日（1 人フルタイム換算）

---
