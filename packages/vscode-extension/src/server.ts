import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router/app'
import { createTRPCContextExpress } from './trpc'
import cors from 'cors'
import { getConfigFile } from './utils/get-config-file'
import { StatusBarManager } from './statusBar'
import * as http from 'http'

export class HarmonyServer {
  private app: express.Application
  private server: http.Server | undefined
  private isServerRunning = false
  private readonly port = 4300
  private path: string
  private readonly statusBar: StatusBarManager

  constructor(path: string, statusBar: StatusBarManager) {
    this.path = path
    this.statusBar = statusBar
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use(
      cors({
        origin(origin, callback) {
          callback(null, origin)
        },
        credentials: true,
      }),
    )

    this.app.use((req, _, next) => {
      req.headers['local-path'] = this.path

      const repository = getConfigFile(this.path)
      if (repository) {
        req.headers['repository'] = Buffer.from(
          JSON.stringify(repository),
        ).toString('base64')
      }

      next()
    })
  }

  private setupRoutes() {
    this.app.use(
      '/trpc',
      createExpressMiddleware({
        router: appRouter,
        createContext: createTRPCContextExpress,
        onError({ error }) {
          console.error('tRPC Error:', error)
        },
      }),
    )

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', port: this.port })
    })
  }

  public changePath(path: string): void {
    this.path = path
    this.afterStart()
  }

  async start(): Promise<void> {
    if (this.isServerRunning) {
      return
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        this.afterStart()
        resolve()
      })

      this.server.on('error', (error) => {
        if ((error as any).code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`))
        } else {
          reject(error)
        }
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.isServerRunning || !this.server) {
      return
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isServerRunning = false
        this.statusBar.updateStatus('stopped')
        console.log('Harmony server stopped')
        resolve()
      })
    })
  }

  private afterStart(): void {
    this.isServerRunning = true
    this.statusBar.updateStatus('running')
    console.log(`Harmony server is running on port ${this.port}`)
  }

  isRunning(): boolean {
    return this.isServerRunning
  }

  getPort(): number {
    return this.port
  }
}
