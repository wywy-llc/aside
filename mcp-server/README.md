# @wywyjp/wyside-mcp

`wyside`用の[MCP (Model Context Protocol)](https://modelcontextprotocol.io/)サーバーです。
このサーバーはAI駆動のインフラ管理ツールとして機能し、ローカルGoogle Apps Script開発に必要な複雑なセットアップを自動化します。

## 機能

- **インフラ自動化**: GCPプロジェクトの自動設定、API有効化、サービスアカウントの作成
- **統合コードスキャフォールディング**: GASとNode.jsの両方で変更なしに動作するコードを生成
- **シート設定**: APIを介した名前付き範囲の管理とTypeScript定数との同期

## インストール

```bash
npm install
npm run build
```

## 使い方

### サーバーの起動

MCPサーバーを起動:

```bash
npm start
```

開発モード（自動リビルド付き）:

```bash
npm run dev
```

### IDE統合 (Cursor、VS Codeなど)

MCP設定ファイルに以下を追加:

```json
{
  "mcpServers": {
    "wyside-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/build/index.js"]
    }
  }
}
```

## 開発とデバッグ

### クイックスタートチェック

インストール後、サーバーが正しく起動するか確認:

```bash
npm start
```

期待される出力:

```bash
wyside MCP server running on stdio
```

このメッセージが表示されれば、サーバーは正常に動作しており、stdio経由でMCPクライアントからの接続を待機しています。

### ログによるデバッグ

サーバーはstderr（MCP JSON-RPCプロトコル用に予約されているstdoutではない）にログを出力します。詳細なログを確認するには:

1. **stderrの出力を確認**: すべての`console.error()`呼び出しはstderrに出力されます
2. **デバッグログを追加**: `src/`内のソースファイルを編集し、`console.error('Debug:', data)`を追加
3. **リビルド**: コード変更後に`npm run build`を実行

デバッグワークフローの例:

```bash
# ターミナル1: 自動リビルド用のウォッチモード
npm run dev

# ターミナル2: サーバーのテスト
npm start
```

### MCP Inspectorでのテスト

公式MCP Inspectorを使用してツールを対話的にテスト:

```bash
# MCP Inspectorをグローバルにインストール
npm install -g @modelcontextprotocol/inspector

# インスペクターを実行
mcp-inspector node build/index.js
```

これによりWeb UIが開き、以下が可能になります:

- 利用可能なツールのリスト表示
- テストパラメータでツールを呼び出し
- リクエスト/レスポンスのペイロードを検査

### 環境変数を使用した手動ツールテスト

MCPクライアントなしで特定のツールをテスト:

#### 1. `.env`ファイルを作成

サンプルファイルをコピーしてテスト値を入力:

```bash
cp .env.example .env
```

`.env`を編集:

```bash
# テストモードを有効化
TEST_MODE=true

# sync_local_secretsのテスト
TEST_PROJECT_ID=your-gcp-project-id
TEST_SPREADSHEET_ID=your-spreadsheet-id-optional

# scaffold_featureのテスト
TEST_FEATURE_NAME=Todo
TEST_FEATURE_OPERATIONS=create,read,update,delete
```

#### 2. テストを実行

```bash
npm run build && npm start
```

期待される出力:

```bash
🧪 Running in TEST MODE

📋 Testing sync_local_secrets...
✅ Test result: {
  "content": [...],
  "isError": false
}

✨ Test mode completed. Exiting...
```

通常のサーバーモードに戻るには、`.env`で`TEST_MODE=false`に設定してください。

### ツールの直接実行

コマンドライン引数で個別のツールを直接実行:

```bash
# 基本構文
npm run test:tool <tool-name> [args...]

# 実行例:
npm run test:tool sync_local_secrets my-project-123
npm run test:tool scaffold_feature Todo "create,read,update,delete"
npm run test:tool setup_named_range 1ABC123 TODO_RANGE "Sheet1!A2:E"
npm run test:tool drive_create_folder "Test Folder"
npm run test:tool gmail_send_email "test@example.com" "Subject" "Body"
```

**利用可能なツール:**

- `sync_local_secrets <projectId> [spreadsheetId]`
- `scaffold_feature <featureName> <operation1,operation2,...>`
- `setup_named_range <spreadsheetId> <rangeName> <range>`
- `drive_create_folder <folderName> [parentId]`
- `gmail_send_email <to> <subject> <body>`

**対話的ヘルプ:**

```bash
npm run test:tool
# 使用方法と例を表示
```

### よくある問題

**問題**: サーバーは起動するがIDEが接続しない

- **解決策**: IDEのMCP設定で絶対パスを確認
- **確認**: `ls /absolute/path/to/mcp-server/build/index.js`を実行

**問題**: Google APIでツールエラーが発生

- **解決策**: プロジェクトルートに`service-account.json`が存在することを確認
- **確認**: `ls ~/your-project/secrets/service-account.json`

**問題**: ビルド時にTypeScriptエラーが発生

- **解決策**: `node_modules`のインストールを確認: `npm install`
- **確認**: `npx tsc --version` (5.9.3以上であるべき)

### 環境変数

Google API呼び出しのデバッグには、シェルで以下を設定:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export DEBUG=true
npm start
```

## ツール

### `sync_local_secrets`

Google Cloud Platformと連携してローカル開発環境をセットアップします。

- `sheets.googleapis.com`のチェック/有効化
- サービスアカウント(`wyside-local-dev`)が存在しない場合は作成
- `secrets/service-account.json`を生成
- `.env`を更新

### `scaffold_feature`

「テスト分離ハイブリッド」アーキテクチャで新しいフィーチャーディレクトリを生成します。

- **入力**: フィーチャー名（例: "Todo"）、オペレーション
- **出力**:
  - `Universal<Name>Repo.ts`: REST APIベースのリポジトリ
  - `<Name>UseCase.ts`: ビジネスロジック

### `setup_named_range`

対象のGoogleシートで名前付き範囲を設定し、対応するTypeScript定数を生成します。

- **入力**: スプレッドシートID、範囲名、A1表記
- **出力**: スプレッドシートのメタデータと`src/core/constants.ts`を更新
