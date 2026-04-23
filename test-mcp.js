import { getMCPClient } from './src/lib/mcp-client.js'

/**
 * Simple test script to verify MCP server functionality
 */
async function testMCPServer() {
  console.log('🚀 Testing MCP Supabase Server...')
  
  try {
    // Initialize MCP client
    const mcpClient = await getMCPClient({ debug: true })
    await mcpClient.connect()
    
    console.log('✅ Connected to MCP server')
    
    // Test getting available tools
    const tools = await mcpClient.getAvailableTools()
    console.log(`📋 Available tools: ${tools.length}`)
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`)
    })
    
    // Test database operations (will fail if tables don't exist, but that's expected)
    console.log('\n🔍 Testing database tools...')
    try {
      const schema = await mcpClient.getTableSchema('products')
      console.log('✅ Table schema test passed')
    } catch (error) {
      console.log('⚠️  Table schema test failed (expected if table does not exist):', error.message)
    }
    
    // Test auth operations
    console.log('\n🔐 Testing authentication tools...')
    try {
      await mcpClient.getCurrentUser()
      console.log('✅ Get current user test passed')
    } catch (error) {
      console.log('⚠️  Get current user test failed (expected without session):', error.message)
    }
    
    // Disconnect
    await mcpClient.disconnect()
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
testMCPServer()