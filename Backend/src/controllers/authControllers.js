import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req, res) => {
    const { correo, password } = req.body;

    try {
        // 1. Buscar al usuario en la BD 
        const usuario = await prisma.usuarios.findUnique({
            where: { correo: correo }
        });

        if (!usuario) {
            return res.status(401).json({ error: "El correo no está registrado" });
        }

        // 2. Comparar contraseña enviada con el Hash de la BD
        const esValida = await bcrypt.compare(password, usuario.password);
        
        if (!esValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // 3. Si todo es correcto, generar Token JWT (Seguridad)
        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol },
            process.env.JWT_SECRET || 'clave_secreta_gestock', // Clave en tu .env
            { expiresIn: '8h' } // La sesión dura 8 horas
        );

        // 4. Responder al cliente
        res.json({
            mensaje: "¡Bienvenido a Gestock!",
            token: token,
            usuario: {
                nombre: usuario.nombre_usuario,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Hubo un problema en el servidor" });
    }
};
