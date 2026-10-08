import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. OBTENER RESUMEN DE VENTAS POR PERÍODO (CON ZONA HORARIA LOCAL CHILE UTC-3)
export const getVentasPorPeriodo = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let inicio, fin;

        if (fechaInicio && fechaFin) {
            // Forzamos el horario local completo (00:00:00 a 23:59:59) agregando la hora explícita
            // '-03:00' asegura la zona horaria chilena para evitar que UTC desplace las 21:00 hrs
            inicio = new Date(`${fechaInicio}T00:00:00.000-03:00`);
            fin = new Date(`${fechaFin}T23:59:59.999-03:00`);
        } else {
            // Si no vienen fechas, por defecto toma todo el mes actual
            const ahora = new Date();
            const anoActual = ahora.getFullYear();
            const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
            
            inicio = new Date(`${anoActual}-${mesActual}-01T00:00:00.000-03:00`);
            fin = new Date(`${fechaFin || ahora.toISOString().split('T')[0]}T23:59:59.999-03:00`);
        }

        const ventas = await prisma.ventas.findMany({
            where: {
                fecha_venta: {
                    gte: inicio,
                    lte: fin
                },
                estado: 'completada'
            },
            include: {
                usuarios: {
                    select: { nombre_usuario: true }
                },
                detalle_venta: {
                    include: {
                        productos: { 
                            select: { 
                                nombre_producto: true,
                                unidad_medida: true 
                            } 
                        }
                    }
                }
            },
            orderBy: { fecha_venta: 'desc' }
        });

        // Totales consolidados
        const totalVendido = ventas.reduce((acc, v) => acc + parseFloat(v.total), 0);
        const netoAfecto = Math.round(totalVendido / 1.19);
        const ivaTotal = totalVendido - netoAfecto;
        const totalTransacciones = ventas.length;

        res.json({
            periodo: { inicio, fin },
            metricas: { totalVendido, netoAfecto, ivaTotal, totalTransacciones },
            ventas
        });
    } catch (error) {
        console.error("Error en getVentasPorPeriodo:", error.message);
        res.status(500).json({ error: "Error al generar el reporte de ventas por período." });
    }
};

// 2. RANKING DE ROTACIÓN DE PRODUCTOS (TOP MÁS Y MENOS VENDIDOS - ANÁLISIS ABC)
export const getRotacionProductos = async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        // Agrupamos en detalle_venta sumando cantidades vendidas
        const agruparDetalles = await prisma.detalle_venta.groupBy({
            by: ['id_producto'],
            _sum: {
                cantidad: true,
                subtotal: true
            },
            _count: {
                id_venta: true
            },
            orderBy: {
                _sum: {
                    cantidad: 'desc'
                }
            }
        });

        // Hidratamos con los nombres, categorías y unidad de medida de los productos
        const rankingCompleto = await Promise.all(
            agruparDetalles.map(async (item) => {
                const prod = await prisma.productos.findUnique({
                    where: { id_producto: item.id_producto },
                    select: { 
                        nombre_producto: true, 
                        codigo_barra: true, 
                        stock_actual: true, 
                        precio_venta: true,
                        unidad_medida: true // 👈 AQUÍ ESTABA LA CLAVE
                    }
                });
                return {
                    id_producto: item.id_producto,
                    nombre_producto: prod?.nombre_producto || 'Desconocido',
                    codigo_barra: prod?.codigo_barra || 'N/A',
                    stock_actual: prod?.stock_actual || 0,
                    unidad_medida: prod?.unidad_medida || 'UNIDAD', // 👈 Se envía la unidad al Frontend
                    unidades_vendidas: item._sum.cantidad || 0,
                    total_recaudado: item._sum.subtotal || 0,
                    num_transacciones: item._count.id_venta
                };
            })
        );

        // Separación Top Mas Vendidos vs Menos Vendidos
        const masVendidos = rankingCompleto.slice(0, parseInt(limite));
        const menosVendidos = [...rankingCompleto].reverse().slice(0, parseInt(limite));

        res.json({
            masVendidos,
            menosVendidos,
            totalProductosAnalizados: rankingCompleto.length
        });

    } catch (error) {
        console.error("Error en getRotacionProductos:", error.message);
        res.status(500).json({ error: "Error al obtener la rotación de productos." });
    }
};

// 3. CONSULTAR HISTORIAL DE MOVIMIENTOS (TRAZABILIDAD TOTAL)
export const getHistorialMovimientos = async (req, res) => {
    try {
        const movimientos = await prisma.movimientos_inventario.findMany({
            include: {
                productos: { 
                    select: { 
                        nombre_producto: true, 
                        codigo_barra: true,
                        unidad_medida: true // 👈 Agregado para historial
                    } 
                },
                usuarios: { select: { nombre_usuario: true } },
                proveedores: { select: { nombre: true } }
            },
            orderBy: { fecha_movimiento: 'desc' }
        });

        res.json(movimientos);
    } catch (error) {
        console.error("Error en getHistorialMovimientos:", error.message);
        res.status(500).json({ error: "Error al obtener el historial de movimientos." });
    }
};