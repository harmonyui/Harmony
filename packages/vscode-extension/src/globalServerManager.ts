import * as vscode from 'vscode'
import { HarmonyServer } from './server'
import { StatusBarManager } from './statusBar'
import * as net from 'net'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { resetState } from './utils/state'

interface ServerControlFile {
  windowId: string
  workspacePath: string
  pathConfig: Record<string, string>
  timestamp: number
  port: number
  activeWindowIds: Set<string>
  activeServer: string | null
}

export class GlobalServerManager {
  private fileContents: string | null = null
  private server: HarmonyServer | null = null
  private readonly port = 4300
  private readonly controlFile = path.join(
    os.tmpdir(),
    'harmony-server-control.json',
  )
  private isShuttingDown = false
  private controlFileWatcher: fs.StatWatcher | null = null

  constructor(
    private statusBar: StatusBarManager,
    private windowId: string,
    public workspacePath: string,
  ) {
    this.setupControlFileWatcher()
  }

  async requestServerControl(): Promise<boolean> {
    // Check if there's already a server running
    const existingControl = this.readControlFile()

    // No server running or this window should start one
    if (!existingControl || !existingControl.activeServer) {
      this.statusBar.updateStatus('starting')

      // Check if port is available
      if (!(await this.isPortAvailable())) {
        vscode.window.showErrorMessage(
          'Port 4300 is already in use by another process. Please stop it first.',
        )
        this.statusBar.updateStatus('error')
        return false
      }

      // Start the server for this window
      try {
        const server = new HarmonyServer((requestUrl?: string) => {
          const controlFile = this.readControlFile()
          if (!controlFile) {
            throw new Error('No control file found')
          }
          const pathConfig = controlFile.pathConfig

          const controlPath = controlFile.workspacePath
          if (requestUrl) {
            const path = pathConfig[requestUrl]
            if (!path) {
              pathConfig[requestUrl] = controlPath
              this.writeControlFile({
                ...controlFile,
                pathConfig,
              })
            }
          }

          return pathConfig
        }, this.statusBar)
        await server.start()

        this.server = server

        // Write control file
        this.writeControlFile({
          windowId: this.windowId,
          workspacePath: this.workspacePath,
          pathConfig: {},
          timestamp: Date.now(),
          port: this.port,
          activeWindowIds: new Set([this.windowId]),
          activeServer: this.windowId,
        })

        console.log(
          `Server started for window ${this.windowId} at ${this.workspacePath}`,
        )
        return true
      } catch (error) {
        console.error('Failed to start server:', error)
        vscode.window.showErrorMessage(
          `Failed to start Harmony server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        this.statusBar.updateStatus('error')
        return false
      }
    }

    if (existingControl && existingControl.windowId !== this.windowId) {
      // Another window controls the server - update control file to transfer control
      console.log(
        `Transferring server control from window ${existingControl.windowId} to ${this.windowId}`,
      )

      // Update the control file to indicate this window now controls the server
      this.writeControlFile({
        windowId: this.windowId,
        pathConfig: existingControl.pathConfig,
        workspacePath: this.workspacePath,
        timestamp: Date.now(),
        port: this.port,
        activeWindowIds: new Set([
          ...existingControl.activeWindowIds,
          this.windowId,
        ]),
        activeServer: existingControl.activeServer,
      })

      return true
    }

    return true
  }

  async releaseServerControl(): Promise<void> {
    const control = this.readControlFile()

    if (this.isShuttingDown || !control) {
      return
    }

    this.isShuttingDown = true

    try {
      // Stop the server
      if (this.server) {
        await this.server.stop()
        this.server = null
        control.activeServer = null
      }

      control.activeWindowIds.delete(this.windowId)
      resetState(this.workspacePath)

      if (control.activeWindowIds.size === 0) {
        // Remove control file
        this.removeControlFile()
      } else {
        this.writeControlFile(control)
      }

      console.log(`Server stopped for window ${this.windowId}`)
    } catch (error) {
      console.error('Error stopping server:', error)
    } finally {
      this.isShuttingDown = false
    }
  }

  private async isPortAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net
        .createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.once('close', () => resolve(true)).close()
        })
        .listen(this.port)
    })
  }

  private setupControlFileWatcher(): void {
    // try {
    //   this.controlFileWatcher = fs.watchFile(this.controlFile, (eventType) => {
    //     this.handleControlFileChange()
    //   })
    // } catch (error) {
    //   // File doesn't exist yet, that's okay
    // }

    const watchFiles = () => {
      setTimeout(() => {
        const fileContents = fs.existsSync(this.controlFile)
          ? fs.readFileSync(this.controlFile, 'utf8')
          : null
        if (fileContents !== this.fileContents) {
          this.fileContents = fileContents
          this.handleControlFileChange()
        }
        watchFiles()
      }, 100)
    }

    watchFiles()
  }

  private handleControlFileChange(): void {
    const control = this.readControlFile()

    if (!control) {
      this.statusBar.updateStatus('stopped')
      return
    }

    if (control.activeWindowIds.has(this.windowId)) {
      if (control.activeServer !== this.windowId) {
        // Control was transferred to another window
        this.statusBar.updateStatus('running-other-window')
      } else {
        this.statusBar.updateStatus('running')
      }
    } else {
      this.statusBar.updateStatus('stopped')
    }
  }

  private readControlFile(): ServerControlFile | null {
    try {
      if (fs.existsSync(this.controlFile)) {
        const content = fs.readFileSync(this.controlFile, 'utf8')
        const parsed = JSON.parse(content) as ServerControlFile
        return {
          ...parsed,
          activeWindowIds: new Set(parsed.activeWindowIds),
        }
      }
    } catch (error) {
      console.error('Error reading control file:', error)
    }
    return null
  }

  private writeControlFile(control: ServerControlFile): void {
    try {
      const data = JSON.stringify(
        {
          ...control,
          activeWindowIds: Array.from(control.activeWindowIds),
        },
        null,
        2,
      )
      fs.writeFileSync(this.controlFile, data)
    } catch (error) {
      console.error('Error writing control file:', error)
    }
  }

  private removeControlFile(): void {
    try {
      if (fs.existsSync(this.controlFile)) {
        fs.unlinkSync(this.controlFile)
      }
    } catch (error) {
      console.error('Error removing control file:', error)
    }
  }

  isServerRunning(): boolean {
    const control = this.readControlFile()
    return control !== null && control.activeServer !== null
  }

  getCurrentWindowId(): string | null {
    const control = this.readControlFile()
    return control?.windowId || null
  }

  dispose(): void {
    // if (this.controlFileWatcher) {
    //   this.controlFileWatcher.
    // }
    this.statusBar.dispose()
  }
}
