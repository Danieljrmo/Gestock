import express from 'express';
import * as authController from "../controllers/authControllers.js";

const router = express.Router();

// Definir la ruta de login
router.post('/login', authController.login);

export default router;
