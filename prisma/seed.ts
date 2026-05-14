import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.plannedMaintenance.deleteMany()
  await prisma.maintenanceLog.deleteMany()
  await prisma.refuelingLog.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.create({
    data: {
      name: 'Test Rider',
      email: 'test@example.com',
      password: hashedPassword,
    },
  })

  const vehicle = await prisma.vehicle.create({
    data: {
      make: 'Voge',
      model: '500R',
      year: 2023,
      userId: user.id,
      isPublic: true,
      slug: 'voge-500r-test',
    },
  })

  await prisma.refuelingLog.createMany({
    data: [
      { vehicleId: vehicle.id, odometer: 1000, liters: 12.5, cost: 700 },
      { vehicleId: vehicle.id, odometer: 1300, liters: 13.0, cost: 720 },
      { vehicleId: vehicle.id, odometer: 1650, liters: 14.2, cost: 800 },
    ],
  })

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicle.id,
      odometer: 1000,
      type: 'First Service (Oil + Filter)',
      cost: 5000,
      description: 'Dealer service',
    },
  })

  await prisma.plannedMaintenance.create({
    data: {
      vehicleId: vehicle.id,
      type: 'Chain Lube',
      targetOdometer: 2000,
    },
  })

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
