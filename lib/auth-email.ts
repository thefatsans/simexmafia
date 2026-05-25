import { prisma } from '@/lib/prisma'
import {
  generateVerificationCode,
  hashVerificationCode,
  verificationExpiresAt,
} from '@/lib/verification-code'
import { sendVerificationCodeEmail } from '@/lib/email-server'

export async function issueEmailVerificationCode(
  userId: string,
  email: string,
  firstName: string
): Promise<{ sent: boolean; error?: string; devCode?: string }> {
  if (!prisma) {
    return { sent: false, error: 'Datenbank nicht verfügbar' }
  }

  const code = generateVerificationCode()
  const codeHash = hashVerificationCode(code)
  const expiresAt = verificationExpiresAt(15)

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyCodeHash: codeHash,
      emailVerifyExpires: expiresAt,
      emailVerifyAttempts: 0,
    },
  })

  const mail = await sendVerificationCodeEmail(email, firstName, code)

  if (!mail.success) {
    console.error('[Auth Email] Verification send failed:', mail.error)
    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
      return { sent: true, devCode: code }
    }
    return {
      sent: false,
      error:
        mail.error ||
        'E-Mail konnte nicht gesendet werden. Prüfe RESEND_API_KEY in Vercel.',
    }
  }

  return { sent: true }
}
