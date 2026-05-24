import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import reporteRoutes from "./routes/reporteRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Necesario para leer el JSON de Postman

// Rutas de las Épicas (Probadas con Postman)
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/reportes", reporteRoutes);
export default app; // Exportamos la configuración de Express para usarla en el servidor (index.js)