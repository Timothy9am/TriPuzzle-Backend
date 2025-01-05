import express from "express";
import passport from "passport";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import "./src/configs/passport.js";
import { expressjwt } from "express-jwt";
import { ZodError } from "zod";
import { router as schedulesRouter } from "./src/routes/schedules.js";
import { router as usersRouter } from "./src/routes/users.js";
import { router as profileRouter } from "./src/routes/profile.js";
import { router as placesRouter } from "./src/routes/placesRouter.js";
import { router as favoritesRouter } from "./src/routes/favorites.js";
import { router as schedulePlaceRouter } from "./src/routes/schedulePlaces.js";
import { router as usersSchedulesRouter } from "./src/routes/usersSchedules.js";
import { router as uploadRouter } from "./src/routes/upload.js";
import { router as paymentRouter } from "./src/routes/payment.js";
import { config } from "./config.js";

const app = express();
dotenv.config();
const HOST_URL = process.env.HOST_URL || "http://localhost:5173";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  cors({
    origin: HOST_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: false }));
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/users", usersRouter);
app.use("/users", profileRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/payment", paymentRouter);
app.use("/usersSchedules", usersSchedulesRouter);
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  cors({
    origin: HOST_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: false }));
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/users", usersRouter);
app.use("/users", profileRouter);
app.use("/api/upload", uploadRouter);
app.use("/places", placesRouter);
app.use("/schedules", schedulesRouter);
app.use("/favorites", favoritesRouter);
app.use("/schedulePlaces", schedulePlaceRouter);
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

console.log("JWT Secret Key:", config.jwtSecretKey);

// 統一處理 res.error 錯誤處理函數
app.use((req, res, next) => {
  res.errmessage = function (err, status = 400) {
    res.send({
      status,
      message: err instanceof Error ? err.message : err,
    });
  };
  next();
});

// 路由之前配置解析 Token 的中間件
app.use(
  // authenticator,
  expressjwt({ secret: config.jwtSecretKey, algorithms: ["HS256"] }).unless({
    path: [/^\/api/, /^\/users/, /^\/places/], // 不需要驗證的路徑
  })
);

// 全局錯誤處理中間件
app.use((err, req, res, next) => {
  // Zod 驗證錯誤處理
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => e.message).join(", ");
    return res.status(400).json({
      status: 400,
      message: `Validation error: ${errors}`,
    });
  }

  // JWT 身分認證錯誤處理
  if (err.name === "UnauthorizedError") {
    const message =
      err.message === "jwt expired"
        ? "Token 已過期，請重新登入"
        : `Authentication failed: ${err.message}`;
    return res.status(401).json({
      status: 401,
      message,
    });
  }

  // 未知錯誤
  res.status(404).json({
    status: 404,
    message: err instanceof Error ? err.message : String(err),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
