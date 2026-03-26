require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ================= DATABASE =================
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hirhub",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// ================= ROUTES =================
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const paymentRoutes = require("./routes/payment.routes");
const followRoutes = require("./routes/follow.routes");
const searchRoutes = require("./routes/search.routes");
const feedRoutes = require("./routes/feed.routes");

// JSON first
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/payment", paymentRoutes);

// Multer upload LAST (after JSON parsers to avoid body corruption)
app.use("/api/upload", uploadRoutes);

// ✅ POST-upload JSON parser fix for mixed requests
app.use(express.json({ verify: (req, res, buf) => {
  req.rawBody = buf;
}, limit: "50mb" }));

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Hirhub Backend Running",
  });
});

// ================= ERROR HANDLER =================
// Global error handler - Catch Mongoose & unhandled errors
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.name, err.message, err.stack);
  
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format' 
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
  
  if (err.name === 'MissingSchemaError') {
    return res.status(500).json({ 
      success: false, 
      message: 'Model not found - restart server' 
    });
  }

  
  // Generic server error
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// 404 handler for routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});