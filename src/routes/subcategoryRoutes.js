import express from 'express';
import { getSubcategories } from '../controllers/subcategoryController.js';

const router = express.Router();

router.route('/').get(getSubcategories);

export default router;