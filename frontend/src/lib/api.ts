/**
 * @file lib/api.ts
 * @description Hardened REST API client attaching the cryptographic X-Synvora-Api-Key
 * header to authenticate requests with the Django Enterprise Backend.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

const INTERNAL_SECURITY_KEY =
  process.env.NEXT_PUBLIC_SYNVORA_API_KEY || 'synvora_live_sec_k982347982374982374982374';

function getSecureHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Synvora-Api-Key': INTERNAL_SECURITY_KEY,
  };
}

export async function fetchFromBackend<T>(endpoint: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      headers: getSecureHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return fallbackData;
    return await res.json();
  } catch {
    return fallbackData;
  }
}

export async function postToBackend<T>(endpoint: string, payload: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      method: 'POST',
      headers: getSecureHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function patchToBackend<T>(
  endpoint: string,
  id: number | string,
  payload: Record<string, unknown>
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PATCH',
      headers: getSecureHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}