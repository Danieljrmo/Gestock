import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Crear una nueva categoría
export const crearCategoria = async (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    try {
        const nueva = await prisma.categorias.create({
            data: { nombre_categoria, descripcion }
        });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ error: "Error al crear la categoría" });
    }
};

// Listar todas las categorías (útil para el catálogo del frontend)
export const obtenerCategorias = async (req, res) => {
    try {
        const lista = await prisma.categorias.findMany();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
};

// ELIMINAR CATEGORÍA CON DESVINCULACIÓN DE PRODUCTOS
export const eliminarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const idCat = parseInt(id);

        await prisma.$transaction(async (tx) => {
            // 1. Desvincular productos dejándolos en id_categoria = null
            await tx.productos.updateMany({
                where: { id_categoria: idCat },
                data: { id_categoria: null }
            });

            // 2. Eliminar la categoría
            await tx.categorias.delete({
                where: { id_categoria: idCat }
            });
        });

        res.json({ mensaje: "Categoría eliminada con éxito y productos desvinculados." });
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        res.status(500).json({ error: "No se pudo eliminar la categoría." });
    }
};