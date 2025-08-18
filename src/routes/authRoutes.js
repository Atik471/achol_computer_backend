import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;