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

export function incrementMetric(
  name: string,
  value = 1,
  dimensions?: Record<string, string>
): void {
  try {
    void api?.cmdIncrementMetric(name, value, dimensions).catch((err: unknown) => {
      logger.debug('metrics: failed to increment ' + name + ': ' + String(err))
    })
  } catch (err) {
    logger.debug('metrics: failed to increment ' + name + ': ' + String(err))
  }
}

export function setMetric(name: string, value: number, dimensions?: Record<string, string>): void {
  try {
    void api?.cmdSetMetric(name, value, dimensions).catch((err: unknown) => {
      logger.debug('metrics: failed to set ' + name + ': ' + String(err))
    })
  } catch (err) {
    logger.debug('metrics: failed to set ' + name + ': ' + String(err))
  }
}

export function observeMetric(
  name: string,
  value: number,
  dimensions?: Record<string, string>
): void {
  try {
    void api?.cmdObserveMetric(name, value, dimensions).catch((err: unknown) => {
      logger.debug('metrics: failed to observe ' + name + ': ' + String(err))
    })
  } catch (err) {
    logger.debug('metrics: failed to observe ' + name + ': ' + String(err))
  }
}

export function recordRequest(statusCode: number, durationMs: number, operation?: string): void {
  const dims = operation ? { Operation: operation } : undefined

  incrementMetric(API_REQUESTS)
  if (dims) incrementMetric(API_REQUESTS, 1, dims)

  if (statusCode >= 500) {
    incrementMetric(API_RESPONSES_5XX)
    if (dims) incrementMetric(API_RESPONSES_5XX, 1, dims)
  } else if (statusCode >= 400) {
    incrementMetric(API_RESPONSES_4XX)
    if (dims) incrementMetric(API_RESPONSES_4XX, 1, dims)
  } else if (statusCode >= 200 && statusCode < 300) {
    incrementMetric(API_RESPONSES_2XX)
    if (dims) incrementMetric(API_RESPONSES_2XX, 1, dims)
  }

  const rounded = Math.round(durationMs)
  observeMetric(API_REQUEST_DURATION_MS, rounded)
  if (dims) observeMetric(API_REQUEST_DURATION_MS, rounded, dims)
}

export function recordAuthFailure(): void {
  incrementMetric(API_AUTH_FAILURES)
}
