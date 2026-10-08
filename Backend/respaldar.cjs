const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function respaldar() {
  try {
    console.log("Conectando a Render...");
    const ventas = await prisma.ventas.findMany({ include: { detalles: true } });
    fs.writeFileSync("respaldo_ventas_render.json", JSON.stringify(ventas, null, 2));
    console.log("✅ Respaldo exportado exitosamente a respaldo_ventas_render.json");
  } catch (e) {
    console.error("❌ No se pudo conectar a Render:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

respaldar();