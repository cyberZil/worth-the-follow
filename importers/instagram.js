/**
 * Instagram importer.
 *
 * Input: the parsed JSON of `following.json` from Instagram's own data export
 * (Settings → Accounts Center → Your information and permissions → Download your
 * information → JSON format). The file lives at
 * `connections/followers_and_following/following.json` inside the export.
 *
 * Instagram has shipped several shapes of this file over the years; this importer
 * handles all the ones we've seen. Everything runs in the browser — nothing is
 * uploaded anywhere.
 *
 * Output: Account[]  →  { handle, url, followedAt (ISO string | null), platform }
 */

export const id = "instagram";
export const name = "Instagram";
export const fileHint = "following.json";

export const instructions = [
  "Open Instagram → Settings → Accounts Center.",
  "Your information and permissions → Download your information.",
  "Choose 'Some of your information' → tick 'Followers and following'.",
  "Set format to JSON, date range to 'All time', then request the download.",
  "When the email arrives, unzip it and find connections/followers_and_following/following.json.",
  "Load that file here. It never leaves your device.",
];

/** Returns true if this importer recognises the parsed JSON. */
export function detect(json) {
  if (Array.isArray(json)) return json.some((e) => e?.string_list_data || e?.title !== undefined);
  if (json && typeof json === "object") {
    return Array.isArray(json.relationships_following) || Array.isArray(json.following);
  }
  return false;
}

export function parse(json) {
  let entries = [];
  if (Array.isArray(json)) entries = json;
  else if (Array.isArray(json?.relationships_following)) entries = json.relationships_following;
  else if (Array.isArray(json?.following)) entries = json.following;

  const out = [];
  for (const e of entries) {
    const sld = Array.isArray(e?.string_list_data) ? e.string_list_data[0] : null;
    const handle = (sld?.value || e?.title || e?.username || e?.value || "").trim();
    if (!handle) continue;
    const ts = sld?.timestamp ?? e?.timestamp ?? null;
    out.push({
      platform: id,
      handle,
      url: sld?.href || e?.href || `https://www.instagram.com/${handle}/`,
      followedAt: ts ? new Date(Number(ts) * 1000).toISOString() : null,
    });
  }
  // De-dupe by handle, keep first occurrence.
  const seen = new Set();
  return out.filter((a) => (seen.has(a.handle) ? false : seen.add(a.handle)));
}

/** Deep link that opens the profile in the Instagram app on mobile, web otherwise. */
export function openUrl(account) {
  return account.url || `https://www.instagram.com/${account.handle}/`;
}
