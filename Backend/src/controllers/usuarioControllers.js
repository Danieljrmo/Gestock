import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        // Agrega aquí otros campos si existen en tu modelo, ej: estado: true
      },
    });
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al obtener usuarios" });
  }
};

// POST: Registrar un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    // Validación básica de campos
    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: "Nombre, correo y contraseña son obligatorios" });
    }

    // Verificar si el correo ya está registrado
    const existeUsuario = await prisma.usuarios.findUnique({
      where: { correo }
    });

    if (existeUsuario) {
      return res.status(400).json({ mensaje: "El correo electrónico ya está registrado" });
    }

    // Crear el usuario usando los nombres de tu schema.prisma
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre_usuario: nombre,
        correo: correo,
        password: password, // Nota: En el futuro le meteremos bcrypt para Hashear
        rol: rol || "CAJERO"
      }
    });

    res.status(201).json({ mensaje: "Usuario creado exitosamente", id: nuevoUsuario.id_usuario });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al crear el usuario" });
  }
};