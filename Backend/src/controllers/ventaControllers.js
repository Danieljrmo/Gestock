import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const registrarVenta = async (req, res) => {
    const { id_producto, cantidad, precio_unitario, id_usuario } = req.body;

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Verificar stock actual del producto
            const producto = await tx.productos.findUnique({
                where: { id_producto: parseInt(id_producto) }
            });

            if (!producto || producto.stock_actual < cantidad) {
                throw new Error("Stock insuficiente");
            }

            // 2. Crear la VENTA (Maestro)
            const nuevaVenta = await tx.ventas.create({
                data: {
                    id_usuario: parseInt(id_usuario),
                    total: parseFloat(precio_unitario * cantidad),
                    metodo_pago: "Efectivo", // Valor por defecto
                    estado: "completada"
                }
            });

            // 3. Crear el DETALLE_VENTA (Vinculación con el producto)
            await tx.detalle_venta.create({
                data: {
                    id_venta: nuevaVenta.id_venta,
                    id_producto: parseInt(id_producto),
                    cantidad: parseInt(cantidad),
                    precio_unitario: parseFloat(precio_unitario),
                }
            });

            // 4. Actualizar el STOCK
            const productoActualizado = await tx.productos.update({
                where: { id_producto: parseInt(id_producto) },
                data: { stock_actual: producto.stock_actual - parseInt(cantidad) }
            });

            return { nuevaVenta, productoActualizado };
        });

        res.status(201).json({ mensaje: "Venta procesada con éxito", detalles: resultado });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};