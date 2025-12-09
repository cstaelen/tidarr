import { Router } from "express";
import { pipeline } from "stream";
import { promisify } from "util";

import { get_tiddl_config } from "../helpers/get_tiddl_config";
import { signUrl } from "../helpers/signature";
import { getPlaybackInfo } from "../services/playback";

const streamPipeline = promisify(pipeline);
const router = Router();

// Endpoint firm URL
router.get("/stream/sign/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const expires = Math.floor(Date.now() / 1000) + 300;
  const sig = signUrl(id, expires);

  const url = `http://localhost:8484/api/stream/play/${id}?exp=${expires}&sig=${sig}`;

  res.json({ url });
});

// Endpoint play
router.get("/stream/play/:id", async (req, res) => {
  const { id } = req.params;
  const { exp, sig } = req.query as { exp?: string; sig?: string };

  if (!exp || !sig) {
    return res.status(403).json({ error: "Missing signature" });
  }

  const expires = parseInt(exp, 10);
  if (Date.now() / 1000 > expires) {
    return res.status(403).json({ error: "URL expired" });
  }

  const expected = signUrl(id, expires);
  if (sig !== expected) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    const tiddlConfig = req.app.locals.tiddlConfig || get_tiddl_config();
    const token = tiddlConfig?.auth?.token;
    const country = tiddlConfig?.auth?.country_code || "EN";

    if (!token) {
      return res.status(400).json({ error: "No proxy token available" });
    }

    const qualities = ["LOSSLESS", "HIGH", "LOW"];
    let chosenUrl: string | null = null;

    for (const q of qualities) {
      const urls = await getPlaybackInfo(id, q, token, country);
      if (urls && urls.length > 0) {
        chosenUrl = urls[0];
        break;
      }
    }

    if (!chosenUrl) {
      return res.status(502).json({ error: "No playable quality available" });
    }

    const range = req.headers["range"];
    const upstream = await fetch(chosenUrl, {
      headers: range ? { Range: range as string } : {},
    });

    if (!upstream.ok || !upstream.body) {
      return res
        .status(upstream.status)
        .json({ error: "Upstream fetch failed" });
    }

    res.status(upstream.status);
    const hopHeaders = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "cache-control",
      "expires",
      "last-modified",
      "etag",
    ];
    hopHeaders.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    await streamPipeline(upstream.body, res);
  } catch (err) {
    // Ignore premature close errors (client stopped playback)
    const error = err as Error & { code?: string };
    if (error.code === "ERR_STREAM_PREMATURE_CLOSE") {
      // Client disconnected, this is normal when user stops playback
      return;
    }

    console.error("Error in /api/stream/play:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
});

export default router;
