/**
 * Pre-deploy verification script
 *
 * Runs all checks needed before deploying to production:
 * 1. TypeScript type checking
 * 2. Unit & regression tests (vitest)
 * 3. Production build
 *
 * Usage: npx tsx scripts/pre-deploy.ts
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

function runCheck(name: string, command: string): CheckResult {
  const start = Date.now();
  try {
    execSync(command, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 300_000, // 5 min max
    });
    return { name, passed: true, duration: Date.now() - start };
  } catch (err: any) {
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
    // Trim output to last 40 lines for readability
    const lines = output.split('\n');
    const trimmed = lines.length > 40 ? lines.slice(-40).join('\n') : output;
    return { name, passed: false, duration: Date.now() - start, error: trimmed };
  }
}

console.log('');
console.log('========================================');
console.log('  Cosmic Brief — Pre-Deploy Checks');
console.log('========================================');
console.log('');

const checks: CheckResult[] = [];

// 1. TypeScript type check
console.log('1/3  Type checking...');
checks.push(runCheck('TypeScript', 'npx tsc --noEmit -p tsconfig.app.json'));
console.log(`     ${checks[0].passed ? '✅' : '❌'} TypeScript (${(checks[0].duration / 1000).toFixed(1)}s)`);

// 2. Vitest
console.log('2/3  Running tests...');
checks.push(runCheck('Tests', 'npx vitest run --reporter=verbose'));
console.log(`     ${checks[1].passed ? '✅' : '❌'} Tests (${(checks[1].duration / 1000).toFixed(1)}s)`);

// 3. Production build (without prerendering — that's slow and needs Puppeteer)
console.log('3/3  Building for production...');
checks.push(runCheck('Build', 'npx vite build'));
console.log(`     ${checks[2].passed ? '✅' : '❌'} Build (${(checks[2].duration / 1000).toFixed(1)}s)`);

// Summary
console.log('');
console.log('========================================');
const allPassed = checks.every((c) => c.passed);
if (allPassed) {
  console.log('  ✅ All checks passed — safe to deploy!');
} else {
  console.log('  ❌ Some checks failed:');
  for (const check of checks.filter((c) => !c.passed)) {
    console.log(`\n  --- ${check.name} ---`);
    console.log(check.error);
  }
}
console.log('========================================');
console.log('');

process.exit(allPassed ? 0 : 1);
