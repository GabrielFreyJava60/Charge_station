import { Router } from 'express';
import { buildHealthService } from './health.service';

export function healthRouter(): Router {
  const router = Router();
  const service = buildHealthService();

  router.get('/health', async (_req, res) => {
    const result = await service.check();
    res.status(result.code).json(result);
  });

  return router;
}