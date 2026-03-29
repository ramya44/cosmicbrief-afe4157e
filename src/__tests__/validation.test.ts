import { describe, it, expect } from 'vitest';
import {
  validateBirthDate,
  validateBirthTime,
  validateBirthPlace,
  validateEmail,
  validateBirthForm,
  isFormValid,
  MIN_DATE,
  EMAIL_REGEX,
} from '@/lib/validation';

describe('validateBirthDate', () => {
  it('rejects empty date', () => {
    expect(validateBirthDate('')).toBeTruthy();
  });

  it('rejects date before 1900', () => {
    expect(validateBirthDate('1899-12-31')).toMatch(/1900/);
  });

  it('rejects future date', () => {
    expect(validateBirthDate('2099-01-01')).toMatch(/future/i);
  });

  it('accepts valid date', () => {
    expect(validateBirthDate('1989-04-04')).toBeNull();
  });

  it('rejects under-18 when requireAge18 is set', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 10);
    const dateStr = recentDate.toISOString().split('T')[0];
    expect(validateBirthDate(dateStr, { requireAge18: true })).toMatch(/18/);
  });

  it('accepts over-18 when requireAge18 is set', () => {
    expect(validateBirthDate('1990-01-01', { requireAge18: true })).toBeNull();
  });
});

describe('validateBirthTime', () => {
  it('rejects empty time', () => {
    expect(validateBirthTime('')).toBeTruthy();
  });

  it('accepts valid time', () => {
    expect(validateBirthTime('09:30')).toBeNull();
  });
});

describe('validateBirthPlace', () => {
  it('rejects empty place', () => {
    expect(validateBirthPlace('', false)).toBeTruthy();
  });

  it('rejects place without coordinates', () => {
    expect(validateBirthPlace('Hyderabad', false)).toMatch(/coordinates|dropdown/i);
  });

  it('accepts place with coordinates', () => {
    expect(validateBirthPlace('Hyderabad, India', true)).toBeNull();
  });
});

describe('validateEmail', () => {
  it('rejects empty email', () => {
    expect(validateEmail('')).toBeTruthy();
  });

  it('rejects invalid email', () => {
    expect(validateEmail('notanemail')).toBeTruthy();
  });

  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull();
  });
});

describe('EMAIL_REGEX', () => {
  const valid = ['a@b.com', 'user+tag@domain.co', 'name@sub.domain.org'];
  const invalid = ['@b.com', 'a@', 'a b@c.com', ''];

  valid.forEach((email) => {
    it(`matches ${email}`, () => {
      expect(EMAIL_REGEX.test(email)).toBe(true);
    });
  });

  invalid.forEach((email) => {
    it(`rejects "${email}"`, () => {
      expect(EMAIL_REGEX.test(email)).toBe(false);
    });
  });
});

describe('validateBirthForm', () => {
  it('returns no errors for valid form', () => {
    const errors = validateBirthForm(
      { birthDate: '1989-04-04', birthTime: '21:04', birthPlace: 'Hyderabad', email: 'test@example.com' },
      { hasPlaceCoords: true }
    );
    expect(isFormValid(errors)).toBe(true);
  });

  it('returns multiple errors for empty form', () => {
    const errors = validateBirthForm(
      { birthDate: '', birthTime: '', birthPlace: '', email: '' },
      { hasPlaceCoords: false }
    );
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(3);
  });

  it('skips birth time validation when birthTimeUnknown', () => {
    const errors = validateBirthForm(
      { birthDate: '1989-04-04', birthTime: '', birthPlace: 'Hyderabad', email: 'test@example.com' },
      { hasPlaceCoords: true, birthTimeUnknown: true }
    );
    expect(errors.birthTime).toBeUndefined();
  });
});

describe('MIN_DATE', () => {
  it('is 1900-01-01', () => {
    expect(MIN_DATE).toBe('1900-01-01');
  });
});
