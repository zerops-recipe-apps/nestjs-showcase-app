/**
 * Thin fetch wrapper for the showcase API. The base URL is baked at
 * build time via `VITE_API_URL` (set in the prod setup's
 * `envVariables`) and falls back to the project-wide `DEV_API_URL` for
 * dev iteration. The functions intentionally stay verbose — every
 * dashboard card lives off a tight set of typed endpoints.
 */

const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

export interface Item {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ItemsListResponse {
  items: Item[];
  count: number;
  total: number;
}

export interface CacheDemoResponse {
  payload: { greeting: string; generatedAt: string; computedMs: number };
  cacheHit: boolean;
  elapsedMs: number;
  hits: number;
  misses: number;
}

export interface CacheStateResponse {
  hits: number;
  misses: number;
}

export interface QueueEvent {
  subject: string;
  kind?: string;
  payload: unknown;
  receivedAt: string;
}

export interface QueueStateResponse {
  processed: number;
  events: QueueEvent[];
}

export interface QueuePublishResponse {
  ok: boolean;
  subject: string;
  envelope: { kind: string; payload: unknown; issuedAt: string };
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

export interface StorageStateResponse {
  count: number;
  recent: StorageObject[];
}

export interface StorageUploadResponse {
  object: StorageObject;
  count: number;
}

export interface SearchHit {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  _formatted?: Record<string, string>;
}

export interface SearchResponse {
  hits: SearchHit[];
  query: string;
  total: number;
  indexed: number;
}

export interface SearchStateResponse {
  indexed: number;
}

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'down';
  detail?: string;
}

export interface ServicesStateResponse {
  services: ServiceStatus[];
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${body ? ': ' + body : ''}`);
  }
  return (await res.json()) as T;
}

export function listItems(limit = 20) {
  return json<ItemsListResponse>(`/api/items?limit=${limit}`);
}

export function createItem(name: string, description?: string | null) {
  return json<{ item: Item }>(`/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: description ?? null }),
  });
}

export function deleteItem(id: number) {
  return json<{ deleted: true; id: number }>(`/api/items/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fires the cache demo and returns BOTH the parsed body AND the
 * X-Cache / X-Cache-Elapsed-Ms response headers. The headers are the
 * load-bearing proof per the showcase spec: the badge text comes from
 * the header, not the body field, so a cross-origin regression where
 * exposedHeaders drops the value renders an explicit "header missing"
 * state instead of silently falling back to the body.
 */
export async function cacheDemo(): Promise<{
  body: CacheDemoResponse;
  headerCache: string | null;
  headerElapsedMs: string | null;
}> {
  const res = await fetch(`${API_BASE}/api/cache/demo`);
  if (!res.ok) throw new Error(`cache demo failed ${res.status}`);
  const body = (await res.json()) as CacheDemoResponse;
  return {
    body,
    headerCache: res.headers.get('X-Cache'),
    headerElapsedMs: res.headers.get('X-Cache-Elapsed-Ms'),
  };
}

export function cacheState() {
  return json<CacheStateResponse>(`/api/cache/state`);
}

export function queuePublish(kind: string, message: string) {
  return json<QueuePublishResponse>(`/api/queue/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, message }),
  });
}

export function queueState() {
  return json<QueueStateResponse>(`/api/queue/state`);
}

export function storageState() {
  return json<StorageStateResponse>(`/api/storage/state`);
}

/**
 * Upload a blob via multipart/form-data. The browser-walk relies on
 * this path (no <input type=file> dialog) so the dashboard verifier
 * can fire an upload programmatically.
 */
export async function storageUploadBlob(
  filename: string,
  body: Blob,
): Promise<StorageUploadResponse> {
  const form = new FormData();
  form.append('file', body, filename);
  const res = await fetch(`${API_BASE}/api/storage/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`storage upload failed ${res.status}${text ? ': ' + text : ''}`);
  }
  return (await res.json()) as StorageUploadResponse;
}

export async function storageUploadFile(file: File): Promise<StorageUploadResponse> {
  return storageUploadBlob(file.name, file);
}

export function search(query: string, limit = 20) {
  const q = encodeURIComponent(query);
  return json<SearchResponse>(`/api/search?q=${q}&limit=${limit}`);
}

export function searchState() {
  return json<SearchStateResponse>(`/api/search/state`);
}

export function servicesState() {
  return json<ServicesStateResponse>(`/api/services/state`);
}
