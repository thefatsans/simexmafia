import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // base32 minus easily confused chars
const CODE_LENGTH = 8

export function generateReferralCode(): string {
  const buf = randomBytes(CODE_LENGTH)
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length]
  }
  return out
}

export async function ensureReferralCode(userId: string): Promise<string | null> {
  if (!prisma) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })
  if (user?.referralCode) return user.referralCode

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode()
    const exists = await prisma.user.findFirst({
      where: { referralCode: code },
      select: { id: true },
    })
    if (exists) continue
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      })
      return updated.referralCode
    } catch (err) {
      console.warn('[Referral] ensureReferralCode collision, retry:', err)
    }
  }
  return null
}

export async function redeemReferralCode(
  newUserId: string,
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!prisma) return { ok: false, reason: 'db-unavailable' }
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== CODE_LENGTH) return { ok: false, reason: 'invalid-code' }

  const target = await prisma.user.findFirst({
    where: { referralCode: normalized },
    select: { id: true },
  })
  if (!target) return { ok: false, reason: 'not-found' }
  if (target.id === newUserId) return { ok: false, reason: 'self' }

  const current = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { referredById: true },
  })
  if (current?.referredById) return { ok: false, reason: 'already-referred' }

  await prisma.user.update({
    where: { id: newUserId },
    data: {
      referredById: target.id,
      referredAt: new Date(),
    },
  })

  return { ok: true }
}

export async function rewardReferral(
  newUserId: string,
  inviterReward: number,
  inviteeReward: number
): Promise<void> {
  if (!prisma) return

  await prisma.$transaction(async (tx) => {
    const claim = await tx.user.updateMany({
      where: {
        id: newUserId,
        referredById: { not: null },
        referralRewardGiven: false,
      },
      data: { referralRewardGiven: true, goofyCoins: { increment: inviteeReward } },
    })

    if (claim.count === 0) return

    const user = await tx.user.findUnique({
      where: { id: newUserId },
      select: { referredById: true, goofyCoins: true },
    })
    if (!user?.referredById) return

    const inviter = await tx.user.update({
      where: { id: user.referredById },
      data: { goofyCoins: { increment: inviterReward } },
      select: { goofyCoins: true },
    })

    await tx.coinTransaction.create({
      data: {
        userId: user.referredById,
        type: 'earned',
        amount: inviterReward,
        balance: inviter.goofyCoins,
        description: `Referral-Bonus für eingeladenen Nutzer ${newUserId}`,
      },
    })

    await tx.coinTransaction.create({
      data: {
        userId: newUserId,
        type: 'earned',
        amount: inviteeReward,
        balance: user.goofyCoins,
        description: 'Referral-Bonus (Einladungscode verwendet)',
      },
    })
  })
}

export interface ReferralStats {
  code: string | null
  invitedCount: number
  rewardedCount: number
  earnedCoins: number
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  if (!prisma) {
    return { code: null, invitedCount: 0, rewardedCount: 0, earnedCoins: 0 }
  }

  const code = await ensureReferralCode(userId)
  const [invitedCount, rewardedCount, sumResult] = await Promise.all([
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.count({ where: { referredById: userId, referralRewardGiven: true } }),
    prisma.coinTransaction.aggregate({
      where: {
        userId,
        type: 'earned',
        description: { contains: 'Referral' },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    code,
    invitedCount,
    rewardedCount,
    earnedCoins: sumResult._sum.amount ?? 0,
  }
}
