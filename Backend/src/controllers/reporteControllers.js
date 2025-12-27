import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const ventasDelDia = async (req, res) => {
    try {
        // Obtenemos el inicio y fin del día actual
        const hoy = new Date();
        const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
        const finDia = new Date(hoy.setHours(23, 59, 59, 999));

        const ventas = await prisma.ventas.findMany({
            where: {
                fecha_venta: {
                    gte: inicioDia,
                    lte: finDia
                }
            },
            include: {
                usuarios: { select: { nombre_usuario: true } }, // Quién vendió
                detalle_venta: {
                    include: { productos: { select: { nombre_producto: true } } } // Qué vendió
                }
            }
        });

        // Calculamos el total recaudado
        const totalRecaudado = ventas.reduce((acc, v) => acc + parseFloat(v.total), 0);

        res.json({
            fecha: new Date().toLocaleDateString(),
            cantidad_ventas: ventas.length,
            total_recaudado: totalRecaudado.toFixed(2),
            detalle: ventas
        });
    } catch (error) {
        res.status(500).json({ error: "Error al generar el reporte diario" });
    }
};

export const stockBajo = async (req, res) => {
    try {
        const productosCriticos = await prisma.productos.findMany({
            where: {
                stock_actual: {
                    lte: prisma.productos.fields.stock_minimo // Compara actual <= minimo
                }
            },
            include: { categorias: true }
        });

        res.json({
            conteo: productosCriticos.length,
            productos: productosCriticos
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener alertas de stock" });
    }
};