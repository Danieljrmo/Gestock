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