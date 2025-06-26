import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router/app'
import { createTRPCContextExpress, setCurrentWorkspacePath } from './trpc'
import cors from 'cors'
import { getConfigFile } from './utils/get-config-file'
import { StatusBarManager } from './statusBar'
import * as http from 'http'
import { z } from 'zod'

export class HarmonyServer {
  private app: express.Application
  private server: http.Server | undefined
  private isServerRunning = false
  private readonly port = 4300
  private readonly getPathConfig: (
    requestPath?: string,
  ) => Record<string, string>

  private getPath(): Record<string, string>
  private getPath(requestPath: string): string
  private getPath(requestPath?: string): string | Record<string, string> {
    const pathConfig = this.getPathConfig(requestPath)
    if (requestPath) {
      const path = pathConfig[requestPath]
      if (!path) {
        throw new Error(`No path configured for request path: ${requestPath}`)
      }
      return path
    }
    return pathConfig
  }

  private readonly statusBar: StatusBarManager

  constructor(
    getPathConfig: (requestPath?: string) => Record<string, string>,
    statusBar: StatusBarManager,
  ) {
    this.statusBar = statusBar
    this.app = express()
    this.getPathConfig = getPathConfig
    this.setupMiddleware()
    this.setupRoutes()
  }

  async start(): Promise<void> {
    if (this.isServerRunning) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          this.isServerRunning = true
          console.log(`Harmony server started on port ${this.port}`)
          resolve()
        })

        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            reject(new Error('Port 4300 is already in use'))
          } else {
            reject(error)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async stop(): Promise<void> {
    if (!this.isServerRunning || !this.server) {
      return
    }

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          reject(error)
        } else {
          this.isServerRunning = false
          this.server = undefined
          console.log('Harmony server stopped')
          resolve()
        }
      })
    })
  }

  isRunning(): boolean {
    return this.isServerRunning
  }

  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin(origin, callback) {
          callback(null, origin)
        },
        credentials: true,
      }),
    )
    this.app.use(express.json())
  }

  private setupRoutes(): void {
    // tRPC middleware
    this.app.use(
      '/trpc',
      createExpressMiddleware({
        router: appRouter,
        createContext: ({ req, res }) => {
          const origin = req.headers.origin
          if (!origin) {
            throw new Error('Origin is required')
          }
          return createTRPCContextExpress({
            req,
            res,
            path: this.getPath(origin),
          })
        },
      }),
    )

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', port: this.port })
    })

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Harmony UI Server',
        port: this.port,
        status: this.isServerRunning ? 'running' : 'stopped',
        path: this.getPath(),
      })
    })
  }
}
