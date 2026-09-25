import { parseTransactionDate } from './formatters';

export type RawRecord = Record<string, unknown>;

export function parseNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export function parseOptionalNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') {
    return undefined;
  }
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export function parseString(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) {
    return fallback;
  }
  return String(val).trim();
}

export function parseOptionalString(val: unknown): string | undefined {
  if (val === null || val === undefined) {
    return undefined;
  }
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

export function parseIsoDate(val: unknown, fallback?: string): string {
  const d = parseTransactionDate(val as any);
  if (d) {
    return d.toISOString();
  }
  return fallback || (val ? String(val) : '');
}

export function parseOptionalIsoDate(val: unknown): string | undefined {
  if (val === null || val === undefined || val === '') {
    return undefined;
  }
  const d = parseTransactionDate(val as any);
  return d ? d.toISOString() : undefined;
}

export function parseBoolean(val: unknown, fallback = false): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === 1 || val === '1') return true;
  if (val === 'false' || val === 0 || val === '0') return false;
  return fallback;
}
