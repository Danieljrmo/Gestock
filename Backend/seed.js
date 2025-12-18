const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  // Hasheamos la contraseña para cumplir con el RNF de Seguridad [cite: 240]
  const hashedStaticPassword = await bcrypt.hash('admin123', saltRounds);

  const admin = await prisma.usuarios.upsert({
    where: { correo: 'admin@gestock.com' },
    update: {},
    create: {
      nombre_usuario: 'Administrador Inicial',
      correo: 'admin@gestock.com',
      contraseña: hashedStaticPassword,
      rol: 'administrador', //
    },
  });

  console.log('✅ Usuario administrador creado:', admin.correo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });