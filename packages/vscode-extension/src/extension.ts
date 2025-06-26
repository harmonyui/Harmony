import * as vscode from 'vscode'
import { HarmonyServer } from './server'
import { StatusBarManager } from './statusBar'

let server: HarmonyServer | undefined
let statusBar: StatusBarManager | undefined

export function activate(context: vscode.ExtensionContext) {
  console.log('Harmony UI extension is now active!')

  // Initialize status bar
  statusBar = new StatusBarManager()

  // Register commands
  const startServerCommand = vscode.commands.registerCommand(
    'harmony.startServer',
    async () => {
      if (server?.isRunning()) {
        vscode.window.showInformationMessage(
          'Harmony server is already running',
        )
        return
      }
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found')
        return
      }
      server = new HarmonyServer(workspaceFolder.uri.fsPath, statusBar!)

      try {
        await server.start()

        vscode.window.showInformationMessage(
          'Harmony server started on port 4300',
        )
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'Port 4300 is already in use'
        ) {
          server.changePath(workspaceFolder.uri.fsPath)
          vscode.window.showInformationMessage(
            'Harmony server is already running on port 4300, changing path to workspace folder',
          )
          return
        }

        vscode.window.showErrorMessage(
          `Failed to start Harmony server: ${error}`,
        )
      }
    },
  )

  const stopServerCommand = vscode.commands.registerCommand(
    'harmony.stopServer',
    async () => {
      if (!server?.isRunning()) {
        vscode.window.showInformationMessage('Harmony server is not running')
        return
      }

      try {
        await server.stop()
        vscode.window.showInformationMessage('Harmony server stopped')
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to stop Harmony server: ${error}`,
        )
      }
    },
  )

  context.subscriptions.push(startServerCommand, stopServerCommand)

  // Auto-start server if enabled
  const config = vscode.workspace.getConfiguration('harmony')
  if (config.get('autoStartServer', false)) {
    vscode.commands.executeCommand('harmony.startServer')
  }
}

export function deactivate() {
  if (server) {
    server.stop()
  }
  if (statusBar) {
    statusBar.dispose()
  }
}
