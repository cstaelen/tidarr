import { Request, Response, Router } from "express";

import { validateRequestBody } from "../helpers/validation";
import { get_auth_type, is_auth_active, proceed_auth } from "../services/auth";
import { AuthResponse, IsAuthActiveResponse } from "../types";

const router = Router();

/**
 * POST /api/auth
 * Authenticate with password and get JWT token
 */
router.post(
  "/auth",
  validateRequestBody(["password"]),
  async (req: Request, res: Response<AuthResponse>) => {
    await proceed_auth(req.body.password, res);
  },
);

/**
 * GET /api/is-auth-active
 * Check if authentication is enabled and get auth type
 */
router.get(
  "/is-auth-active",
  (_req: Request, res: Response<IsAuthActiveResponse>) => {
    res.status(200).json({
      isAuthActive: is_auth_active(),
      authType: get_auth_type(),
    });
  },
);

export default router;
