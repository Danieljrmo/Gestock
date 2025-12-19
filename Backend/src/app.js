import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Necesario para leer el JSON de Postman

// Rutas de las Épicas
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriaRoutes);

export default app; // Exportamos la configuración