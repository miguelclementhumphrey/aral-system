import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import "./lib/env";
import router from "./routes";
import { logger } from "./lib/logger";
import { createRateLimiter, securityHeaders } from "./lib/security";

const app: Express = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 25 });
const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600 });

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use("/api/auth/admin/login", authRateLimiter);
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/set-password", authRateLimiter);
app.use("/api", apiRateLimiter);
app.use("/api", router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.warn({ err }, "Request rejected");
  res.status(400).json({ error: "Bad request" });
});

export default app;
