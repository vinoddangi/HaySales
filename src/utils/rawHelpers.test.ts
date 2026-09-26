import { describe, expect, it } from 'vitest';
import {
  getNumberProp,
  getProp,
  getStringProp,
  isObject,
  parseIsoDate,
  parseNumber,
  parseString,
} from './rawHelpers';

describe('rawHelpers utility functions', () => {
  describe('isObject', () => {
    it('returns true for plain objects and records', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it('returns false for null, undefined, primitives', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject('hello')).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });

  describe('getProp', () => {
    it('extracts property when present', () => {
      const obj = { name: 'Wheat', amount: 500 };
      expect(getProp(obj, 'name')).toBe('Wheat');
      expect(getProp<number>(obj, 'amount', 0)).toBe(500);
    });

    it('returns fallback or undefined when property is missing or not an object', () => {
      expect(getProp({ name: 'Wheat' }, 'amount')).toBeUndefined();
      expect(getProp({ name: 'Wheat' }, 'amount', 100)).toBe(100);
      expect(getProp(null, 'amount', 100)).toBe(100);
      expect(getProp(undefined, 'amount')).toBeUndefined();
    });
  });

  describe('getNumberProp & getStringProp', () => {
    it('extracts numbers with fallback', () => {
      const obj = { weight: '1200', invalid: 'abc' };
      expect(getNumberProp(obj, 'weight', 0)).toBe(1200);
      expect(getNumberProp(obj, 'invalid', 0)).toBe(0);
      expect(getNumberProp(obj, 'missing', 50)).toBe(50);
      expect(getNumberProp(null, 'weight', 10)).toBe(10);
    });

    it('extracts strings with fallback', () => {
      const obj = { title: '  Sale Item  ', empty: '   ' };
      expect(getStringProp(obj, 'title', '')).toBe('Sale Item');
      expect(getStringProp(obj, 'empty', 'default')).toBe('default');
      expect(getStringProp(obj, 'missing', 'default')).toBe('default');
      expect(getStringProp(null, 'title', 'none')).toBe('none');
    });
  });

  describe('parseNumber & parseString & parseIsoDate', () => {
    it('parses numbers properly', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber('100.5')).toBe(100.5);
      expect(parseNumber(undefined, 0)).toBe(0);
      expect(parseNumber(null)).toBeUndefined();
      expect(parseNumber('invalid')).toBeUndefined();
      expect(parseNumber('invalid', 99)).toBe(99);
    });

    it('parses strings properly', () => {
      expect(parseString('hello')).toBe('hello');
      expect(parseString('  hello  ')).toBe('hello');
      expect(parseString('')).toBeUndefined();
      expect(parseString('', 'fallback')).toBe('fallback');
      expect(parseString(null)).toBeUndefined();
    });

    it('parses iso dates properly', () => {
      expect(parseIsoDate('2026-09-26')).toBe('2026-09-26T00:00:00.000Z');
      expect(parseIsoDate(null)).toBeUndefined();
    });
  });
});
