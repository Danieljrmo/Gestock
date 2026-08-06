import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga masiva del catálogo de Minimarket...');

  // Leemos el archivo JSON
  const dataset = JSON.parse(fs.readFileSync('./catalogo.json', 'utf-8'));

  for (const cat of dataset) {
    // 1. Buscar si la categoría ya existe por su nombre
    let categoriaExistente = await prisma.categorias.findFirst({
      where: { nombre_categoria: cat.categoria }
    });

    // 2. Si no existe, la creamos
    if (!categoriaExistente) {
      categoriaExistente = await prisma.categorias.create({
        data: {
          nombre_categoria: cat.categoria,
          descripcion: `Productos correspondientes al rubro de ${cat.categoria}`
        }
      });
      console.log(`✨ Categoría creada: ${categoriaExistente.nombre_categoria}`);
    } else {
      console.log(`📂 Categoría encontrada: ${categoriaExistente.nombre_categoria}`);
    }

    // 3. Insertar o actualizar los productos asociados
    for (const prod of cat.productos) {
      // Buscar producto por código de barra (este sí es único)
      const productoExistente = await prisma.productos.findFirst({
        where: { codigo_barra: prod.codigo_barra }
      });

      if (productoExistente) {
        await prisma.productos.update({
          where: { id_producto: productoExistente.id_producto },
          data: {
            stock_actual: prod.stock_actual,
            precio_venta: prod.precio_venta,
            precio_compra: prod.precio_compra,
            id_categoria: categoriaExistente.id_categoria
          }
        });
      } else {
        await prisma.productos.create({
          data: {
            nombre_producto: prod.nombre,
            id_categoria: categoriaExistente.id_categoria,
            codigo_barra: prod.codigo_barra,
            precio_compra: prod.precio_compra,
            precio_venta: prod.precio_venta,
            stock_actual: prod.stock_actual,
            stock_minimo: prod.stock_minimo,
            unidad_medida: prod.unidad_medida,
            estado: 'activo'
          }
        });
      }
    }
  }

  console.log('✅ ¡Catálogo cargado con éxito en PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('❌ Error al poblar el catálogo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });