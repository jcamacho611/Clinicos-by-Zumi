import "server-only";

import { db } from "@/lib/db";
import {
  type MarketplaceListing,
  type MarketplaceWorkSetting,
  nextAvailableInDays,
} from "@/lib/grid/marketplace-rules";

/**
 * Public GRID marketplace reads.
 *
 * This is the only unauthenticated read path into GRID, so the gates are explicit
 * and narrow:
 *
 *  - Only `active` listings owned by an `active` provider are returned. Drafts and
 *    suspended providers never reach a public surface.
 *  - Only fields a buyer needs to form a shortlist are selected. Contact details,
 *    licence numbers, DEA, NPI, malpractice policy numbers, evidence references,
 *    internal review notes, and payout data are never selected, so they cannot leak
 *    through a serialization mistake downstream.
 *  - Nothing patient-related is touched. GRID requests carry a synthetic client
 *    label, and the marketplace never reads even that.
 */

const LISTING_LIMIT = 200;

type LocationRow = { state: string | null; city: string | null };

function deriveSettings(listing: { mobileAllowed: boolean; clinicLocationAllowed: boolean; chairRentalAllowed: boolean }, atHomeAllowed: boolean): MarketplaceWorkSetting[] {
  const settings: MarketplaceWorkSetting[] = [];
  if (listing.clinicLocationAllowed) settings.push("clinic_location");
  if (listing.chairRentalAllowed) settings.push("chair_rental");
  if (listing.mobileAllowed) settings.push("mobile");
  if (atHomeAllowed) settings.push("at_home");
  return settings;
}

/**
 * Fetch the public listing set.
 *
 * Returns everything in one query set and lets the client filter instantly. At the
 * scale a governed provider marketplace actually operates — hundreds, not millions
 * — this is what makes filtering feel immediate, and it avoids a round trip per
 * keystroke.
 */
export async function listMarketplaceListings(today = new Date()): Promise<MarketplaceListing[]> {
  if (!process.env.DATABASE_URL) return [];

  const listings = await db.gridServiceListing.findMany({
    where: {
      status: "active",
      provider: { status: "active" },
    },
    orderBy: { updatedAt: "desc" },
    take: LISTING_LIMIT,
    select: {
      id: true,
      serviceName: true,
      category: true,
      description: true,
      priceLowCents: true,
      priceHighCents: true,
      requiresDeposit: true,
      requiresConsent: true,
      requiresMedicalReview: true,
      mobileAllowed: true,
      clinicLocationAllowed: true,
      chairRentalAllowed: true,
      provider: {
        select: {
          id: true,
          displayName: true,
          providerType: true,
          specialty: true,
          experienceLevel: true,
          servicesOffered: true,
          serviceLocations: true,
          travelRadiusMiles: true,
          atHomeAllowed: true,
          onCallNow: true,
          verificationStatus: true,
          malpracticeVerificationStatus: true,
          availability: {
            where: { status: "active" },
            select: { weekday: true, location: { select: { state: true, city: true } } },
          },
        },
      },
    },
  });

  const weekday = today.getDay();

  return listings.map((listing) => {
    const availableWeekdays = [...new Set(listing.provider.availability.map((slot) => slot.weekday))].sort();
    const locations = listing.provider.availability
      .map((slot) => slot.location)
      .filter((location): location is LocationRow => Boolean(location));

    const states = [...new Set(locations.map((location) => location.state).filter((state): state is string => Boolean(state)))];
    const cities = [...new Set(locations.map((location) => location.city).filter((city): city is string => Boolean(city)))];

    return {
      id: listing.id,
      serviceName: listing.serviceName,
      category: listing.category,
      description: listing.description,
      priceLowCents: listing.priceLowCents,
      priceHighCents: listing.priceHighCents,
      requiresDeposit: listing.requiresDeposit,
      requiresConsent: listing.requiresConsent,
      requiresMedicalReview: listing.requiresMedicalReview,
      settings: deriveSettings(listing, listing.provider.atHomeAllowed),
      provider: {
        id: listing.provider.id,
        displayName: listing.provider.displayName,
        providerType: listing.provider.providerType,
        specialty: listing.provider.specialty,
        experienceLevel: listing.provider.experienceLevel,
        servicesOffered: listing.provider.servicesOffered,
        travelRadiusMiles: listing.provider.travelRadiusMiles,
        onCallNow: listing.provider.onCallNow,
        verificationStatus: listing.provider.verificationStatus,
        malpracticeVerificationStatus: listing.provider.malpracticeVerificationStatus,
      },
      availableWeekdays,
      nextAvailableInDays: nextAvailableInDays(availableWeekdays, weekday),
      serviceAreas: [...new Set([...listing.provider.serviceLocations, ...cities])],
      states,
    };
  });
}

/** A single public listing, or null. Same gates as the collection read. */
export async function getMarketplaceListing(listingId: string, today = new Date()) {
  if (!process.env.DATABASE_URL) return null;
  const listings = await listMarketplaceListings(today);
  return listings.find((listing) => listing.id === listingId) ?? null;
}

/**
 * Publicly visible rooms, chairs, and partner locations.
 *
 * Gated on the explicit `marketplaceVisible` flag an owner sets, not merely on the
 * location being active — a clinic having a location is not consent to list it.
 */
export async function listMarketplaceLocations() {
  if (!process.env.DATABASE_URL) return [];

  return db.location.findMany({
    where: { marketplaceVisible: true, status: "active" },
    orderBy: { updatedAt: "desc" },
    take: LISTING_LIMIT,
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      locationType: true,
      roomTypes: true,
      chairRentalAvailable: true,
      hourlyRateCents: true,
      dailyRateCents: true,
      servicesAllowed: true,
      credentialRequirements: true,
      insuranceRequirements: true,
    },
  });
}
