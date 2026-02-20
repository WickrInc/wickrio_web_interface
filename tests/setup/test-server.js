import './mocks.js'

let appInstance = null

// Create a test instance of the Express app
export async function createTestServer() {
  if (appInstance) {
    return appInstance
  }

  // Dynamic import to ensure mocks are loaded first
  const webInterface = await import('../../dist/web_interface.js')
  const { app, main, setMockAPI } = webInterface

  // Inject the mock API before initializing
  if (setMockAPI) {
    const { mockWickrIOAPI } = await import('./mocks.js')
    setMockAPI(mockWickrIOAPI)
  }

  // Initialize the app
  await main()

  appInstance = app
  return app
}

export async function closeTestServer() {
  appInstance = null
}

// Helper function to create auth headers
export function createAuthHeader(token = 'test-auth-token') {
  return `Basic ${Buffer.from(token).toString('base64')}`
}

export function createApiKeyHeader(key = 'test-api-key') {
  return key
}
