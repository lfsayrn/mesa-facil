import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// Use same path as DATABASE_URL in .env: file:./dev.db (relative to project root)
const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const DEFAULT_SIDES = ["Arroz", "Feijão", "Macarrão", "Salada", "Farofa"];
const DEFAULT_EXTRAS = [
  { name: "Batata Frita", price: 12.0 },
  { name: "Ovo Frito", price: 3.0 },
  { name: "Vinagrete", price: 4.0 },
  { name: "Torresmo", price: 8.0 },
];

async function main() {
  console.log("🌱 Seeding database...");
  console.log(`📁 Database path: ${dbPath}`);

  // Limpar dados existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();

  // Criar cardápio
  const menuItems = [
    {
      name: "Filé de Tilápia",
      category: "pratos",
      price: 26.0,
      sides: JSON.stringify(DEFAULT_SIDES),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    {
      name: "Contra-Filé",
      category: "pratos",
      price: 26.0,
      sides: JSON.stringify(DEFAULT_SIDES),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    {
      name: "PF Frango Grelhado",
      category: "pratos",
      price: 16.0,
      sides: JSON.stringify(DEFAULT_SIDES),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    {
      name: "PF Calabresa",
      category: "pratos",
      price: 16.0,
      sides: JSON.stringify(DEFAULT_SIDES),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    {
      name: "PF Bisteca",
      category: "pratos",
      price: 16.0,
      sides: JSON.stringify(DEFAULT_SIDES),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    {
      name: "PF Omelete",
      category: "pratos",
      price: 16.0,
      sides: JSON.stringify(["Arroz", "Feijão", "Salada"]),
      extras: JSON.stringify(DEFAULT_EXTRAS),
    },
    { name: "Porção de Fritas", category: "porcoes", price: 12.0 },
    { name: "Salada Extra", category: "porcoes", price: 8.0 },
    { name: "Ovo Frito (Un)", category: "porcoes", price: 3.0 },
    { name: "Coca-Cola (Lata)", category: "bebidas", price: 6.0 },
    { name: "Guaraná (Lata)", category: "bebidas", price: 6.0 },
    { name: "Suco de Laranja", category: "bebidas", price: 9.0 },
    { name: "Suco de Limão", category: "bebidas", price: 8.0 },
    { name: "Água Mineral", category: "bebidas", price: 4.0 },
    { name: "Cerveja (Lata)", category: "bebidas", price: 7.0 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  console.log(`✅ Created ${menuItems.length} menu items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
