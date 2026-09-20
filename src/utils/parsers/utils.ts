/**
 * Parser Helper Utilities
 * Clean, type-safe primitives for parsing raw document fields into standard JS types.
 */

import { parseTransactionDate } from '../formatters';

/**
 * Safely parse a value as a number with a fallback default (e.g. 0).
 */
export function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Safely parse an optional number (returns undefined if value is null/undefined/empty string).
 */
export function parseOptionalNumber(val: any): number | undefined {
  if (val === null || val === undefined || val === '') {
    return undefined;
  }
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

/**
 * Safely parse a string with trimming.
 */
export function parseString(val: any, fallback = ''): string {
  if (val === null || val === undefined) {
    return fallback;
  }
  return String(val).trim();
}

/**
 * Safely parse an optional trimmed string (returns undefined if empty or null/undefined).
 */
export function parseOptionalString(val: any): string | undefined {
  if (val === null || val === undefined) {
    return undefined;
  }
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

/**
 * Safely parse an ISO date string from Date, timestamp object, millis, or date string.
 */
export function parseIsoDate(val: any, fallback?: string): string {
  const d = parseTransactionDate(val);
  if (d) {
    return d.toISOString();
  }
  return fallback || new Date().toISOString();
}

/**
 * Safely parse a boolean value.
 */
export function parseBoolean(val: any, fallback = false): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === 1 || val === '1') return true;
  if (val === 'false' || val === 0 || val === '0') return false;
  return fallback;
}
