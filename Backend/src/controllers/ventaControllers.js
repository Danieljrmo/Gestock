import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const registrarVenta = async (req, res) => {
    // Recibimos el arreglo de productos desde el frente y el método de pago elegido
    const { detalles, metodo_pago } = req.body;
    
    // Capturamos automáticamente el ID del usuario desde el token (inyectado por el middleware)
    const id_usuario = req.user?.id_usuario;

    // Validación de entrada para evitar carritos vacíos o bugs
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: "El carrito de ventas está vacío o tiene un formato incorrecto." });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            let totalBoleta = 0;
            const lineasDetalle = [];

            // 1. Iteramos sobre cada producto que viene en el carrito
            for (const item of detalles) {
                const producto = await tx.productos.findUnique({
                    where: { id_producto: parseInt(item.id_producto) }
                });

                if (!producto) {
                    throw new Error(`El producto con ID ${item.id_producto} no existe.`);
                }

                if (producto.stock_actual < parseInt(item.cantidad)) {
                    throw new Error(`Stock insuficiente para '${producto.nombre_producto}'. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`);
                }

                const precioUnitario = parseFloat(producto.precio_venta);
                const subtotal = parseInt(item.cantidad) * precioUnitario;
                totalBoleta += subtotal;

                // Guardamos los datos formateados para la inserción masiva
                lineasDetalle.push({
                    id_producto: producto.id_producto,
                    cantidad: parseInt(item.cantidad),
                    precio_unitario: precioUnitario,
                    subtotal: subtotal
                });

                // 2. Actualizamos el stock de este producto usando decrement nativo (más eficiente)
                await tx.productos.update({
                    where: { id_producto: producto.id_producto },
                    data: { 
                        stock_actual: {
                            decrement: parseInt(item.cantidad)
                        } 
                    }
                });
            }

            // 3. Crear la VENTA (Maestro) con el total acumulado de todos los productos
            const nuevaVenta = await tx.ventas.create({
                data: {
                    id_usuario: id_usuario ? parseInt(id_usuario) : null,
                    total: totalBoleta,
                    metodo_pago: metodo_pago || "Efectivo",
                    estado: "completada",
                    // 4. Creamos todos los registros en DETALLE_VENTA en cascada de una sola pasada
                    detalle_venta: {
                        create: lineasDetalle.map(d => ({
                            id_producto: d.id_producto,
                            cantidad: d.cantidad,
                            precio_unitario: d.precio_unitario,
                            subtotal: d.subtotal
                        }))
                    }
                },
                include: {
                    detalle_venta: true // Incluimos el array de detalles creados en la respuesta
                }
            });

            return nuevaVenta;
        });

        res.status(201).json({ mensaje: "Venta procesada con éxito", detalles: resultado });

    } catch (error) {
        console.error("Error al procesar la venta:", error.message);
        res.status(400).json({ error: error.message });
    }
};