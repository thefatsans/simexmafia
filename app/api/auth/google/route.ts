import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbUserToClientUser, publicUserSelect } from '@/lib/auth-user'
import { isAdmin as isAdminByEmail } from '@/data/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const name = (body.name as string | undefined)?.trim() || 'User'
    const picture = body.picture as string | undefined

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const nameParts = name.split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    let user = await prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatar: picture || null,
          goofyCoins: 100,
          totalSpent: 0,
          tier: 'Bronze',
          isAdmin: isAdminByEmail(email),
          emailVerified: true,
        },
        select: publicUserSelect,
      })
    } else if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
        select: publicUserSelect,
      })
    } else if (picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: picture },
        select: publicUserSelect,
      })
    }

    return NextResponse.json({
      success: true,
      user: dbUserToClientUser(user),
    })
  } catch (error) {
    console.error('[Auth Google] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Google-Anmeldung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
