import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// Store OIDC state and code verifier temporarily (in production, use Redis or signed cookies)
const oidcStates = new Map<
  string,
  { state: string; codeVerifier: string; timestamp: number }
>();

// Clean expired states every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of oidcStates.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) {
        // 10 minutes
        oidcStates.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * GET /api/auth/oidc/login
 * Redirect to OIDC provider for authentication
 */
router.get("/auth/oidc/login", async (_req: Request, res: Response) => {
  try {
    const issuerUrl = process.env.OIDC_ISSUER;
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const redirectUri = process.env.OIDC_REDIRECT_URI;

    if (!issuerUrl || !clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        error: true,
        message: "OIDC configuration is incomplete",
      });
    }

    // Dynamic import for ESM module
    const oidc = await import("openid-client");

    // Discover OIDC provider configuration
    // Pass allowInsecureRequests in options for HTTP development
    const config = await oidc.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret,
      undefined,
      { execute: [oidc.allowInsecureRequests] },
    );

    // Generate state and PKCE code verifier for security
    const state = oidc.randomState();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    oidcStates.set(state, { state, codeVerifier, timestamp: Date.now() });

    // Build authorization URL
    const authUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(authUrl.href);
  } catch (error) {
    console.error("OIDC login error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to initiate OIDC login",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/auth/oidc/callback
 * Handle OIDC callback and issue JWT token
 */
router.get("/auth/oidc/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        error: true,
        message: "Missing code or state parameter",
      });
    }

    // Validate state (CSRF protection)
    const stateData = oidcStates.get(state as string);
    if (!stateData) {
      return res.status(403).json({
        error: true,
        message: "Invalid state parameter",
      });
    }
    oidcStates.delete(state as string);

    const issuerUrl = process.env.OIDC_ISSUER;
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const redirectUri = process.env.OIDC_REDIRECT_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!issuerUrl || !clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        error: true,
        message: "OIDC configuration is incomplete",
      });
    }

    if (!jwtSecret) {
      return res.status(500).json({
        error: true,
        message: "JWT secret is missing",
      });
    }

    // Dynamic import for ESM module
    const oidc = await import("openid-client");

    // Discover OIDC provider configuration
    // Pass allowInsecureRequests in options for HTTP development
    const config = await oidc.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret,
      undefined,
      { execute: [oidc.allowInsecureRequests] },
    );

    // Exchange code for tokens
    const currentUrl = new URL(req.url, `http://${req.headers.host}`);
    const callbackUrl = new URL(redirectUri);
    callbackUrl.search = currentUrl.search;

    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: stateData.codeVerifier,
      expectedState: state as string,
    });

    // Decode ID token to get claims
    if (!tokens.id_token) {
      return res.status(500).json({
        error: true,
        message: "No ID token received from provider",
      });
    }

    const claims = jwt.decode(tokens.id_token) as {
      sub: string;
      email?: string;
      name?: string;
    };

    // Generate Tidarr JWT
    const tidarrToken = jwt.sign(
      {
        oidcSub: claims.sub,
        email: claims.email,
        name: claims.name,
      },
      jwtSecret,
      { expiresIn: "12h" },
    );

    // Redirect to frontend with token
    const frontendUrl =
      process.env.ENVIRONMENT === "development"
        ? "http://localhost:3000"
        : `http://${req.headers.host}`;
    res.redirect(`${frontendUrl}/?token=${tidarrToken}`);
  } catch (error) {
    console.error("OIDC callback error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to process OIDC callback",
    });
  }
});

export default router;
