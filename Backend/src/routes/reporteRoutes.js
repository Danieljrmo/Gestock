import express from 'express';
import * as reporteController from '../controllers/reporteControllers.js';

const router = express.Router();

router.get('/diario', reporteController.ventasDelDia);
router.get('/stock-bajo', reporteController.stockBajo);

export default router;
