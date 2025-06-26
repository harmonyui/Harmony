import * as vscode from 'vscode'

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    )
    this.statusBarItem.command = 'harmony.startServer'
    this.updateStatus('stopped')
    this.statusBarItem.show()
  }

  updateStatus(status: 'running' | 'stopped' | 'error') {
    switch (status) {
      case 'running':
        this.statusBarItem.text = '$(server) Harmony: Running'
        this.statusBarItem.tooltip = 'Harmony server is running on port 4300'
        this.statusBarItem.command = 'harmony.stopServer'
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.prominentBackground',
        )
        break
      case 'stopped':
        this.statusBarItem.text = '$(server) Harmony: Stopped'
        this.statusBarItem.tooltip = 'Click to start Harmony server'
        this.statusBarItem.command = 'harmony.startServer'
        this.statusBarItem.backgroundColor = undefined
        break
      case 'error':
        this.statusBarItem.text = '$(error) Harmony: Error'
        this.statusBarItem.tooltip = 'Harmony server encountered an error'
        this.statusBarItem.command = 'harmony.startServer'
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'errorForeground',
        )
        break
    }
  }

  dispose() {
    this.statusBarItem.dispose()
  }
}
