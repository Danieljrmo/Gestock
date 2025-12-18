import app from "./app.js";
import dotenv from "dotenv";

dotenv.config(); // Cargar variables de entorno (.env)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor Gestock corriendo en: http://localhost:${PORT}`);
    console.log(`🔐 Autenticación lista`);
});
