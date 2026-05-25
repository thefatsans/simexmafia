const EMAIL_REGEX =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i

/** Bekannte Wegwerf-/Alias-Domains (keine echten Postfächer) */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'mintemail.com',
  'emailondeck.com',
  'tempail.com',
  'mailnesia.com',
  'spamgourmet.com',
  'mytemp.email',
  'tmpmail.net',
  'tmpmail.org',
  'moakt.com',
  'inboxkitten.com',
])

export type EmailValidationResult =
  | { valid: true; email: string }
  | { valid: false; error: string }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateEmailForRegistration(email: string): EmailValidationResult {
  const normalized = normalizeEmail(email)

  if (!normalized || normalized.length > 254) {
    return { valid: false, error: 'Ungültige E-Mail-Adresse.' }
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }
  }

  const [, domain] = normalized.split('@')
  if (!domain || domain.length < 4) {
    return { valid: false, error: 'Ungültige E-Mail-Domain.' }
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Wegwerf-E-Mail-Adressen sind nicht erlaubt. Bitte nutze eine echte E-Mail.',
    }
  }

  const blockedPatterns = ['test@test', '@example.com', '@localhost']
  if (blockedPatterns.some((p) => normalized.includes(p))) {
    return { valid: false, error: 'Diese E-Mail-Adresse ist nicht erlaubt.' }
  }

  return { valid: true, email: normalized }
}
