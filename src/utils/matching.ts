import { Need, Resource } from '../types';

/**
 * Deterministic MVP matching algorithm for Phase 4
 */
export function findMatchingResourcesForNeed(need: Need, allResources: Resource[]): Resource[] {
  if (need.status !== 'open' && need.status !== 'partially_fulfilled') {
    return [];
  }

  return allResources.filter(res => {
    // 1. Must be available, and have quantity > 0
    if (res.status !== 'available') return false;
    if ((res.quantity || 0) <= 0) return false;

    // 2. Prevent self-matching
    if (res.ownerId === need.createdBy) return false;

    // 3. Category matching (mandatory)
    const categoryMatches = res.category.toLowerCase() === need.category.toLowerCase();
    if (!categoryMatches) return false;

    // 4. Subcategory matching
    const subMatches = 
      !need.subcategory || 
      !res.subcategory || 
      need.subcategory.toLowerCase() === 'autre' || 
      res.subcategory.toLowerCase() === 'autre' || 
      res.subcategory.toLowerCase() === need.subcategory.toLowerCase();

    // 5. Location matching (same country mandatory, plus same city or zone preferred)
    const countryMatches = res.location.country.toLowerCase() === need.location.country.toLowerCase();
    const cityMatches = res.location.city.toLowerCase() === need.location.city.toLowerCase();
    const zoneMatches = !res.location.zone || !need.location.zone || 
      res.location.zone.toLowerCase() === need.location.zone.toLowerCase();

    if (!countryMatches) return false;
    const locationCompatible = cityMatches || zoneMatches;
    if (!locationCompatible) return false;

    // 6. Dates matching (overlap verification between need neededFrom/neededUntil and resource availableFrom/availableUntil)
    const resStart = res.availableFrom;
    const resEnd = res.availableUntil;
    const needStart = need.neededFrom;
    const needEnd = need.neededUntil;

    // Check overlap: start is before other's end and end is after other's start (where undefined means infinity)
    const startOverlap = !resEnd || needStart <= resEnd;
    const endOverlap = !needEnd || resStart <= needEnd;

    return subMatches && startOverlap && endOverlap;
  });
}

export function findMatchingNeedsForResource(resource: Resource, allNeeds: Need[]): Need[] {
  if (resource.status !== 'available') {
    return [];
  }
  if ((resource.quantity || 0) <= 0) {
    return [];
  }

  return allNeeds.filter(need => {
    if (need.status !== 'open' && need.status !== 'partially_fulfilled') return false;
    if (need.createdBy === resource.ownerId) return false;

    const categoryMatches = need.category.toLowerCase() === resource.category.toLowerCase();
    if (!categoryMatches) return false;

    const subMatches = 
      !need.subcategory || 
      !resource.subcategory || 
      need.subcategory.toLowerCase() === 'autre' || 
      resource.subcategory.toLowerCase() === 'autre' || 
      resource.subcategory.toLowerCase() === need.subcategory.toLowerCase();

    const countryMatches = need.location.country.toLowerCase() === resource.location.country.toLowerCase();
    const cityMatches = need.location.city.toLowerCase() === resource.location.city.toLowerCase();
    const zoneMatches = !need.location.zone || !resource.location.zone || 
      need.location.zone.toLowerCase() === resource.location.zone.toLowerCase();

    if (!countryMatches) return false;
    const locationCompatible = cityMatches || zoneMatches;
    if (!locationCompatible) return false;

    // Dates matching (overlap check)
    const resStart = resource.availableFrom;
    const resEnd = resource.availableUntil;
    const needStart = need.neededFrom;
    const needEnd = need.neededUntil;

    const startOverlap = !resEnd || needStart <= resEnd;
    const endOverlap = !needEnd || resStart <= needEnd;

    return subMatches && startOverlap && endOverlap;
  });
}
