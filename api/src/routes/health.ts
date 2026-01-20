import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();

// Try to read package.json version at module load time
// If reading fails, use "unknown" as fallback
let appVersion = 'unknown';
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packagePath = join(__dirname, '../../package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  appVersion = packageJson.version || 'unknown';
} catch (error) {
  // If package.json cannot be read, version remains "unknown"
  // This ensures the health endpoint still works even if package.json is missing
  console.warn('Warning: Could not read package.json version:', error instanceof Error ? error.message : 'Unknown error');
}

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    version: appVersion,
    timestamp: new Date().toISOString()
  });
});

export default router;

