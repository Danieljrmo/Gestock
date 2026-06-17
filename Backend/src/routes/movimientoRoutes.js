import express from 'express';
import * as movimientoController from '../controllers/movimientoControllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Protegemos el historial y la creación con el token de sesión del usuario activo
router.post('/', verifyToken, movimientoController.registrarMovimiento);
router.get('/', verifyToken, movimientoController.obtenerHistorialMovimientos);

export default router;