-- =============================================================================
-- Migration : add_multi_tenant
-- Préserve les données existantes : crée le tenant n°1 ("mecanodom") et lui
-- rattache toutes les lignes actuelles, puis retire les DEFAULT temporaires.
--
-- Workflow :
--   1. Remplacer prisma/schema.prisma par le nouveau schéma
--   2. npx prisma migrate dev --create-only --name add_multi_tenant
--   3. Remplacer le contenu du fichier SQL généré par CE fichier
--   4. npx prisma migrate dev
-- =============================================================================

-- 1. Table Tenant --------------------------------------------------------------
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "hoursSummary" TEXT,
    "mapCenterLat" DOUBLE PRECISION,
    "mapCenterLng" DOUBLE PRECISION,
    "notificationEmail" TEXT,
    "mailFromName" TEXT,
    "baseUrl" TEXT,
    "legalCompanyName" TEXT,
    "legalSiret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- 2. Tenant par défaut (reprend les valeurs de src/lib/site.ts) ---------------
INSERT INTO "Tenant" (
    "slug", "name", "tagline", "description", "phone", "email", "address",
    "hoursSummary", "mapCenterLat", "mapCenterLng", "updatedAt"
) VALUES (
    'mecanodom',
    'MécanoDom',
    'Votre mécanicien à domicile',
    'Entretien et réparation automobile à domicile en Île-de-France. Prise de rendez-vous en ligne, tarifs transparents, intervention chez vous.',
    '01 23 45 67 89',
    'contact@mecanodom.fr',
    'Île-de-France',
    'Lun–Ven 8h–18h · Sam 9h–13h',
    48.8566,
    2.3522,
    CURRENT_TIMESTAMP
);

-- 3. Colonnes tenantId (DEFAULT 1 pour rattacher l'existant, puis DROP DEFAULT)
ALTER TABLE "ServiceCategory" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ServiceCategory" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "Service" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Service" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "WorkingHours" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "WorkingHours" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "BlockedDate" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BlockedDate" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "BookingSettings" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BookingSettings" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "CoverageZone" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CoverageZone" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "Booking" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Booking" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "AdminUser" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AdminUser" ALTER COLUMN "tenantId" DROP DEFAULT;

-- 4. BookingSettings : singleton id=1 → autoincrement + un réglage par tenant --
CREATE SEQUENCE "BookingSettings_id_seq";
ALTER TABLE "BookingSettings" ALTER COLUMN "id" SET DEFAULT nextval('"BookingSettings_id_seq"');
ALTER SEQUENCE "BookingSettings_id_seq" OWNED BY "BookingSettings"."id";
SELECT setval('"BookingSettings_id_seq"', COALESCE((SELECT MAX("id") FROM "BookingSettings"), 1));
CREATE UNIQUE INDEX "BookingSettings_tenantId_key" ON "BookingSettings"("tenantId");

-- 5. Unicités simples → composites --------------------------------------------
DROP INDEX "ServiceCategory_slug_key";
CREATE UNIQUE INDEX "ServiceCategory_tenantId_slug_key" ON "ServiceCategory"("tenantId", "slug");

DROP INDEX "BlockedDate_date_key";
CREATE UNIQUE INDEX "BlockedDate_tenantId_date_key" ON "BlockedDate"("tenantId", "date");

DROP INDEX "CoverageZone_postalCode_key";
CREATE UNIQUE INDEX "CoverageZone_tenantId_postalCode_key" ON "CoverageZone"("tenantId", "postalCode");

-- (AdminUser.email et Booking.cancelToken restent uniques globalement)

-- 6. Index tenantId -------------------------------------------------------------
CREATE INDEX "ServiceCategory_tenantId_idx" ON "ServiceCategory"("tenantId");
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");
CREATE INDEX "WorkingHours_tenantId_idx" ON "WorkingHours"("tenantId");
CREATE INDEX "BlockedDate_tenantId_idx" ON "BlockedDate"("tenantId");
CREATE INDEX "CoverageZone_tenantId_idx" ON "CoverageZone"("tenantId");
CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");
CREATE INDEX "Booking_tenantId_startAt_idx" ON "Booking"("tenantId", "startAt");
CREATE INDEX "AdminUser_tenantId_idx" ON "AdminUser"("tenantId");

-- 7. Clés étrangères -------------------------------------------------------------
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSettings" ADD CONSTRAINT "BookingSettings_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoverageZone" ADD CONSTRAINT "CoverageZone_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
