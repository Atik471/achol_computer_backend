import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// 1. Protect routes - JWT verification
export const protect = async (req, res, next) => {
  let token;

  // Get token from:
  // - HTTP-only cookie (recommended for production)
  // - Authorization header (Bearer token)
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized', 401));
  }
};

// 2. Admin authorization middleware
export const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Admin privileges required', 403)
    );
  }
  next();
};

// 3. Combined protect + admin middleware (for admin-only routes)
export const adminProtect = [protect, admin];