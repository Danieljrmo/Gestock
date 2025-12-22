import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const crearProducto = async (req, res) => {
    const { 
        nombre_producto, 
        codigo_barra, 
        precio_compra, 
        precio_venta, 
        stock_actual, 
        stock_minimo, 
        id_categoria 
    } = req.body;

    try {
        const nuevoProducto = await prisma.productos.create({
            data: {
                nombre_producto,
                codigo_barra,
                precio_compra: parseFloat(precio_compra),
                precio_venta: parseFloat(precio_venta),
                stock_actual: parseInt(stock_actual),
                stock_minimo: parseInt(stock_minimo),
                id_categoria: parseInt(id_categoria)
            }
        });
        res.status(201).json({
            mensaje: "Producto registrado exitosamente",
            producto: nuevoProducto
        });
    } catch (error) {
        console.error("Error al registrar producto:", error);
        res.status(500).json({ error: "No se pudo registrar el producto. Verifica que el id_categoria exista." });
    }
};

// Obtener todos los productos con su categoría
export const obtenerProductos = async (req, res) => {
    try {
        const productos = await prisma.productos.findMany({
            include: {
                categorias: true // Esto incluye toda la información de la tabla categorías vinculada
            }
        });

        // Opcional: Podemos añadir una "etiqueta" de estado de stock en la respuesta
        const productosConEstado = productos.map(p => ({
            ...p,
            estado_stock: p.stock_actual <= p.stock_minimo ? "ALERTA: Reabastecer" : "Normal"
        }));

        res.json(productosConEstado);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "No se pudo obtener la lista de productos" });
    }
};

// Buscar productos por nombre o código de barra
export const buscarProducto = async (req, res) => {
    const { criterio } = req.query; // Recibimos lo que el usuario escribe

    try {
        const resultados = await prisma.productos.findMany({
            where: {
                OR: [
                    { nombre_producto: { contains: criterio, mode: 'insensitive' } },
                    { codigo_barra: { contains: criterio } }
                ]
            },
            include: { categorias: true }
        });
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: "Error en la búsqueda" });
    }
};