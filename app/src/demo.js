// Fictional accounts for trying the app without an export. None of these are real.
const names = [
  "haul.heaven.daily", "quietmountainpottery", "the.hustle.oracle", "mutualaid_sd",
  "glamgetaways", "bikerepairco_op", "dramawatch247", "slowfood_tita", "crypto.king.lux",
  "neighborhood.garden", "notlikeotherinfluencers", "weekendwoodshop", "flash.sale.finds",
  "birdsofbajacalifornia", "mindset.millionaire", "andeantextileproject",
];

export function demoAccounts() {
  const now = Date.now();
  return names.map((handle, i) => ({
    platform: "instagram",
    handle,
    url: `https://www.instagram.com/${handle}/`,
    followedAt: new Date(now - (i + 1) * 37 * 86400000).toISOString(),
  }));
}
