import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Soporte para rutas de archivo en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 [SEED] Iniciando poblamiento de base de datos para Gestock...');

  const saltRounds = 10;

  // ==========================================
  // 1. POBLAMIENTO DE IDENTIDADES (USUARIOS)
  // ==========================================
  console.log('🔐 [SEED] Creando cuentas de usuario iniciales...');

  const passCarolina = await bcrypt.hash('Carolina2026*', saltRounds);
  const passGloria = await bcrypt.hash('Gloria2026*', saltRounds);

  // Administrador: Carolina Obando
  const admin = await prisma.usuarios.upsert({
    where: { correo: 'carolina@gestock.com' },
    update: {},
    create: {
      nombre_usuario: 'Carolina Obando',
      correo: 'carolina@gestock.com',
      password: passCarolina,
      rol: 'ADMINISTRADOR'
    }
  });
  console.log(`✅ Administrador configurado: ${admin.nombre_usuario} (${admin.correo})`);

  // Cajera: Gloria
  const cajera = await prisma.usuarios.upsert({
    where: { correo: 'gloria@gestock.com' },
    update: {},
    create: {
      nombre_usuario: 'Gloria',
      correo: 'gloria@gestock.com',
      password: passGloria,
      rol: 'CAJERO'
    }
  });
  console.log(`✅ Cajera configurada: ${cajera.nombre_usuario} (${cajera.correo})`);

  // ==========================================
  // 2. POBLAMIENTO DE CATEGORÍAS Y PRODUCTOS
  // ==========================================
  console.log('📦 [SEED] Cargando catálogo maestro desde catalogo.json...');

  // Ruta absoluta a catalogo.json (puede estar en la raíz del backend o dentro de prisma/)
  let catalogoPath = path.join(__dirname, 'catalogo.json');
  if (!fs.existsSync(catalogoPath)) {
    catalogoPath = path.join(__dirname, '../catalogo.json');
  }

  if (!fs.existsSync(catalogoPath)) {
    throw new Error(`❌ No se encontró el archivo catalogo.json en ${catalogoPath}`);
  }

  const dataset = JSON.parse(fs.readFileSync(catalogoPath, 'utf-8'));

  for (const cat of dataset) {
    // Buscar o crear categoría
    let categoriaExistente = await prisma.categorias.findFirst({
      where: { nombre_categoria: cat.categoria }
    });

    if (!categoriaExistente) {
      categoriaExistente = await prisma.categorias.create({
        data: {
          nombre_categoria: cat.categoria,
          descripcion: `Productos correspondientes al rubro de ${cat.categoria}`
        }
      });
      console.log(`✨ Categoría creada: ${categoriaExistente.nombre_categoria}`);
    }

    // Insertar o actualizar productos de la categoría
    for (const prod of cat.productos) {
      const productoExistente = await prisma.productos.findFirst({
        where: { codigo_barra: String(prod.codigo_barra) }
      });

      if (productoExistente) {
        await prisma.productos.update({
          where: { id_producto: productoExistente.id_producto },
          data: {
            stock_actual: parseFloat(prod.stock_actual),
            precio_venta: parseFloat(prod.precio_venta),
            precio_compra: parseFloat(prod.precio_compra),
            id_categoria: categoriaExistente.id_categoria
          }
        });
      } else {
        await prisma.productos.create({
          data: {
            nombre_producto: prod.nombre,
            id_categoria: categoriaExistente.id_categoria,
            codigo_barra: String(prod.codigo_barra),
            precio_compra: parseFloat(prod.precio_compra),
            precio_venta: parseFloat(prod.precio_venta),
            stock_actual: parseFloat(prod.stock_actual),
            stock_minimo: parseFloat(prod.stock_minimo),
            unidad_medida: prod.unidad_medida || 'UNIDAD',
            estado: 'activo'
          }
        });
      }
    }
  }

  console.log('✅ ¡Poblamiento completo finalizado con éxito en PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el proceso de Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });