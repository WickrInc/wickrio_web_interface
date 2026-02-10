import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks, mockResponses } from './setup/mocks.js'

describe('Group Conversation API Tests', () => {
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

  describe('POST /GroupConvo - Create Group Conversation', () => {
    it('should create group conversation successfully', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/GroupConvo')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          groupconvo: {
            members: [{ name: 'user1' }, { name: 'user2' }],
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddGroupConvo).toHaveBeenCalledWith(['user1', 'user2'], '', '')
    })

    it('should create group conversation with TTL and BOR', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/GroupConvo')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          groupconvo: {
            members: [{ name: 'user1' }, { name: 'user2' }],
            ttl: 3600,
            bor: 1,
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddGroupConvo).toHaveBeenCalledWith(['user1', 'user2'], '3600', '1')
    })

    it('should reject request without members', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/GroupConvo')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          groupconvo: {},
        })

      expect(response.status).toBe(200)
      expect(response.text).toContain('An array of GroupConvo members is required')
    })
  })

  describe('GET /GroupConvo - List Group Conversations', () => {
    it('should get all group conversations', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/GroupConvo')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetGroupConvos).toHaveBeenCalled()
      expect(response.body).toEqual(mockResponses.groupConvos)
    })
  })

  describe('GET /GroupConvo/:vGroupID - Get Specific Group Conversation', () => {
    it('should get specific group conversation', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/GroupConvo/GC123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetGroupConvo).toHaveBeenCalledWith('GC123')
    })
  })

  describe('DELETE /GroupConvo/:vGroupID - Leave Group Conversation', () => {
    it('should leave group conversation', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/GroupConvo/GC123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('has left the GroupConvo')
      expect(mockWickrIOAPI.cmdDeleteGroupConvo).toHaveBeenCalledWith('GC123')
    })
  })
})
