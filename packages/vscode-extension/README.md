# Harmony UI VS Code Extension

This VS Code extension provides a Harmony UI development server that runs on port 4300, just like the CLI package but integrated directly into VS Code.

## Features

- **Automatic Server Management**: Start and stop the Harmony server directly from VS Code
- **Status Bar Integration**: See the server status in the VS Code status bar
- **Auto-start Option**: Configure the server to start automatically when the extension activates
- **Same tRPC API**: Exposes the same tRPC routes as the CLI package

## Installation

1. Build the extension:

   ```bash
   cd packages/vscode-extension
   pnpm install
   pnpm build
   ```

2. Package the extension:

   ```bash
   pnpm package
   ```

3. Install the `.vsix` file in VS Code:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu and select "Install from VSIX..."
   - Select the generated `.vsix` file

## Usage

### Manual Control

1. **Start Server**: Use the command palette (Ctrl+Shift+P) and run "Harmony: Start Harmony Server"
2. **Stop Server**: Use the command palette and run "Harmony: Stop Harmony Server"

### Status Bar

The extension adds a status bar item that shows:

- **Stopped**: Server is not running (click to start)
- **Running**: Server is running on port 4300 (click to stop)
- **Error**: Server encountered an error (click to restart)

### Auto-start Configuration

You can configure the server to start automatically:

1. Open VS Code Settings (Ctrl+,)
2. Search for "Harmony"
3. Check "Harmony: Auto Start Server"

## API Endpoints

The extension exposes the same tRPC endpoints as the CLI package:

- `http://localhost:4300/trpc/editor.loadProject`
- `http://localhost:4300/trpc/editor.saveProject`
- `http://localhost:4300/trpc/editor.publishProject`
- `http://localhost:4300/trpc/editor.indexComponents`
- `http://localhost:4300/trpc/editor.createChatBubble`
- `http://localhost:4300/trpc/editor.updateChatBubble`
- `http://localhost:4300/trpc/editor.deleteChatBubble`

## Health Check

The server also provides a health check endpoint:

- `http://localhost:4300/health`

## Development

To develop the extension:

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build in watch mode:

   ```bash
   pnpm watch
   ```

3. Press F5 in VS Code to launch the extension in a new Extension Development Host window

## Troubleshooting

- **Port 4300 already in use**: The extension will show an error if port 4300 is already occupied
- **No workspace folder**: The extension requires an open workspace folder to function
- **Configuration file**: The extension looks for `harmony.config.json` in the workspace root

## Differences from CLI

- **Automatic lifecycle**: The server starts/stops with VS Code
- **Status bar integration**: Visual feedback about server status
- **Workspace-aware**: Automatically uses the current workspace folder
- **No command line**: All control through VS Code UI
