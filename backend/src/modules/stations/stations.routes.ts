import { Router } from 'express';
import { verifyCognitoJwt, requireGroups } from '../../middlewares/auth';
import { StationsController } from './stations.controller';
import { buildStationsService } from './stations.service';

const ADMIN_GROUP = 'admin';
const SUPPORT_GROUP = 'support';

export function stationsRouter(): Router {
  const router = Router();
  const controller = new StationsController(buildStationsService());

  // Public endpoints can be without auth. If you want auth, keep verifyCognitoJwt.
  router.get('/stations', verifyCognitoJwt, controller.list);
  router.get('/stations/:stationId', verifyCognitoJwt, controller.getById);

  router.post(
    '/stations',
    verifyCognitoJwt,
    requireGroups([ADMIN_GROUP]),
    controller.create
  );

  router.patch(
    '/stations/:stationId/status',
    verifyCognitoJwt,
    requireGroups([ADMIN_GROUP, SUPPORT_GROUP]),
    controller.updateStatus
  );

  return router;
}
