require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("./config/passport");
const { cleanExpiredTokens } = require("./utils/jwt");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
});

app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((error, req, res, next) => {
    console.error("Global error handler", error);

    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            message: "File size is too large. Maximum size is 5MB"
        })
    }

    if (error.message === "Only image files are allowed") {
        return res.status(400).json({
            success: false,
            message: "Only image files are allowed"
        })
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message
    })
})

app.use("/{*any}", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

setInterval(() => {
    cleanExpiredTokens().catch(console.error)
}, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`)
})

process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    process.exit(0);
})

process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    process.exit(0);
})