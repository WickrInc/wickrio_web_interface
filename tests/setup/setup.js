// This file runs before all tests
// Set up test environment variables before any imports
process.env.NODE_ENV = 'test'

// Set up tokens that web_interface.js will read
process.env.tokens = JSON.stringify({
  WICKRIO_BOT_NAME: { value: 'testbot' },
  BOT_PORT: { value: '3000' },
  BOT_API_KEY: { value: 'test-api-key' },
  BOT_API_AUTH_TOKEN: { value: 'test-auth-token' },
  HTTPS_CHOICE: { value: 'no' },
})
