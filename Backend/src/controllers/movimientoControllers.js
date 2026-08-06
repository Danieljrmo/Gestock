import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// REGISTRAR UN NUEVO MOVIMIENTO (ENTRADA O SALIDA)
export const registrarMovimiento = async (req, res) => {
    const { 
        id_producto, 
        tipo_movimiento, // 'Entrada' o 'Salida'
        cantidad, 
        motivo, 
        id_proveedor 
    } = req.body;
    
    const id_usuario = req.user?.id_usuario; 

    if (!id_producto || !tipo_movimiento || !cantidad) {
        return res.status(400).json({ mensaje: "Faltan campos obligatorios (producto, tipo, cantidad)." });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            
            // 1. Verificar si el producto existe y capturar su stock actual
            const producto = await tx.productos.findUnique({
                where: { id_producto: parseInt(id_producto) }
            });

            if (!producto) {
                throw new Error("El producto especificado no existe.");
            }

            // 2. Calcular el nuevo stock convirtiendo la cantidad a número decimal
            let nuevoStock = parseFloat(producto.stock_actual || 0);
            const cantidadNum = parseFloat(cantidad);

            if (tipo_movimiento.toLowerCase() === 'entrada') {
                nuevoStock += cantidadNum;
            } else if (tipo_movimiento.toLowerCase() === 'salida') {
                if (nuevoStock < cantidadNum) {
                    throw new Error(`Stock insuficiente para realizar la salida. Stock actual: ${nuevoStock}`);
                }
                nuevoStock -= cantidadNum;
            } else {
                throw new Error("Tipo de movimiento inválido. Debe ser 'Entrada' o 'Salida'.");
            }

            // 3. Crear el registro del movimiento de inventario
            const nuevoMovimiento = await tx.movimientos_inventario.create({
                data: {
                    id_producto: parseInt(id_producto),
                    tipo_movimiento,
                    cantidad: cantidadNum,
                    motivo,
                    id_usuario: id_usuario ? parseInt(id_usuario) : null,
                    id_proveedor: id_proveedor ? parseInt(id_proveedor) : null
                }
            });

            // 4. Actualizar el stock real en la tabla de productos
            const productoActualizado = await tx.productos.update({
                where: { id_producto: parseInt(id_producto) },
                data: { stock_actual: nuevoStock }
            });

            return { nuevoMovimiento, stock_final: productoActualizado.stock_actual };
        });

        res.status(201).json({
            mensaje: "Movimiento de inventario registrado y stock actualizado con éxito.",
            datos: resultado
        });

    } catch (error) {
        console.error("Error en la transacción de movimiento:", error.message);
        res.status(400).json({ mensaje: error.message || "Error interno al procesar el movimiento." });
    }
};

// OBTENER EL HISTORIAL GENERAL DE MOVIMIENTOS
export const obtenerHistorialMovimientos = async (req, res) => {
    try {
        const historial = await prisma.movimientos_inventario.findMany({
            include: {
                productos: {
                    select: { nombre_producto: true, codigo_barra: true }
                },
                proveedores: {
                    select: { nombre: true }
                },
                usuarios: {
                    select: { nombre_usuario: true }
                }
            },
            orderBy: {
                fecha_movimiento: 'desc'
            }
        });

        res.json(historial);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "No se pudo cargar el historial de movimientos." });
    }
};