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

  const categories = [
    { name: "Electronics", description: "Electronic devices and components" },
    { name: "Books", description: "Books and publications" },
    { name: "Clothing", description: "Apparel and accessories" },
    {
      name: "Home & Garden",
      description: "Home improvement and gardening items",
    },
    {
      name: "Sports & Outdoors",
      description: "Sports equipment and outdoor gear",
    },
    { name: "Tools", description: "Hand tools and power tools" },
    { name: "Office Supplies", description: "Office and business supplies" },
    { name: "Automotive", description: "Car parts and automotive supplies" },
    { name: "Health & Beauty", description: "Health and beauty products" },
    { name: "Toys & Games", description: "Toys, games, and entertainment" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log("Categories seeded successfully!");

  const tags = [
    { name: "New" },
    { name: "Featured" },
    { name: "Discount" },
    { name: "Bestseller" },
    { name: "Limited Edition" },
    { name: "Eco-Friendly" },
    { name: "Premium" },
    { name: "Budget" },
    { name: "Trending" },
    { name: "Popular" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });

    console.log("Tags seeded successfully!");
  }

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
