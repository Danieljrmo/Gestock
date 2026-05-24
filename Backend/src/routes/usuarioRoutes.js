import express from "express";
import { getUsuarios, createUsuario } from "../controllers/usuarioControllers.js";

const router = express.Router();

// Esta ruta responderá a /api/usuarios/
router.get("/", getUsuarios);
router.post("/", createUsuario);

export default router;