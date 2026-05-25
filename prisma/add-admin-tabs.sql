-- Migration: DiscountCode, ContactRequest, Newsletter
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS "DiscountCode" (
  "id"          TEXT PRIMARY KEY,
  "code"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "value"       DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "minAmount"   DOUBLE PRECISION,
  "maxDiscount" DOUBLE PRECISION,
  "validFrom"   TIMESTAMP(3) NOT NULL,
  "validUntil"  TIMESTAMP(3),
  "usageLimit"  INTEGER,
  "usageCount"  INTEGER NOT NULL DEFAULT 0,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCode_code_key" ON "DiscountCode"("code");

CREATE TABLE IF NOT EXISTS "ContactRequest" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "category"  TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "response"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Newsletter" (
  "id"             TEXT PRIMARY KEY,
  "email"          TEXT NOT NULL,
  "active"         BOOLEAN NOT NULL DEFAULT TRUE,
  "subscribedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "Newsletter_email_key" ON "Newsletter"("email");

-- Seed default discount codes (only insert if no codes exist).
INSERT INTO "DiscountCode" (
  "id", "code", "type", "value", "description",
  "minAmount", "maxDiscount", "validFrom", "validUntil",
  "usageLimit", "usageCount", "active", "createdAt", "updatedAt"
)
SELECT 'seed-welcome10', 'WELCOME10', 'percentage', 10, '10% Rabatt für neue Kunden',
       0, NULL, TIMESTAMP '2024-01-01 00:00:00', TIMESTAMP '2026-12-31 23:59:59',
       1, 0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "DiscountCode");

INSERT INTO "DiscountCode" (
  "id", "code", "type", "value", "description",
  "minAmount", "maxDiscount", "validFrom", "validUntil",
  "usageLimit", "usageCount", "active", "createdAt", "updatedAt"
)
SELECT 'seed-save20', 'SAVE20', 'percentage', 20, '20% Rabatt ab €50 Einkaufswert (max. €15 Rabatt)',
       50, 15, TIMESTAMP '2024-01-01 00:00:00', TIMESTAMP '2026-12-31 23:59:59',
       NULL, 0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "DiscountCode" WHERE "code" = 'SAVE20');

INSERT INTO "DiscountCode" (
  "id", "code", "type", "value", "description",
  "minAmount", "maxDiscount", "validFrom", "validUntil",
  "usageLimit", "usageCount", "active", "createdAt", "updatedAt"
)
SELECT 'seed-fixed5', 'FIXED5', 'fixed', 5, '€5 Rabatt ab €20 Einkaufswert',
       20, NULL, TIMESTAMP '2024-01-01 00:00:00', TIMESTAMP '2026-12-31 23:59:59',
       NULL, 0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "DiscountCode" WHERE "code" = 'FIXED5');

INSERT INTO "DiscountCode" (
  "id", "code", "type", "value", "description",
  "minAmount", "maxDiscount", "validFrom", "validUntil",
  "usageLimit", "usageCount", "active", "createdAt", "updatedAt"
)
SELECT 'seed-sacks50', 'SACKS50', 'percentage', 50, '50% Rabatt auf alle Säcke (einmalig)',
       0, NULL, TIMESTAMP '2024-01-01 00:00:00', TIMESTAMP '2026-12-31 23:59:59',
       1, 0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "DiscountCode" WHERE "code" = 'SACKS50');
