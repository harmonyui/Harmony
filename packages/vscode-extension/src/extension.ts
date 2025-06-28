import * as vscode from 'vscode'
import { GlobalServerManager } from './globalServerManager'
import { StatusBarManager } from './statusBar'
import { getConfigFile } from './utils/get-config-file'

let statusBar: StatusBarManager | undefined
let globalServerManager: GlobalServerManager
let windowFocusDisposable: vscode.Disposable | undefined
let windowId: string

export function activate(context: vscode.ExtensionContext) {
  console.log('Harmony UI extension is now active!')

  // Generate a unique ID for this window
  windowId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  statusBar = new StatusBarManager()

  const workspacePath = getAndValidateWorkspacePath(statusBar)

  // Initialize global server manager
  globalServerManager = new GlobalServerManager(
    statusBar,
    windowId,
    workspacePath ?? '',
  )

  // Register commands
  const startServerCommand = vscode.commands.registerCommand(
    'harmony.startServer',
    async () => {
      await requestServerControl()
    },
  )

  const stopServerCommand = vscode.commands.registerCommand(
    'harmony.stopServer',
    async () => {
      await releaseServerControl()
    },
  )

  // Register VS Code window focus event handler
  // This only triggers when switching between VS Code windows, not when switching to other applications
  windowFocusDisposable = vscode.window.onDidChangeWindowState(
    (windowState) => {
      // Only handle VS Code window focus changes, not general application focus
      if (windowState.focused && !isStopped()) {
        // This VS Code window gained focus - try to take control of the server
        requestServerControl()
      }
    },
  )

  // Add disposables to context
  context.subscriptions.push(
    startServerCommand,
    stopServerCommand,
    windowFocusDisposable,
  )

  // If this window is focused on activation, try to start the server
  if (vscode.window.state.focused) {
    // Small delay to ensure everything is initialized
    setTimeout(() => {
      requestServerControl()
    }, 1000)
  }
}

export function deactivate() {
  console.log('Harmony UI extension is deactivating...')

  // Release server control when extension deactivates
  if (globalServerManager) {
    releaseServerControl()
    globalServerManager.dispose()
  }
}

async function requestServerControl(): Promise<void> {
  if (!statusBar || !globalServerManager) {
    return
  }

  const workspacePath = getAndValidateWorkspacePath(statusBar)
  if (!workspacePath) {
    return
  }

  globalServerManager.workspacePath = workspacePath

  // Request server control from global manager
  const success = await globalServerManager.requestServerControl()
}

async function releaseServerControl(): Promise<void> {
  if (!globalServerManager) {
    return
  }

  await globalServerManager.releaseServerControl()
}

function isStopped(): boolean {
  return statusBar?.status === 'stopped'
}

const getAndValidateWorkspacePath = (
  statusBar: StatusBarManager,
): string | undefined => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    statusBar.updateStatus('error')
    vscode.window.showErrorMessage('No workspace folder found')
    return
  }

  const workspacePath = workspaceFolder.uri.fsPath

  // Check if this is a Harmony workspace
  const config = getConfigFile(workspacePath)
  if (!config) {
    statusBar.updateStatus('error')
    vscode.window.showErrorMessage(
      'No harmony.config.json found in workspace. This is not a Harmony project.',
    )
    return
  }

  return workspacePath
}
