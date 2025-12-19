import express from 'express';
import * as categoriaController from '../controllers/categoriaControllers.js';

const router = express.Router();

// Ruta para crear categoría
router.post('/', categoriaController.crearCategoria);

// Ruta para obtener todas las categorías
router.get('/', categoriaController.obtenerCategorias);

export default router;
