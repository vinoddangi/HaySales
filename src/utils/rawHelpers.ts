import { parseTransactionDate } from './formatters';

export type RawRecord = Record<string, unknown>;

/**
 * Type guard checking whether a value is a non-null object record.
 */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

/**
 * Safely extracts a typed property from an unknown object / record.
 * - When fallback is provided: returns T
 * - When no fallback is provided: returns T | undefined
 */
export function getProp<T>(_obj: unknown, _key: PropertyKey, _fallback: T): T;
export function getProp<T = unknown>(
  _obj: unknown,
  _key: PropertyKey,
): T | undefined;
export function getProp<T = unknown>(
  obj: unknown,
  key: PropertyKey,
  fallback?: T,
): T | undefined {
  if (isObject(obj) && key in obj) {
    const val = obj[key as string];
    return val !== undefined && val !== null ? (val as T) : fallback;
  }
  return fallback;
}

/**
 * Parses a value into a number.
 * - parseNumber(val, 0) -> returns number
 * - parseNumber(val) -> returns number | undefined
 */
export function parseNumber(_val: unknown, _fallback: number): number;
export function parseNumber(_val: unknown): number | undefined;
export function parseNumber(
  val: unknown,
  fallback?: number,
): number | undefined {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Parses a value into a string.
 * - parseString(val, '') -> returns string
 * - parseString(val) -> returns string | undefined
 */
export function parseString(_val: unknown, _fallback: string): string;
export function parseString(_val: unknown): string | undefined;
export function parseString(
  val: unknown,
  fallback?: string,
): string | undefined {
  if (val === null || val === undefined) {
    return fallback;
  }
  const s = String(val).trim();
  return s.length > 0 ? s : fallback;
}

/**
 * Parses a date value into an ISO string.
 * - parseIsoDate(val, '') -> returns string
 * - parseIsoDate(val) -> returns string | undefined
 */
export function parseIsoDate(_val: unknown, _fallback: string): string;
export function parseIsoDate(_val: unknown): string | undefined;
export function parseIsoDate(
  val: unknown,
  fallback?: string,
): string | undefined {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  const d = parseTransactionDate(val as any);
  return d ? d.toISOString() : fallback;
}

export function parseBoolean(_val: unknown, _fallback: boolean): boolean;
export function parseBoolean(_val: unknown): boolean | undefined;
export function parseBoolean(
  val: unknown,
  fallback?: boolean,
): boolean | undefined {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === 1 || val === '1') return true;
  if (val === 'false' || val === 0 || val === '0') return false;
  return fallback;
}

/**
 * Safely extracts and parses a number property using parseNumber.
 */
export function getNumberProp(
  _obj: unknown,
  _key: PropertyKey,
  _fallback: number,
): number;
export function getNumberProp(
  _obj: unknown,
  _key: PropertyKey,
): number | undefined;
export function getNumberProp(
  obj: unknown,
  key: PropertyKey,
  fallback?: number,
): number | undefined {
  return fallback !== undefined
    ? parseNumber(getProp(obj, key), fallback)
    : parseNumber(getProp(obj, key));
}

/**
 * Safely extracts and parses a string property using parseString.
 */
export function getStringProp(
  _obj: unknown,
  _key: PropertyKey,
  _fallback: string,
): string;
export function getStringProp(
  _obj: unknown,
  _key: PropertyKey,
): string | undefined;
export function getStringProp(
  obj: unknown,
  key: PropertyKey,
  fallback?: string,
): string | undefined {
  return fallback !== undefined
    ? parseString(getProp(obj, key), fallback)
    : parseString(getProp(obj, key));
}
