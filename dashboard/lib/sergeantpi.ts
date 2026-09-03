/**
 * SergeantPI API Client
 *
 * Talks to SergeantPI's local server (default :4000).
 * Used by the embedded dashboard page at /dashboard/sergeantpi.
 */
import axios, { type AxiosInstance } from 'axios'

const SERGEANT_URL = process.env.NEXT_PUBLIC_SERGEANT_URL || 'http://localhost:4000'

const sergeant: AxiosInstance = axios.create({
  baseURL: SERGEANT_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Health ──────────────────────────────────────────────────────────────────

export const healthAPI = {
  check: () => sergeant.get('/health'),
}

// ── Analytics ───────────────────────────────────────────────────────────────

export const analyticsAPI = {
  overview: () => sergeant.get('/v1/analytics/overview'),
  agents: () => sergeant.get('/v1/analytics/agents'),
}

// ── Orchestration ───────────────────────────────────────────────────────────

export const orchestrateAPI = {
  run: (task: string, context?: Record<string, unknown>) =>
    sergeant.post('/v1/orchestrate', { task, context }),
  runAgent: (role: string, task: string, context?: Record<string, unknown>) =>
    sergeant.post(`/v1/agent/${role}`, { task, context }),
}

// ── Memory ──────────────────────────────────────────────────────────────────

export const memoryAPI = {
  getAll: () => sergeant.get('/v1/memory'),
}

// ── AWS ─────────────────────────────────────────────────────────────────────

export const awsAPI = {
  bedrockModels: () => sergeant.get('/v1/aws/bedrock/models'),
  bedrockChat: (model: string, messages: any[]) =>
    sergeant.post('/v1/aws/bedrock/chat', { model, messages }),
  storageList: (prefix?: string) =>
    sergeant.get('/v1/aws/storage/list', { params: { prefix } }),
  inventoryList: () => sergeant.get('/v1/aws/cache/inventory'),
  inventoryGet: (sku: string) => sergeant.get(`/v1/aws/cache/inventory/${sku}`),
  inventoryUpsert: (item: any) => sergeant.put('/v1/aws/cache/inventory', item),
  inventoryUpdateStock: (sku: string, quantity: number) =>
    sergeant.patch(`/v1/aws/cache/inventory/${sku}/stock`, { quantity }),
  stateGet: (key: string) => sergeant.get(`/v1/aws/cache/state/${key}`),
  stateSet: (key: string, value: unknown, ttl?: number) =>
    sergeant.put(`/v1/aws/cache/state/${key}`, { value, ttl }),
}

export default sergeant
