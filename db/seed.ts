import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import sampleData from './sample-data'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  await prisma.product.deleteMany()

  await prisma.product.createMany({ data: sampleData.products })

  console.log("Database seeded successfully")
}

main()

