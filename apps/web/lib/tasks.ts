import { prisma } from './prisma'

export async function getOrCreateDefaultBoard(userId: string) {
  const existing = await prisma.taskBoard.findFirst({
    where: { userId },
    include: {
      columns: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      tasks: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (existing) return existing

  return prisma.taskBoard.create({
    data: {
      name: 'My Tasks',
      userId,
      columns: {
        create: [
          {
            name: 'Company',
            type: 'select',
            order: 0,
            options: { create: [] },
          },
          { name: 'Title', type: 'text', order: 1, options: { create: [] } },
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
          { name: 'Due date', type: 'date', order: 3, options: { create: [] } },
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
      columns: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      tasks: { orderBy: { order: 'asc' } },
    },
  })
}
