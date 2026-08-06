import express from 'express';
import * as categoriaController from '../controllers/categoriaControllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; // Opcional pero recomendado para seguridad

const router = express.Router();

// Ruta para crear categoría
router.post('/', verifyToken, categoriaController.crearCategoria);

// Ruta para obtener todas las categorías
router.get('/', categoriaController.obtenerCategorias);

// Ruta para eliminar categoría
router.delete('/:id', verifyToken, categoriaController.eliminarCategoria);

export default router;
