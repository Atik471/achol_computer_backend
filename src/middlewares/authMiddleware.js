import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// Protect routes - JWT verification
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized, no access token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new ErrorResponse("User no longer exists", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ErrorResponse("Access token expired", 401));
    }
    return next(new ErrorResponse("Not authorized", 401));
  }
};


// Admin authorization middleware
export const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Admin privileges required', 403)
    );
  }
  next();
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role '${req.user.role}' is not authorized to access this resource`, 403)
      );
    }
    next();
  };
};

// Combined protect + admin middleware (for admin-only routes)
export const adminProtect = [protect, admin];