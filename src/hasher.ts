import crypto from 'crypto';

/**
 * Deterministically hash an agent input payload.
 * Sorts keys before serializing to ensure identical payloads
 * always produce identical hashes regardless of key order.
 * Returns 'sha256:<hex_digest>'.
 */
export function hashInputs(payload: Record<string, unknown>): string {
  const sorted = sortKeysDeep(payload);
  const canonical = JSON.stringify(sorted);
  const digest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

function sortKeysDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as object)
      .sort()
      .reduce((acc, key) => {
        (acc as Record<string, unknown>)[key] = sortKeysDeep(
          (obj as Record<string, unknown>)[key]
        );
        return acc;
      }, {} as Record<string, unknown>);
  }
  return obj;
}
