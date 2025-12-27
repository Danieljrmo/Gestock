import express from 'express';
import * as ventaController from '../controllers/ventaControllers.js';

const router = express.Router();

router.post('/', ventaController.registrarVenta);

export default router;