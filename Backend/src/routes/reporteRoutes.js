import { Router } from 'express';
import { getVentasPorPeriodo, getRotacionProductos, getHistorialMovimientos } from '../controllers/reporteControllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/periodo', verifyToken, getVentasPorPeriodo);
router.get('/rotacion', verifyToken, getRotacionProductos);
router.get('/movimientos', verifyToken, getHistorialMovimientos);

export default router;
