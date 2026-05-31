import express from "express";
import { getUsuarios, createUsuario, deleteUsuario, updateUsuario} from "../controllers/usuarioControllers.js";

const router = express.Router();

// Esta ruta responderá a /api/usuarios/
router.get("/", getUsuarios);
router.post("/", createUsuario);
router.delete("/:id", deleteUsuario);
router.put("/:id", updateUsuario); 

export default router;