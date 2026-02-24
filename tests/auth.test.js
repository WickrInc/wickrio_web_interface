import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'

describe('Authentication Tests', () => {
  let app

  beforeAll(async () => {
    app = await createTestServer()
  })

  afterAll(async () => {
    await closeTestServer()
  })

  describe('Basic Auth', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await request(app).get('/WickrIO/V1/Apps/test-api-key/Statistics')

      expect(response.status).toBe(401)
      expect(response.text).toContain('Access denied: invalid Authorization Header format')
    })

    it('should reject requests with invalid auth token', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/Statistics')
        .set('Authorization', createAuthHeader('wrong-token'))

      expect(response.status).toBe(401)
      expect(response.text).toContain('Access denied: invalid basic-auth token')
    })

    it('should accept requests with valid auth token', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/Statistics')
        .set('Authorization', createAuthHeader('test-auth-token'))

      expect(response.status).toBe(200)
    })

    it('should accept auth token without "Basic" prefix', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/Statistics')
        .set('Authorization', Buffer.from('test-auth-token').toString('base64'))

      expect(response.status).toBe(200)
    })
  })

  describe('API Key Authentication (V2)', () => {
    it('should reject V2 requests without x-api-key header', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', createAuthHeader())

      expect(response.status).toBe(401)
      expect(response.text).toContain('Access denied: invalid api-key')
    })

    it('should reject V2 requests with invalid x-api-key', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', createAuthHeader())
        .set('x-api-key', 'wrong-key')

      expect(response.status).toBe(401)
      expect(response.text).toContain('Access denied: invalid api-key')
    })

    it('should accept V2 requests with valid x-api-key', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Statistics')
        .set('Authorization', createAuthHeader())
        .set('x-api-key', createApiKeyHeader())

      expect(response.status).toBe(200)
    })
  })

  describe('404 Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown/endpoint')
        .set('Authorization', createAuthHeader())

      expect(response.status).toBe(404)
      expect(response.text).toContain('Endpoint /unknown/endpoint not found')
    })
  })
})
