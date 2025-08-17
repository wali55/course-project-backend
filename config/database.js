const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
