import express from 'express';
import * as productoController from '../controllers/productoControllers.js';

const router = express.Router();

router.post('/', productoController.crearProducto); // Ruta para crear producto
router.get('/', productoController.obtenerProductos); // Ruta para obtener todos los productos
router.get('/buscar', productoController.buscarProducto); // Ruta para buscar productos

export default router;