import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res, next) => {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        return next(new ErrorResponse('Please provide a valid role (user or admin)', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    user.role = role;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});
