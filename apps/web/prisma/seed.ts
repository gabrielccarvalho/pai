import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  console.log(`User: ${user.email}`)

  // Check if user already has a board
  const existing = await prisma.taskBoard.findFirst({ where: { userId: user.id } })
  if (existing) {
    console.log('Board already exists, skipping seed.')
    return
  }

  // Create default board
  const board = await prisma.taskBoard.create({
    data: {
      name: 'My Tasks',
      userId: user.id,
      columns: {
        create: [
          { name: 'Company', type: 'select', order: 0 },
          { name: 'Title', type: 'text', order: 1 },
          {
            name: 'Status',
            type: 'select',
            order: 2,
            options: {
              create: [
                { label: 'Todo', color: '#6b7280', order: 0 },
                { label: 'In Progress', color: '#3b82f6', order: 1 },
                { label: 'Done', color: '#22c55e', order: 2 },
              ],
            },
          },
          { name: 'Due date', type: 'date', order: 3 },
          {
            name: 'Priority',
            type: 'select',
            order: 4,
            options: {
              create: [
                { label: 'Low', color: '#22c55e', order: 0 },
                { label: 'Medium', color: '#f97316', order: 1 },
                { label: 'High', color: '#ef4444', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      columns: { include: { options: true } },
    },
  })

  const titleCol = board.columns.find((c) => c.name === 'Title')!
  const statusCol = board.columns.find((c) => c.name === 'Status')!
  const priorityCol = board.columns.find((c) => c.name === 'Priority')!
  const companyCol = board.columns.find((c) => c.name === 'Company')!

  const todoOpt = statusCol.options.find((o) => o.label === 'Todo')!
  const inProgressOpt = statusCol.options.find((o) => o.label === 'In Progress')!
  const doneOpt = statusCol.options.find((o) => o.label === 'Done')!
  const highOpt = priorityCol.options.find((o) => o.label === 'High')!
  const medOpt = priorityCol.options.find((o) => o.label === 'Medium')!
  const lowOpt = priorityCol.options.find((o) => o.label === 'Low')!

  // Create sample company options
  const acme = await prisma.columnOption.create({
    data: { label: 'Acme Corp', color: '#8b5cf6', order: 0, columnId: companyCol.id },
  })
  const globex = await prisma.columnOption.create({
    data: { label: 'Globex', color: '#06b6d4', order: 1, columnId: companyCol.id },
  })

  // Create sample tasks
  const tasks = [
    {
      order: 0,
      values: {
        [titleCol.id]: 'Set up project structure',
        [statusCol.id]: doneOpt.id,
        [priorityCol.id]: highOpt.id,
        [companyCol.id]: acme.id,
      },
    },
    {
      order: 1,
      values: {
        [titleCol.id]: 'Implement authentication',
        [statusCol.id]: inProgressOpt.id,
        [priorityCol.id]: highOpt.id,
        [companyCol.id]: acme.id,
      },
    },
    {
      order: 2,
      values: {
        [titleCol.id]: 'Design dashboard UI',
        [statusCol.id]: todoOpt.id,
        [priorityCol.id]: medOpt.id,
        [companyCol.id]: globex.id,
      },
    },
    {
      order: 3,
      values: {
        [titleCol.id]: 'Write unit tests',
        [statusCol.id]: todoOpt.id,
        [priorityCol.id]: lowOpt.id,
        [companyCol.id]: globex.id,
      },
    },
    {
      order: 4,
      values: {
        [titleCol.id]: 'Deploy to production',
        [statusCol.id]: todoOpt.id,
        [priorityCol.id]: highOpt.id,
      },
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, boardId: board.id } })
  }

  console.log(`Created board "${board.name}" with ${tasks.length} sample tasks.`)
  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
