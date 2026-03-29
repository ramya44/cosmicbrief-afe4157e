/**
 * Edge function contract tests
 *
 * Validates that Supabase edge functions exist and have expected structure.
 * Does NOT call live endpoints — just verifies the function code is well-formed.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const FUNCTIONS_DIR = path.resolve(__dirname, '../../supabase/functions');

// All expected edge functions
const EXPECTED_FUNCTIONS = [
  'calculate-chart-positions',
  'calculate-dasha-periods',
  'calculate-weekly-transits',
  'chat-with-maya',
  'create-cosmic-brief-payment',
  'create-vedic-payment',
  'geocode-place',
  'get-birth-chart',
  'get-timezone',
  'generate-cosmic-brief-forecast',
  'generate-free-vedic-forecast',
  'generate-paid-vedic-forecast',
  'generate-weekly-forecast',
  'handle-subscription-webhook',
  'save-birth-chart',
  'send-forecast-email',
  'send-weekly-forecasts',
  'verify-payment',
];

// Functions that must validate input with Zod
const FUNCTIONS_WITH_ZOD_VALIDATION = [
  'get-birth-chart',
  'calculate-dasha-periods',
];

// Functions that need CORS headers
const FUNCTIONS_WITH_CORS = [
  'get-birth-chart',
  'calculate-dasha-periods',
  'geocode-place',
  'get-timezone',
  'generate-cosmic-brief-forecast',
  'generate-free-vedic-forecast',
  'chat-with-maya',
];

describe('Edge function existence', () => {
  const existingFunctions = fs.existsSync(FUNCTIONS_DIR)
    ? fs.readdirSync(FUNCTIONS_DIR).filter((f) => {
        const fullPath = path.join(FUNCTIONS_DIR, f);
        return fs.statSync(fullPath).isDirectory() && !f.startsWith('_');
      })
    : [];

  it('functions directory exists', () => {
    expect(fs.existsSync(FUNCTIONS_DIR)).toBe(true);
  });

  EXPECTED_FUNCTIONS.forEach((fn) => {
    it(`${fn}/ directory exists`, () => {
      expect(existingFunctions, `Missing edge function: ${fn}`).toContain(fn);
    });
  });

  EXPECTED_FUNCTIONS.forEach((fn) => {
    it(`${fn}/index.ts exists`, () => {
      const indexPath = path.join(FUNCTIONS_DIR, fn, 'index.ts');
      expect(fs.existsSync(indexPath), `Missing ${fn}/index.ts`).toBe(true);
    });
  });
});

describe('Edge function code structure', () => {
  EXPECTED_FUNCTIONS.forEach((fn) => {
    const indexPath = path.join(FUNCTIONS_DIR, fn, 'index.ts');
    if (!fs.existsSync(indexPath)) return;
    const content = fs.readFileSync(indexPath, 'utf-8');

    it(`${fn} uses serve()`, () => {
      expect(content).toContain('serve(');
    });

    it(`${fn} handles OPTIONS for CORS`, () => {
      // All functions should handle preflight
      expect(content).toMatch(/OPTIONS|corsHeaders/);
    });
  });

  FUNCTIONS_WITH_ZOD_VALIDATION.forEach((fn) => {
    it(`${fn} uses Zod for input validation`, () => {
      const indexPath = path.join(FUNCTIONS_DIR, fn, 'index.ts');
      if (!fs.existsSync(indexPath)) return;
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/z\.(object|string|number)/);
    });
  });
});

describe('Shared library completeness', () => {
  const sharedDir = path.join(FUNCTIONS_DIR, '_shared', 'lib');

  const expectedSharedFiles = [
    'vedic-calculator.ts',
    'http.ts',
    'logger.ts',
  ];

  expectedSharedFiles.forEach((file) => {
    it(`_shared/lib/${file} exists`, () => {
      expect(fs.existsSync(path.join(sharedDir, file))).toBe(true);
    });
  });
});

describe('get-birth-chart response contract', () => {
  // Validate that the response interface matches what the frontend expects
  const indexPath = path.join(FUNCTIONS_DIR, 'get-birth-chart', 'index.ts');
  const content = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '';

  const expectedFields = [
    'moonSign',
    'moonSignId',
    'sunSign',
    'sunSignId',
    'nakshatra',
    'nakshatraId',
    'nakshatraPada',
    'nakshatraLord',
  ];

  expectedFields.forEach((field) => {
    it(`response includes ${field}`, () => {
      expect(content).toContain(field);
    });
  });
});
