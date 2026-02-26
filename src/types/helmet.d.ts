declare module 'helmet' {
  import { RequestHandler } from 'express'
  function helmet(options?: Record<string, unknown>): RequestHandler
  export = helmet
}
