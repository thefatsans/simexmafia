-- Verkäufer SimexMafia + Discord-Server-Produkt zuordnen
INSERT INTO "Seller" ("id", "name", "rating", "reviewCount", "verified", "createdAt", "updatedAt")
VALUES (
  'seller-simexmafia',
  'SimexMafia',
  5.0,
  847,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "verified" = true,
  "rating" = EXCLUDED."rating",
  "reviewCount" = EXCLUDED."reviewCount",
  "updatedAt" = NOW();

UPDATE "Product"
SET "sellerId" = 'seller-simexmafia', "updatedAt" = NOW()
WHERE "name" ILIKE '%Simex Geheimer Discord%'
   OR "name" ILIKE '%Geheimer Discord-Server%';
