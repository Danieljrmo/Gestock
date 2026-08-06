import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Registrar un nuevo producto
export const crearProducto = async (req, res) => {
    const { 
        nombre_producto, 
        codigo_barra, 
        precio_compra, 
        precio_venta, 
        stock_actual, 
        stock_minimo, 
        unidad_medida,
        id_categoria 
    } = req.body;

    try {
        const nuevoProducto = await prisma.productos.create({
            data: {
                nombre_producto,
                codigo_barra: codigo_barra || null,
                precio_compra: parseFloat(precio_compra),
                precio_venta: parseFloat(precio_venta),
                stock_actual: stock_actual !== undefined ? parseFloat(stock_actual) : 0,
                stock_minimo: stock_minimo !== undefined ? parseFloat(stock_minimo) : 0,
                unidad_medida: unidad_medida || 'UNIDAD',
                id_categoria: id_categoria ? parseInt(id_categoria) : null,
                estado: 'activo'
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
                categorias: true
            }
        });

        const productosConEstado = productos.map(p => {
            const stockActual = parseFloat(p.stock_actual || 0);
            const stockMinimo = parseFloat(p.stock_minimo || 0);
            return {
                ...p,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                estado_stock: stockActual <= stockMinimo ? "ALERTA: Reabastecer" : "Normal"
            };
        });

        res.json(productosConEstado);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "No se pudo obtener la lista de productos" });
    }
};

// Buscar productos por nombre o código de barra
export const buscarProducto = async (req, res) => {
    const { criterio } = req.query;

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

// Actualizar un producto existente (PUT)
export const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { 
        nombre_producto, 
        codigo_barra, 
        precio_compra, 
        precio_venta, 
        stock_actual, 
        stock_minimo, 
        unidad_medida,
        id_categoria 
    } = req.body;

    try {
        const productoActualizado = await prisma.productos.update({
            where: { id_producto: parseInt(id) },
            data: {
                nombre_producto,
                codigo_barra: codigo_barra || null,
                precio_compra: parseFloat(precio_compra),
                precio_venta: parseFloat(precio_venta),
                stock_actual: parseFloat(stock_actual),
                stock_minimo: parseFloat(stock_minimo),
                unidad_medida: unidad_medida || 'UNIDAD',
                id_categoria: id_categoria ? parseInt(id_categoria) : null
            }
        });

        res.json({
            mensaje: "Producto actualizado exitosamente",
            producto: productoActualizado
        });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ mensaje: "No se pudo actualizar el producto. Verifica los datos." });
    }
};

// Dar de baja / Eliminar (DELETE)
export const eliminarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const productoEliminado = await prisma.productos.delete({
            where: { id_producto: parseInt(id) }
        });

        res.json({
            mensaje: "Producto dado de baja exitosamente",
            producto: productoEliminado
        });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                mensaje: "No se puede eliminar físicamente este producto porque cuenta con registros asociados en el historial de ventas." 
            });
        }
        res.status(500).json({ mensaje: "No se pudo procesar la baja del producto." });
    }
};