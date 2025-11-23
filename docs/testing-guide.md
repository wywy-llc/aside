# E2E Validation & Testing Guide

This guide describes the procedure to validate the `wyside` integration with MCP and Google Sheets.

## Prerequisites

- Node.js 22+
- Google Cloud Project with Sheets API enabled
- Service Account JSON key

## Validation Procedure

### 1. Build `wyside` CLI

```bash
npm run build
```

### 2. Initialize Test Project

Create a new directory and initialize the project using the built CLI.

```bash
mkdir -p test-projects/todo-app
cd test-projects/todo-app
WYSIDE_DEBUG=1 npx ../../dist/src/index.js init --setup-gcp --yes
```

_Note: `--setup-gcp` triggers the MCP integration (currently a placeholder for automated setup)._

### 3. Configure Secrets

Ensure your `secrets/service-account.json` is in place and `.env` is configured with:

- `GCP_PROJECT_ID`
- `SPREADSHEET_ID`
- `GOOGLE_APPLICATION_CREDENTIALS`

### 4. Run Local Integration Tests

Execute the test suite to verify logic against a real Spreadsheet.

```bash
npm install
npm test
```

Expect all tests to PASS.

### 5. Deploy to GAS

Push the code to Google Apps Script.

```bash
npm run deploy
```

_Note: The `test:e2e` script automatically includes the deploy step._

### 6. Verify GAS UI (Manual Step)

This step requires manual verification in the browser:

1. Open the Spreadsheet (use the link from the init output).
2. Reload the page to load the GAS Add-on.
3. Check for "Wyside Todo" menu in the menu bar.
4. Click "Show Todos" to open the sidebar.
5. Verify you can add, list, and delete todos via the UI.

_Note: This step cannot be automated as it requires browser interaction with the Google Sheets UI._

## Troubleshooting

- **Quota Errors**: Ensure Sheets API quota is sufficient.
- **Auth Errors**: Verify Service Account permissions on the Spreadsheet (must be an Editor).
- **Deploy Errors**: Check `.clasp.json` `scriptId` and `rootDir` settings.
