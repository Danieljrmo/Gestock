import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const registrarVenta = async (req, res) => {
  const { detalles, metodo_pago } = req.body;
  
  // Soporte tanto para req.usuario como para req.user (id_usuario o id)
  const usuarioAuth = req.usuario || req.user;
  const id_usuario = usuarioAuth?.id_usuario || usuarioAuth?.id || null;

  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: "El carrito de ventas está vacío o tiene un formato incorrecto." });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      let totalBoleta = 0;
      const lineasDetalle = [];

      for (const item of detalles) {
        const producto = await tx.productos.findUnique({
          where: { id_producto: parseInt(item.id_producto) }
        });

        if (!producto) {
          throw new Error(`El producto con ID ${item.id_producto} no existe.`);
        }

        const cantidadSolicitada = parseFloat(item.cantidad);
        const stockDisponible = parseFloat(producto.stock_actual || 0);

        if (stockDisponible < cantidadSolicitada) {
          throw new Error(`Stock insuficiente para '${producto.nombre_producto}'. Disponible: ${stockDisponible}, Solicitado: ${cantidadSolicitada}`);
        }

        const precioUnitario = parseFloat(producto.precio_venta);
        const subtotal = Math.round(cantidadSolicitada * precioUnitario);
        totalBoleta += subtotal;

        lineasDetalle.push({
          id_producto: producto.id_producto,
          cantidad: cantidadSolicitada,
          precio_unitario: precioUnitario,
          subtotal: subtotal
        });

        await tx.productos.update({
          where: { id_producto: producto.id_producto },
          data: { 
            stock_actual: {
              decrement: cantidadSolicitada
            } 
          }
        });
      }

      const nuevaVenta = await tx.ventas.create({
        data: {
          id_usuario: id_usuario ? parseInt(id_usuario) : null,
          total: totalBoleta,
          metodo_pago: metodo_pago || "Efectivo",
          estado: "completada",
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
          detalle_venta: true
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