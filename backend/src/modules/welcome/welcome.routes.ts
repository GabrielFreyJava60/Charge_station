import { Router, type Request, type Response, type NextFunction } from 'express';
import { WelcomeService } from './welcome.service';

export function welcomeRouter(): Router {
    const router = Router();
    const service = new WelcomeService();

    router.get(
        '/welcome',
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const city = typeof req.query.city === 'string' ? req.query.city : undefined;
                const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;

                const {code, payload} = await service.list({ city, provider });

                res.status(code).json(payload);
            } catch (error) {
                next(error);
            }
        }
    );

    return router;
}