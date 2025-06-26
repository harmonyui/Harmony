import * as vscode from 'vscode'

type Status =
  | 'running'
  | 'stopped'
  | 'error'
  | 'starting'
  | 'running-other-window'

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem

  public status: Status = 'stopped'

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    )
    this.statusBarItem.command = 'harmony.startServer'
    this.updateStatus('stopped')
    this.statusBarItem.show()
  }

  updateStatus(status: Status) {
    this.status = status
    switch (status) {
      case 'running':
        this.statusBarItem.text = '$(server) Harmony: Running'
        this.statusBarItem.tooltip =
          'Harmony server is running on port 4300 (controlled by this window)'
        this.statusBarItem.command = 'harmony.stopServer'
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.prominentBackground',
        )
        break
      case 'running-other-window':
        this.statusBarItem.text = '$(server) Harmony: Running'
        this.statusBarItem.tooltip =
          'Harmony server is running on port 4300 (controlled by another VS Code window)'
        this.statusBarItem.command = 'harmony.stopServer'
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground',
        )
        break
      case 'stopped':
        this.statusBarItem.text = '$(circle-slash) Harmony: Stopped'
        this.statusBarItem.tooltip = 'Harmony server is stopped'
        this.statusBarItem.command = 'harmony.startServer'
        this.statusBarItem.backgroundColor = undefined
        break
      case 'error':
        this.statusBarItem.text = '$(error) Harmony: Error'
        this.statusBarItem.tooltip = 'Harmony server encountered an error'
        this.statusBarItem.command = 'harmony.startServer'
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground',
        )
        break
      case 'starting':
        this.statusBarItem.text = '$(loading~spin) Harmony: Starting...'
        this.statusBarItem.tooltip = 'Harmony server is starting up'
        this.statusBarItem.command = undefined
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground',
        )
        break
    }
  }

  dispose() {
    this.statusBarItem.dispose()
  }
}
