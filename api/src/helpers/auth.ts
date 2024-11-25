import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function ensureAccessIsGranted(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const jwtSecret = process.env?.JWT_SECRET;
  const authHeader = req?.headers?.["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const envPassword = process.env?.ADMIN_PASSWORD;

  if (!envPassword) return next();

  if (!jwtSecret) {
    res
      .status(403)
      .json({ error: true, message: "JWT secret key is missing." });
    return;
  }

  if (!token) {
    res.status(403).json({ error: true, message: "Token required" });
    return;
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: true, message: "JWT decode failed" });
      return;
    }

    if ((decoded as jwt.JwtPayload).tidarrPasswd !== envPassword) {
      res.status(403).json({ error: true, message: "Wrong password" });
      return;
    }

    return next();
  });
}
