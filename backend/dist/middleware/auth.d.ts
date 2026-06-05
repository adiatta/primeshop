import { Request, RequestHandler } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email?: string;
    };
}
export declare const authenticate: RequestHandler;
export declare const isAdmin: RequestHandler;
//# sourceMappingURL=auth.d.ts.map