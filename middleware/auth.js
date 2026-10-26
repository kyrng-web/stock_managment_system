const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function protect(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required. Please log in.",
    });
  }

  const token = authorization.slice(7).trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "name email role"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Could not authenticate this request.",
    });
  }
}

module.exports = { protect };