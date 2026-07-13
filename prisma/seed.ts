import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.supportedAsset.upsert({
    where: {
      code_issuer_network: {
        code: "XLM",
        issuer: null,
        network: "stellar-testnet",
      },
    },
    update: {},
    create: {
      code: "XLM",
      issuer: null,
      network: "stellar-testnet",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
