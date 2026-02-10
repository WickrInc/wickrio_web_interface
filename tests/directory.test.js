import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks, mockResponses } from './setup/mocks.js'

describe('Directory API Tests', () => {
  let app
  const authHeader = createAuthHeader()
  const apiKey = createApiKeyHeader()

  beforeAll(async () => {
    app = await createTestServer()
  })

  afterAll(async () => {
    await closeTestServer()
  })

  beforeEach(() => {
    resetMocks()
  })

  describe('GET /Directory', () => {
    it('should get directory successfully (V1)', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/Directory')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetDirectory).toHaveBeenCalled()
      expect(response.body).toEqual(mockResponses.directory)
    })

    it('should get directory successfully (V2)', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Directory')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetDirectory).toHaveBeenCalled()
      expect(response.body).toEqual(mockResponses.directory)
    })

    it('should return directory with users array', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Directory')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.body).toHaveProperty('users')
      expect(Array.isArray(response.body.users)).toBe(true)
      expect(response.body.users.length).toBeGreaterThan(0)
    })
  })
})
