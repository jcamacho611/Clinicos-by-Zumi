-- Only the facts a purchase actually needs are required before payment.
--
-- The Clinic Operating Analysis reservation demanded ten answers before a buyer could
-- pay: role, phone, provider count, location count, current vendors, monthly software
-- spend and a repeated pain-point selection, on top of clinic name, contact name and
-- email. None of the first seven are read when creating the reservation or the
-- server-owned checkout intent — the checkout needs an email and a price the server
-- owns, and nothing else. They were consulting homework standing between a ready buyer
-- and giving us money.
--
-- They are still worth collecting, after payment, during implementation discovery. The
-- reason this is a migration rather than a default is that defaulting is a lie: writing
-- providerCount = 1 for a clinic with twelve providers invents a fact that would flow
-- into proposals, pricing and any later ROI claim. NULL says "not collected yet", which
-- is the truth, and stays distinguishable from a real answer of 1.
--
-- Nothing here is dropped. Existing rows keep every value they already carry.

ALTER TABLE "demo_reservations"
  ALTER COLUMN "contactRole" DROP NOT NULL,
  ALTER COLUMN "contactPhone" DROP NOT NULL,
  ALTER COLUMN "providerCount" DROP NOT NULL,
  ALTER COLUMN "locationCount" DROP NOT NULL,
  ALTER COLUMN "currentSystems" DROP NOT NULL,
  ALTER COLUMN "painPoints" DROP NOT NULL;
