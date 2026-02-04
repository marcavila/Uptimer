import { Hono } from 'hono';

import type { Env } from '../env';
import { AppError } from '../middleware/errors';
import { computePublicStatusPayload } from '../public/status';
import { refreshPublicStatusSnapshot } from '../snapshots';
import { parseSettingsPatch, patchSettings, readSettings } from '../settings';

export const adminSettingsRoutes = new Hono<{ Bindings: Env }>();

function queuePublicStatusSnapshotRefresh(c: { env: Env; executionCtx: ExecutionContext }) {
  const now = Math.floor(Date.now() / 1000);
  c.executionCtx.waitUntil(
    refreshPublicStatusSnapshot({
      db: c.env.DB,
      now,
      compute: () => computePublicStatusPayload(c.env.DB, Math.floor(Date.now() / 1000)),
    }).catch((err) => {
      console.warn('public snapshot: refresh failed', err);
    }),
  );
}

adminSettingsRoutes.get('/', async (c) => {
  const settings = await readSettings(c.env.DB);
  return c.json({ settings });
});

adminSettingsRoutes.patch('/', async (c) => {
  const rawBody = await c.req.json().catch(() => {
    throw new AppError(400, 'INVALID_ARGUMENT', 'Invalid JSON body');
  });

  const patch = parseSettingsPatch(rawBody);
  await patchSettings(c.env.DB, patch);

  queuePublicStatusSnapshotRefresh(c);

  const settings = await readSettings(c.env.DB);
  return c.json({ settings });
});
