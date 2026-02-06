/**
 * Test setup — override the DB path so tests use an in-memory (temp) database
 * instead of touching the real data/llm-costs.db.
 *
 * We monkey-patch process.cwd to point at a temp dir so getDbPath() resolves
 * there.  Each test file that calls seedDatabase() gets a clean slate.
 */
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Create a unique temp dir per test run
const testDataDir = mkdtempSync(path.join(tmpdir(), 'llm-cost-test-'));

// Override process.cwd so db.ts puts the sqlite file in the temp dir
const originalCwd = process.cwd;
process.cwd = () => testDataDir;

// Clean up after all tests
import { afterAll } from 'vitest';
import { rmSync } from 'fs';

afterAll(() => {
  process.cwd = originalCwd;
  try { rmSync(testDataDir, { recursive: true, force: true }); } catch {}
});
