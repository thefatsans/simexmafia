-- Add password-reset fields to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetCodeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0;
