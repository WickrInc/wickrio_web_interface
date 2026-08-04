import { WickrIOAddon } from 'wickrio-bot-api'
import logger from './logger'

export const API_REQUESTS = 'Api_Requests'
export const API_RESPONSES_2XX = 'Api_Responses_2xx'
export const API_RESPONSES_4XX = 'Api_Responses_4xx'
export const API_RESPONSES_5XX = 'Api_Responses_5xx'
export const API_AUTH_FAILURES = 'Api_Auth_Failures'
export const API_REQUEST_DURATION_MS = 'Api_Request_Duration_Ms'

let api: WickrIOAddon | undefined

export function initMetrics(wickrIOAPI: WickrIOAddon): void {
  api = wickrIOAPI
}

function increment(name: string, value = 1): void {
  try {
    void api?.cmdIncrementMetric(name, value).catch((err: unknown) => {
      logger.debug('metrics: failed to increment ' + name + ': ' + String(err))
    })
  } catch (err) {
    logger.debug('metrics: failed to increment ' + name + ': ' + String(err))
  }
}

function set(name: string, value: number): void {
  try {
    void api?.cmdSetMetric(name, value).catch((err: unknown) => {
      logger.debug('metrics: failed to set ' + name + ': ' + String(err))
    })
  } catch (err) {
    logger.debug('metrics: failed to set ' + name + ': ' + String(err))
  }
}

export function incrementMetric(name: string, value = 1): void {
  increment(name, value)
}

export function setMetric(name: string, value: number): void {
  set(name, value)
}

export function recordRequest(statusCode: number, durationMs: number): void {
  increment(API_REQUESTS)

  if (statusCode >= 500) {
    increment(API_RESPONSES_5XX)
  } else if (statusCode >= 400) {
    increment(API_RESPONSES_4XX)
  } else if (statusCode >= 200 && statusCode < 300) {
    increment(API_RESPONSES_2XX)
  }

  // Duration is a gauge, it is the latest observed value rather than a total.
  set(API_REQUEST_DURATION_MS, Math.round(durationMs))
}

export function recordAuthFailure(): void {
  increment(API_AUTH_FAILURES)
}
