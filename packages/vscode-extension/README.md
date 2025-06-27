# Harmony Dev VS Code Extension

A VS Code extension that provides a local development server for Harmony Dev, enabling developers to edit their React applications using no-code tools directly from VS Code.

## What is Harmony Dev?

Harmony Dev allows developers to edit their React applications locally using no-code tools. This VS Code extension acts as the development server that handles code updates, while users interact with their applications through the Harmony UI Chrome extension.

## Features

- **Local Development Server**: Runs a Harmony Dev server on port 4300 for seamless development
- **Automatic Server Management**: Start and stop the Harmony server directly from VS Code
- **Multi-Window Coordination**: Only one server runs on port 4300 at a time, controlled by the focused VS Code window
- **Efficient Control Transfer**: Server control transfers between windows without stopping/starting the server
- **Browser-Friendly**: Server stays running when you switch to your browser to use the Harmony UI Chrome extension
- **Status Bar Integration**: See the server status in the VS Code status bar
- **tRPC API**: Exposes a complete API for the Harmony UI Chrome extension to communicate with

## How It Works

1. **Install the Extension**: Install this VS Code extension in your development environment
2. **Install the Chrome Extension**: Download and install the Harmony UI Chrome extension from the Chrome Web Store
3. **Start Development**: Open a React project in VS Code and the server will automatically start
4. **Make Edits**: Use the Harmony UI Chrome extension to make no-code edits to your React application
5. **See Changes**: Code updates are automatically applied to your local development environment

## Multi-Window Behavior

The extension intelligently manages the server across multiple VS Code windows:

- **When you switch to your browser**: The server stays running so you can continue using the Harmony UI Chrome extension
- **When you switch to another VS Code window**: Server control transfers to the newly focused window (no server restart)
- **Only one server at a time**: Ensures no port conflicts between different VS Code instances
- **Efficient transfers**: Control changes happen instantly without stopping/starting the server

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

1. **Open a React project** in VS Code
2. **Focus a VS Code window** - the server will automatically start
3. **Switch to your browser** - the server stays running
4. **Switch to another VS Code window** - server control transfers to the new window instantly

### Manual Commands

- **Start Server**: `Ctrl+Shift+P` → "Harmony: Start Harmony Server"
- **Stop Server**: `Ctrl+Shift+P` → "Harmony: Stop Harmony Server"

### Status Bar

- Click the status bar item to start/stop the server
- Hover to see detailed status information

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
- A React project
- Harmony UI Chrome extension (for making edits)

## Troubleshooting

- **Port 4300 in use**: The extension will show an error if another process is using port 4300
- **Server not starting**: Check the VS Code Developer Console for error messages
- **Chrome extension not working**: Ensure the Harmony UI Chrome extension is installed and the server is running
- **No changes appearing**: Make sure your React application is configured to work with Harmony Dev

## API Endpoints

The server exposes the following endpoints for the Harmony UI Chrome extension:

- `http://localhost:4300/trpc/*` - tRPC API endpoints for code updates
- `http://localhost:4300/health` - Health check endpoint
- `http://localhost:4300/` - Root endpoint with server info

## Getting Started

1. Install this VS Code extension
2. Install the Harmony UI Chrome extension from the Chrome Web Store
3. Open your React project in VS Code
4. The server will automatically start
5. Open your React application in Chrome
6. Use the Harmony UI Chrome extension to make no-code edits
7. See your changes reflected in real-time in your development environment
