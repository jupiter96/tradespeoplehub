import BidPlan from '../models/BidPlan.js';

const DEFAULT_PLANS = [
  { name: 'Basic', bids: 2, amountPence: 500, order: 1 },
  { name: 'Standard', bids: 5, amountPence: 1000, order: 2 },
  { name: 'Premium', bids: 15, amountPence: 1500, order: 3 },
];

export async function ensureDefaultBidPlans() {
  const count = await BidPlan.countDocuments();
  if (count > 0) return;

  await BidPlan.insertMany(DEFAULT_PLANS.map((p) => ({ ...p, active: true, validityMonths: 1 })));
  console.info('Seeded default bid plans (Basic, Standard, Premium).');
}
