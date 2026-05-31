import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET: Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    // Consultamos directo a la tabla usuarios
    const listaUsuarios = await prisma.usuarios.findMany();

    // Mapeamos de forma segura validando que los campos existan
    const usuariosFormateados = listaUsuarios.map(u => ({
      id: u.id_usuario,
      nombre: u.nombre_usuario || "Usuario sin nombre",
      correo: u.correo,
      rol: u.rol || "CAJERO"
    }));

    res.json(usuariosFormateados);
  } catch (error) {
    // ESTO ES CLAVE: Nos pintará en la terminal del backend el error exacto de PostgreSQL o Prisma
    console.error("ERROR REAL EN GET_USUARIOS:", error); 
    res.status(500).json({ mensaje: "Error interno del servidor al obtener usuarios" });
  }
};

// POST: Registrar un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: "Nombre, correo y contraseña son obligatorios" });
    }
    
    const existeUsuario = await prisma.usuarios.findUnique({
      where: { correo }
    });

    if (existeUsuario) {
      return res.status(400).json({ mensaje: "El correo electrónico ya está registrado" });
    }
    //  LA SOLUCIÓN: Encriptamos la contraseña con 10 rondas de salt antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre_usuario: nombre,
        correo: correo,
        password: passwordEncriptada, // <-- Guardamos el Hash seguro en PostgreSQL
        rol: rol || "CAJERO"
      }
    });

    res.status(201).json({ mensaje: "Usuario creado exitosamente", id: nuevoUsuario.id_usuario });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al crear el usuario" });
  }
};

// DELETE: Eliminar físicamente un usuario por su ID
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Convertimos el id a entero porque en tu schema.prisma es un Int autoincremental
    const idInt = parseInt(id);

    // Verificamos si el usuario existe antes de borrar
    const usuarioExiste = await prisma.usuarios.findUnique({
      where: { id_usuario: idInt }
    });

    if (!usuarioExiste) {
      return res.status(404).json({ mensaje: "El usuario no existe" });
    }

    // Ejecutamos el delete real en la tabla
    await prisma.usuarios.delete({
      where: { id_usuario: idInt }
    });

    res.json({ mensaje: "Usuario eliminado correctamente de la base de datos" });
  } catch (error) {
    console.error("🚨 ERROR DENTRO DE DELETE_USUARIO:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al eliminar el usuario" });
  }
};

// PUT: Actualizar los datos de un usuario por su ID
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, password, rol } = req.body;
    const idInt = parseInt(id);

    // 1. Verificar si el usuario existe
    const usuarioExiste = await prisma.usuarios.findUnique({
      where: { id_usuario: idInt }
    });

    if (!usuarioExiste) {
      return res.status(404).json({ mensaje: "El usuario no existe" });
    }

    // 2. Si intenta cambiar el correo, verificar que no esté duplicado con otro usuario
    if (correo && correo !== usuarioExiste.correo) {
      const correoDuplicado = await prisma.usuarios.findUnique({
        where: { correo }
      });
      if (correoDuplicado) {
        return res.status(400).json({ mensaje: "El correo electrónico ya está en uso por otro usuario" });
      }
    }

    // 3. Preparar los datos para actualizar de acuerdo a tu schema.prisma
    const datosActualizados = {
      nombre_usuario: nombre || usuarioExiste.nombre_usuario,
      correo: correo || usuarioExiste.correo,
      rol: rol || usuarioExiste.rol
    };

   // Si viene una contraseña nueva y no está vacía, la encriptamos de forma segura antes de actualizar
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
    }

    // 4. Ejecutar la actualización en PostgreSQL
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id_usuario: idInt },
      data: datosActualizados
    });

    res.json({ 
      mensaje: "Usuario actualizado exitosamente", 
      id: usuarioActualizado.id_usuario 
    });

  } catch (error) {
    console.error("🚨 ERROR DENTRO DE UPDATE_USUARIO:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al actualizar el usuario" });
  }
};