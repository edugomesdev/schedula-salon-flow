
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isValidDate } from '../dateHelpers';

describe('dateHelpers', () => {
  let originalDateNow: () => number;
  
  beforeEach(() => {
    // Mock Date.now to return a fixed timestamp (January 1, 2024)
    originalDateNow = Date.now;
    Date.now = vi.fn(() => new Date('2024-01-01').getTime());
  });
  
  afterEach(() => {
    // Restore the original Date.now function
    Date.now = originalDateNow;
  });
  
  describe('isValidDate', () => {
    it('returns true for future dates', () => {
      expect(isValidDate('2025-01-01')).toBe(true);
    });
    
    it('returns false for past dates', () => {
      expect(isValidDate('2000-01-01')).toBe(false);
    });
    
    it('returns false for invalid date formats', () => {
      expect(isValidDate('not-a-date')).toBe(false);
    });
  });
});
