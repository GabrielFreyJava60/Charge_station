import { Router } from 'express';
import { verifyCognitoJwt, requireGroups } from '../../middlewares/auth';
import { UsersController } from './users.controller';
import { buildUsersService } from './users.service';

const ADMIN_GROUP = 'admin';

export function usersRouter(): Router {
  const router = Router();
  const controller = new UsersController(buildUsersService());

  // Доступно любому авторизованному пользователю только для своего аккаунта
  router.get('/users/me', verifyCognitoJwt, controller.getMe);
  router.patch('/users/me/profile', verifyCognitoJwt, controller.updateMyProfile);

  // Админские операции над любыми аккаунтами
  router.patch(
    '/admin/users/:userId/profile',
    verifyCognitoJwt,
    requireGroups([ADMIN_GROUP]),
    controller.updateUserProfileAsAdmin
  );

  router.patch(
    '/admin/users/:userId/role',
    verifyCognitoJwt,
    requireGroups([ADMIN_GROUP]),
    controller.updateUserRole
  );

  router.delete(
    '/admin/users/:userId',
    verifyCognitoJwt,
    requireGroups([ADMIN_GROUP]),
    controller.deleteUser
  );

  return router;
}
