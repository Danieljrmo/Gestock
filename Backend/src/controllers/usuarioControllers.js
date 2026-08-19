import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET: Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const listaUsuarios = await prisma.usuarios.findMany();

    const usuariosFormateados = listaUsuarios.map(u => ({
      id: u.id_usuario,
      nombre: u.nombre_usuario || "Usuario sin nombre",
      correo: u.correo,
      rol: u.rol || "CAJERO"
    }));

    res.json(usuariosFormateados);
  } catch (error) {
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

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre_usuario: nombre,
        correo: correo,
        password: passwordEncriptada,
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
    const idInt = parseInt(id);
    const idUsuarioSolicitante = req.usuario?.id_usuario || req.usuario?.id;

    // 1. REGLA: No permitir auto-eliminación
    if (idUsuarioSolicitante && idUsuarioSolicitante === idInt) {
      return res.status(400).json({ 
        mensaje: "Acción denegada: No puedes eliminar tu propia cuenta de usuario." 
      });
    }

    // 2. Verificar existencia del usuario
    const usuarioExiste = await prisma.usuarios.findUnique({
      where: { id_usuario: idInt }
    });

    if (!usuarioExiste) {
      return res.status(404).json({ mensaje: "El usuario no existe" });
    }

    // 3. REGLA: Proteger al último Administrador
    const rolNormalizado = usuarioExiste.rol?.toUpperCase() || "";
    if (rolNormalizado.startsWith("ADMIN")) {
      const cantidadAdmins = await prisma.usuarios.count({
        where: {
          OR: [
            { rol: { startsWith: "ADMIN" } },
            { rol: { startsWith: "admin" } }
          ]
        }
      });

      if (cantidadAdmins <= 1) {
        return res.status(400).json({ 
          mensaje: "Acción bloqueada: No puedes eliminar al único Administrador disponible en el sistema." 
        });
      }
    }

    // 4. Eliminar el registro
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

    const usuarioExiste = await prisma.usuarios.findUnique({
      where: { id_usuario: idInt }
    });

    if (!usuarioExiste) {
      return res.status(404).json({ mensaje: "El usuario no existe" });
    }

    if (correo && correo !== usuarioExiste.correo) {
      const correoDuplicado = await prisma.usuarios.findUnique({
        where: { correo }
      });
      if (correoDuplicado) {
        return res.status(400).json({ mensaje: "El correo electrónico ya está en uso por otro usuario" });
      }
    }

    const datosActualizados = {
      nombre_usuario: nombre || usuarioExiste.nombre_usuario,
      correo: correo || usuarioExiste.correo,
      rol: rol || usuarioExiste.rol
    };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
    }

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