import { prisma } from './index'

async function main() {
  console.log('Seed not implemented yet.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
