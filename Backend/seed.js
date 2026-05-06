import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  // Hasheamos la contraseña para cumplir con el RNF de Seguridad [cite: 240]
  const hashedStaticPassword = await bcrypt.hash('admin123', saltRounds);
  const cajeroPassword = await bcrypt.hash('cajero123', saltRounds);

  //1.Crear/actualizar administrador inicial
  const admin = await prisma.usuarios.upsert({
    where: { correo: 'admin@gestock.com' },
    update: {},
    create: {
      nombre_usuario: 'Administrador Inicial',
      correo: 'admin@gestock.com',
      password: hashedStaticPassword,
      rol: 'administrador', //
    },
  });

  console.log('✅ Usuario administrador creado:', admin.correo);


  //2.Crear/actualizar cajero inicial
  const cajero = await prisma.usuarios.upsert({
    where: { correo: 'cajero@gestock.com' },
    update: {},
    create: {
      nombre_usuario: 'Cajero Inicial',
      correo: 'cajero@gestock.com',
      password: cajeroPassword,
      rol: 'cajero', //
    },
  });

  console.log('✅ Usuario cajero creado:', cajero.correo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });