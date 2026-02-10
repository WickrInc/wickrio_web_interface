import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks, mockResponses } from './setup/mocks.js'

describe('Statistics API Tests', () => {
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

  describe('GET /Statistics', () => {
    it('should get statistics successfully (V1)', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/Statistics')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponses.statistics)
      expect(mockWickrIOAPI.cmdGetStatistics).toHaveBeenCalled()
    })

    it('should get statistics successfully (V2)', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponses.statistics)
      expect(mockWickrIOAPI.cmdGetStatistics).toHaveBeenCalled()
    })

    it('should return statistics with correct structure', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.body.statistics).toBeDefined()
      expect(response.body.statistics).toHaveProperty('message_count')
      expect(response.body.statistics).toHaveProperty('pending_messages')
      expect(response.body.statistics).toHaveProperty('sent')
      expect(response.body.statistics).toHaveProperty('received')
    })
  })

  describe('DELETE /Statistics', () => {
    it('should clear statistics successfully (V1)', async () => {
      const response = await request(app)
        .delete('/WickrIO/V1/Apps/test-api-key/Statistics')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(response.text).toContain('statistics cleared successfully')
      expect(mockWickrIOAPI.cmdClearStatistics).toHaveBeenCalled()
    })

    it('should clear statistics successfully (V2)', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('statistics cleared successfully')
      expect(mockWickrIOAPI.cmdClearStatistics).toHaveBeenCalled()
    })
  })
})
