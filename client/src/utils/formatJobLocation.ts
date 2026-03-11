/**
 * Format job location for list cards: show only postcode and city/town, not full address.
 * Returns "Online" when location is Online, otherwise "Town, POSTCODE" or "POSTCODE".
 */
export function formatJobLocationShort(job: {
  location: string;
  postcode?: string;
}): string {
  const loc = (job.location || "").trim();
  const pc = (job.postcode || "").trim();
  if (!loc || loc === "Online") return "Online";
  if (!pc) return loc;
  if (loc === pc) return pc;
  // Try "Town, POSTCODE" – assume location ends with postcode (e.g. "London, SW1A 1AA" or "123 Street, London, SW1A 1AA")
  const locUpper = loc.toUpperCase();
  const pcUpper = pc.toUpperCase();
  const idx = locUpper.lastIndexOf(pcUpper);
  if (idx >= 0) {
    const before = loc.slice(0, idx).replace(/,\s*$/, "").trim();
    const lastComma = before.lastIndexOf(",");
    const town = lastComma >= 0 ? before.slice(lastComma + 1).trim() : before;
    if (town) return `${town}, ${pc}`;
  }
  return pc;
}
