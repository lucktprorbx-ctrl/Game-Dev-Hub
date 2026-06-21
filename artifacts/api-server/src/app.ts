import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://tr.rbxcdn.com", "https://thumbnails.roblox.com"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://apis.roblox.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// ── Logging ─────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://game-dev-hub--itsluckt.replit.app",
  "http://localhost:5000",
  "http://localhost:3000",
  ...(process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS policy"));
      }
    },
    credentials: true,
  }),
);

// ── Body parsing with size limits ───────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(cookieParser());

// ── Rate limiting ────────────────────────────────────────────────────────────
// Auth routes: stricter limit to prevent brute-force
app.use(
  "/api/auth/roblox",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again later." },
  }),
);

// General API limit
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
  }),
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isProd = process.env.NODE_ENV === "production";
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

export default app;
