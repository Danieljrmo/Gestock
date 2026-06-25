import express from 'express';
import * as ventaController from '../controllers/ventaControllers.js';
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, ventaController.registrarVenta);

export default router;