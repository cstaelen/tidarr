import { Request, Response, Router } from "express";

import { validateRequestBody } from "../helpers/validation";
import { get_auth_type, is_auth_active, proceed_auth } from "../services/auth";
import { AuthResponse, IsAuthActiveResponse } from "../types";

const router = Router();

/**
 * POST /api/auth
 * Authenticate with password and get JWT token
 *
 * @openapi
 * /api/auth:
 *   post:
 *     operationId: authenticate
 *     summary: Login with password to get a JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing password field
 *       403:
 *         description: Wrong password
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
 *
 * @openapi
 * /api/is-auth-active:
 *   get:
 *     operationId: getAuthStatus
 *     summary: Check if authentication is enabled and get auth type
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Auth status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IsAuthActiveResponse'
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
