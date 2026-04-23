import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * MCP Client for Supabase operations
 * Provides a TypeScript wrapper around the MCP server
 */
export class SupabaseMCPClient {
  constructor(options = {}) {
    this.client = null
    this.transport = null
    this.connected = false
    this.serverPath = options.serverPath || join(__dirname, '../../../../mcp-supabase-server/server.js')
    this.debug = options.debug || false
  }

  /**
   * Connect to the MCP server
   */
  async connect() {
    try {
      if (this.connected) {
        this.log('Already connected to MCP server')
        return true
      }

      this.log('Connecting to MCP server...')
      
      // Create transport using stdio with environment variables
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.serverPath],
        env: {
          ...process.env,
          SUPABASE_URL: process.env.SUPABASE_URL || 'https://tlfzticrfgeguepliwoe.supabase.co',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sb_publishable_MU1iZkEsDJPsR5mbBJyYWg_y5nT1gc9',
          MCP_SERVER_NAME: 'supabase-mcp-server',
          LOG_LEVEL: 'info'
        }
      })

      // Create client
      this.client = new Client(
        {
          name: 'ventas-pos-desktop',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      )

      // Connect to server
      await this.client.connect(this.transport)
      this.connected = true

      this.log('Connected to MCP server successfully')
      
      // Get available tools
      const tools = await this.getAvailableTools()
      this.log(`Available tools: ${tools.map(t => t.name).join(', ')}`)
      
      return true
    } catch (error) {
      this.logError('Failed to connect to MCP server:', error)
      throw error
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect() {
    try {
      if (this.client && this.connected) {
        await this.client.close()
        this.connected = false
        this.log('Disconnected from MCP server')
      }
    } catch (error) {
      this.logError('Error disconnecting from MCP server:', error)
    }
  }

  /**
   * Get available tools from the MCP server
   */
  async getAvailableTools() {
    if (!this.connected) {
      throw new Error('Not connected to MCP server')
    }

    try {
      const result = await this.client.listTools()
      return result.tools || []
    } catch (error) {
      this.logError('Failed to get available tools:', error)
      throw error
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName, args = {}) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server')
    }

    try {
      this.log(`Calling tool: ${toolName}`, args)
      
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      })

      this.log(`Tool ${toolName} executed successfully`)
      return result
    } catch (error) {
      this.logError(`Failed to call tool ${toolName}:`, error)
      throw error
    }
  }

  // Database operations shortcuts
  async queryTable(table, options = {}) {
    return this.callTool('query-table', { table, ...options })
  }

  async insertRecord(table, data, options = {}) {
    return this.callTool('insert-record', { table, data, ...options })
  }

  async updateRecord(table, data, filter, options = {}) {
    return this.callTool('update-record', { table, data, filter, ...options })
  }

  async deleteRecord(table, filter, options = {}) {
    return this.callTool('delete-record', { table, filter, ...options })
  }

  async getTableSchema(table) {
    return this.callTool('get-table-schema', { table })
  }

  // Authentication operations shortcuts
  async signUpUser(email, password, metadata = {}, options = {}) {
    return this.callTool('sign-up-user', { email, password, metadata, ...options })
  }

  async signInUser(email, password) {
    return this.callTool('sign-in-user', { email, password })
  }

  async signOutUser(accessToken) {
    return this.callTool('sign-out-user', { access_token: accessToken })
  }

  async getCurrentUser(accessToken) {
    return this.callTool('get-current-user', { access_token: accessToken })
  }

  async resetPassword(email, options = {}) {
    return this.callTool('reset-password', { email, ...options })
  }

  async updateUserMetadata(metadata, accessToken) {
    return this.callTool('update-user-metadata', { metadata, access_token: accessToken })
  }

  // Storage operations shortcuts
  async uploadFile(bucket, path, fileData, fileSize, mimeType, options = {}) {
    return this.callTool('upload-file', { 
      bucket, 
      path, 
      file_data: fileData, 
      file_size: fileSize, 
      mime_type: mimeType, 
      ...options 
    })
  }

  async getFileUrl(bucket, path, options = {}) {
    return this.callTool('get-file-url', { bucket, path, ...options })
  }

  async deleteFile(bucket, path) {
    return this.callTool('delete-file', { bucket, path })
  }

  async listFiles(bucket, path = '', options = {}) {
    return this.callTool('list-files', { bucket, path, ...options })
  }

  async getFileInfo(bucket, path) {
    return this.callTool('get-file-info', { bucket, path })
  }

  async createBucket(bucket, options = {}) {
    return this.callTool('create-bucket', { bucket, ...options })
  }

  /**
   * Check if the client is connected
   */
  isConnected() {
    return this.connected
  }

  /**
   * Log messages (if debug is enabled)
   */
  log(message, ...args) {
    if (this.debug) {
      console.log(`[MCPClient] ${message}`, ...args)
    }
  }

  /**
   * Log errors
   */
  logError(message, ...args) {
    console.error(`[MCPClient] ${message}`, ...args)
  }
}

/**
 * Singleton instance for the application
 */
let mcpClientInstance = null

/**
 * Get or create the singleton MCP client instance
 */
export function getMCPClient(options = {}) {
  if (!mcpClientInstance) {
    mcpClientInstance = new SupabaseMCPClient({
      ...options,
      debug: process.env.NODE_ENV === 'development' || options.debug
    })
  }
  return mcpClientInstance
}

/**
 * Initialize the MCP client (convenience function)
 */
export async function initMCPClient(options = {}) {
  const client = getMCPClient(options)
  await client.connect()
  return client
}

// Default export
export default SupabaseMCPClient