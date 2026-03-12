import { NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { prisma } from '../../../lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { columnId, label, color } = await req.json()

  // Verify ownership
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { userId: session.user.id } },
    include: { options: true },
  })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const option = await prisma.columnOption.create({
    data: { label, color, order: column.options.length, columnId },
  })
  return NextResponse.json(option, { status: 201 })
}
