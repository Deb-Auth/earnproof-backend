import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.supportedAsset.upsert({
    where: {
      assetKey: "stellar-testnet:XLM:native",
    },
    update: {},
    create: {
      assetKey: "stellar-testnet:XLM:native",
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
