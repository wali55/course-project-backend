const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Started database seeding");

  const adminPassword = await bcrypt.hash("Admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@email.com" },
    update: {},
    create: {
      username: "admin",
      email: "admin@email.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user", admin);

  const userPassword = await bcrypt.hash("User123", 12);

  const user = await prisma.user.upsert({
    where: { email: "user@email.com" },
    update: {},
    create: {
      username: "demouser",
      email: "user@email.com",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("Created regular user", user);

  console.log("Database seeding completed");
}

main()
  .catch((err) => {
    console.error("Error during seeding", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
