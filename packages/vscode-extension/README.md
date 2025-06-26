# Harmony UI VS Code Extension

This VS Code extension provides a Harmony UI development server that runs on port 4300, just like the CLI package but integrated directly into VS Code.

## Features

- **Automatic Server Management**: Start and stop the Harmony server directly from VS Code
- **Multi-Window Coordination**: Only one server runs on port 4300 at a time, controlled by the focused VS Code window
- **Efficient Control Transfer**: Server control transfers between windows without stopping/starting the server
- **Browser-Friendly**: Server stays running when you switch to your browser to use the Harmony UI
- **Status Bar Integration**: See the server status in the VS Code status bar
- **Same tRPC API**: Exposes the same tRPC routes as the CLI package

## Multi-Window Behavior

The extension intelligently manages the server across multiple VS Code windows using a file-based coordination system:

- **When you switch to your browser**: The server stays running so you can continue using the Harmony UI
- **When you switch to another VS Code window**: Server control transfers to the newly focused window (no server restart)
- **Only one server at a time**: Ensures no port conflicts between different VS Code instances
- **Efficient transfers**: Control changes happen instantly without stopping/starting the server

### How It Works

1. **First Window**: Starts the server and creates a control file in the system temp directory
2. **Other Windows**: Read the control file to see if a server is already running
3. **Control Transfer**: When switching windows, the control file is updated to transfer ownership
4. **File Watching**: All windows watch the control file for changes to update their status bars

### Status Bar Indicators

- **🟢 Running**: Server is running and controlled by this window
- **🟡 Running**: Server is running but controlled by another VS Code window
- **🔴 Error**: Server encountered an error
- **⚪ Stopped**: Server is not running
- **🔄 Starting...**: Server is starting up

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
   - Click the "..." menu (three dots) in the Extensions panel
   - Select "Install from VSIX..."
   - Navigate to `packages/vscode-extension/Harmony-0.1.0.vsix` and select it

## Usage

### Automatic Behavior

1. **Open a Harmony project** (with `harmony.config.json`)
2. **Focus a VS Code window** - the server will automatically start
3. **Switch to your browser** - the server stays running
4. **Switch to another VS Code window** - server control transfers to the new window instantly

### Manual Commands

- **Start Server**: `Ctrl+Shift+P` → "Harmony: Start Harmony Server"
- **Stop Server**: `Ctrl+Shift+P` → "Harmony: Stop Harmony Server"

### Status Bar

- Click the status bar item to start/stop the server
- Hover to see detailed status information

## Technical Details

### File-Based Coordination

The extension uses a control file (`harmony-server-control.json`) in the system temp directory to coordinate between VS Code windows:

```json
{
  "windowId": "unique-window-id",
  "workspacePath": "/path/to/workspace",
  "timestamp": 1234567890,
  "port": 4300
}
```

This approach ensures:

- **Cross-process communication**: Different VS Code windows can coordinate
- **No server restarts**: Control transfers happen instantly
- **Automatic cleanup**: Control file is removed when server stops
- **File watching**: Real-time status updates across all windows

## Development

### Building

```bash
cd packages/vscode-extension
pnpm build
```

### Packaging

```bash
pnpm package
```

### Debugging

1. Open the extension in VS Code
2. Press `F5` to launch a new Extension Development Host
3. The extension will be loaded in the new window

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18+ (for building)
- A Harmony project with `harmony.config.json`

## Troubleshooting

- **Port 4300 in use**: The extension will show an error if another process is using port 4300
- **No harmony.config.json**: The extension only works in Harmony projects
- **Server not starting**: Check the VS Code Developer Console for error messages
- **Control file issues**: The control file is automatically managed, but you can delete it from the temp directory if needed

## API Endpoints

The server exposes the same endpoints as the CLI package:

- `http://localhost:4300/trpc/*` - tRPC API endpoints
- `http://localhost:4300/health` - Health check endpoint
- `http://localhost:4300/` - Root endpoint with server info

## Differences from CLI

- **Automatic management**: No need to manually start/stop the server
- **Multi-window support**: Works seamlessly across multiple VS Code windows
- **Browser-friendly**: Server stays running when switching to browser
- **Visual feedback**: Status bar shows server state
- **File-based coordination**: Efficient control transfer between windows
