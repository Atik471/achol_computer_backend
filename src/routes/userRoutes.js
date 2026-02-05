import express from 'express';
import { getUsers, updateUserRole } from '../controllers/userController.js';
import { adminProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(adminProtect, getUsers);

router.route('/:id/role')
    .put(adminProtect, updateUserRole);

export default router;
