# @wywyjp/wyside-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for `wyside`.
This server acts as an AI-driven infrastructure manager, automating the complex setup required for local Google Apps Script development.

## Features

- **Infrastructure Automation**: Auto-configure GCP projects, enable APIs, and create Service Accounts.
- **Unified Code Scaffolding**: Generate code that runs on both GAS and Node.js without modification.
- **Sheet Configuration**: Manage Named Ranges via API and sync them with TypeScript constants.

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

Start the MCP server:

```bash
npm start
```

Or for development with auto-rebuild:

```bash
npm run dev
```

### IDE Integration (e.g., Cursor, VS Code)

Add the following to your MCP configuration file:

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

## Development & Debugging

### Quick Start Check

After installation, verify the server starts correctly:

```bash
npm start
```

Expected output:

```bash
wyside MCP server running on stdio
```

If you see this message, the server is running correctly and waiting for MCP client connections via stdio.

### Debugging with Logs

The server logs to stderr (not stdout, which is reserved for MCP JSON-RPC protocol). To see detailed logs:

1. **Check stderr output**: All `console.error()` calls go to stderr
2. **Add debug logs**: Edit source files in `src/` and add `console.error('Debug:', data)`
3. **Rebuild**: Run `npm run build` after code changes

Example debug workflow:

```bash
# Terminal 1: Watch mode for auto-rebuild
npm run dev

# Terminal 2: Test the server
npm start
```

### Testing with MCP Inspector

Use the official MCP Inspector to test tools interactively:

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run inspector
mcp-inspector node build/index.js
```

This opens a web UI where you can:

- List available tools
- Call tools with test parameters
- Inspect request/response payloads

### Manual Tool Testing

Test specific tools without an MCP client using environment variables:

#### 1. Create a `.env` file

Copy the example file and fill in your test values:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Enable test mode
TEST_MODE=true

# Test sync_local_secrets
TEST_PROJECT_ID=your-gcp-project-id
TEST_SPREADSHEET_ID=your-spreadsheet-id-optional

# Test scaffold_feature
TEST_FEATURE_NAME=Todo
TEST_FEATURE_OPERATIONS=create,read,update,delete
```

#### 2. Run tests

```bash
npm run build && npm start
```

Expected output:

```bash
🧪 Running in TEST MODE

📋 Testing sync_local_secrets...
✅ Test result: {
  "content": [...],
  "isError": false
}

✨ Test mode completed. Exiting...
```

To go back to normal server mode, set `TEST_MODE=false` in `.env`.

### Common Issues

**Problem**: Server starts but IDE doesn't connect

- **Solution**: Check the absolute path in your IDE's MCP config
- **Verify**: Run `ls /absolute/path/to/mcp-server/build/index.js`

**Problem**: Tool errors with Google APIs

- **Solution**: Ensure `service-account.json` exists in project root
- **Check**: `ls ~/your-project/secrets/service-account.json`

**Problem**: TypeScript errors during build

- **Solution**: Check `node_modules` installation: `npm install`
- **Verify**: `npx tsc --version` (should be 5.9.3+)

### Environment Variables

For debugging Google API calls, set these in your shell:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export DEBUG=true
npm start
```

## Tools

### `sync_local_secrets`

Sets up the local development environment by interacting with Google Cloud Platform.

- Checks/Enables `sheets.googleapis.com`.
- Creates a Service Account (`wyside-local-dev`) if missing.
- Generates `secrets/service-account.json`.
- Updates `.env`.

### `scaffold_feature`

Generates a new feature directory with the "Test-Separated Hybrid" architecture.

- **Input**: Feature name (e.g., "Todo"), Operations.
- **Output**:
  - `Universal<Name>Repo.ts`: REST API based repository.
  - `<Name>UseCase.ts`: Business logic.

### `setup_named_range`

Configures a Named Range in the target Google Sheet and generates the corresponding TypeScript constant.

- **Input**: Spreadsheet ID, Range Name, A1 Notation.
- **Output**: Updates Spreadsheet metadata and `src/core/constants.ts`.
