import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getMe,
    refreshAccessToken
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', protect, logoutUser);
router.post('/forgotpassword', protect, forgotPassword);
router.put('/resetpassword/:resettoken', protect, resetPassword);
router.get('/me', protect, getMe);
router.get("/refresh", refreshAccessToken);

export default router;