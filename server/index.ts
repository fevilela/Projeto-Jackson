import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startNotificationCron } from "./cron";

const app = express();

// Trust proxy - necessário para Render e outros serviços de hospedagem
// Isso permite que o Express detecte corretamente HTTPS por trás de um proxy
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const MemStore = MemoryStore(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Mudei de volta para "lax" que funciona melhor
      // Não definir domain para permitir que funcione no domínio atual
    },
  })
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: false }));

// Debug middleware to log cookies
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[COOKIE DEBUG] ${req.method} ${req.path}`);
    console.log("[COOKIE DEBUG] Cookies:", req.headers.cookie);
    console.log("[COOKIE DEBUG] Session ID:", req.sessionID);
    console.log(
      "[COOKIE DEBUG] User-Agent:",
      req.headers["user-agent"]?.substring(0, 50)
    );
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message}`);

    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "Dados inválidos",
        details: err.errors,
      });
    }

    res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5002 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const requestedPort = parseInt(process.env.PORT || "5002", 10);
  const host = process.env.HOST || (process.platform === "win32" ? "127.0.0.1" : "0.0.0.0");
  const maxPortAttempts = 10;

  const tryListen = (attempt = 0) => {
    const port = requestedPort + attempt;
    const listenOptions: { port: number; host: string; reusePort?: boolean } = {
      port,
      host,
    };

    if (process.platform !== "win32") {
      listenOptions.reusePort = true;
    }

    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && attempt < maxPortAttempts - 1) {
        log(`Port ${port} is busy, trying ${port + 1}...`);
        tryListen(attempt + 1);
        return;
      }

      log(`Failed to listen on ${host}:${port}: ${error.message}`);
      process.exit(1);
    };

    server.once("error", onError);
    server.listen(listenOptions, () => {
      log(`serving on http://${host}:${port}`);
    });
  };

  tryListen();
  startNotificationCron();
})();
