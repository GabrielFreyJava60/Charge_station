import type { Request, Response } from 'express';
import { z } from 'zod';
import { createLogger } from '../../utils/logger';
import { wrapResponse } from '../../common/wrappers';
import type { UsersService } from './users.service';

const logger = createLogger('users.controller');

const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  address: z.string().min(1).optional()
});

const updateRoleSchema = z.object({
  role: z.string().min(1)
});

export class UsersController {
  constructor(private readonly service: UsersService) {}

  getMe = async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
    }

    const userId = req.user.sub;
    const userInfo = await this.service.getMyInfo(userId);

    res.status(200).json(wrapResponse(userInfo));
  };

  updateMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ code: 401, error: { message: 'Unauthorized' } });
    }

    const payload = updateProfileSchema.parse(req.body);
    await this.service.updateOwnProfile(userId, payload);
    res.json({ code: 200, data: { userId, ...payload } });
  };

  updateUserProfileAsAdmin = async (req: Request, res: Response) => {
    const adminId = req.user?.sub;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ code: 401, error: { message: 'Unauthorized' } });
    }

    const payload = updateProfileSchema.parse(req.body);
    await this.service.updateUserProfileAsAdmin(adminId, userId, payload);
    res.json({ code: 200, data: { userId, ...payload } });
  };

  updateUserRole = async (req: Request, res: Response) => {
    const adminId = req.user?.sub;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ code: 401, error: { message: 'Unauthorized' } });
    }

    const { role } = updateRoleSchema.parse(req.body);
    await this.service.updateUserRole(adminId, userId, role);
    res.json({ code: 200, data: { userId, role } });
  };

  deleteUser = async (req: Request, res: Response) => {
    const adminId = req.user?.sub;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ code: 401, error: { message: 'Unauthorized' } });
    }

    // Не даём админу удалить себя случайно
    if (adminId === userId) {
      logger.error('Admin attempted to delete own account', { adminId });
      return res.status(403).json({ code: 403, error: { message: 'Cannot delete own admin account' } });
    }

    await this.service.deleteUser(adminId, userId);
    res.json({ code: 200, data: { userId, deleted: true } });
  };
}
