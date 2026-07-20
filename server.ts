// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// --- AI proxy hardening ---
// Only these models may be requested through the proxy.
const ALLOWED_MODELS = new Set(["gemini-2.5-flash"]);
// Simple in-memory per-IP rate limit so the proxy cannot be trivially abused.
const RATE_LIMIT = 60;              // requests
const RATE_WINDOW_MS = 60 * 1000;   // per minute
const rateHits = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = rateHits.get(ip);
  if (!rec || now > rec.reset) {
    rateHits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "8mb" }));

  // Server-side Gemini proxy. Keeps GEMINI_API_KEY on the server so it is never
  // shipped to the browser. Mirrors GoogleGenAI.models.generateContent.
  app.post("/api/gemini", async (req: any, res: any) => {
    const fwd = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(fwd) ? fwd[0] : (fwd || req.socket?.remoteAddress || "unknown"))
      .toString().split(",")[0].trim();
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const { model, contents, config } = req.body || {};
    if (!model || !contents) {
      return res.status(400).json({ error: "Missing 'model' or 'contents'." });
    }
    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: "Unsupported model." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini proxy error:", error?.message || error);
      res.status(502).json({ error: error?.message || "Gemini request failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
