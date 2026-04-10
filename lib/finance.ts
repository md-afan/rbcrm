import type { LeadRecord } from "@/types/crm";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getFinalDealAmount(
  dealAmount: number | null | undefined,
  discountGiven: number | null | undefined
) {
  if (dealAmount === null || dealAmount === undefined) {
    return null;
  }

  const safeDiscount = Math.min(Math.max(discountGiven ?? 0, 0), 100);
  return roundCurrency(dealAmount - (dealAmount * safeDiscount) / 100);
}

export function getBalanceAmount(
  lead: Pick<LeadRecord, "deal_amount" | "discount_given" | "advance_amount" | "balance_amount">
) {
  if (lead.balance_amount !== null && lead.balance_amount !== undefined) {
    return lead.balance_amount;
  }

  const finalAmount = getFinalDealAmount(lead.deal_amount, lead.discount_given);

  if (finalAmount === null) {
    return null;
  }

  return roundCurrency(finalAmount - (lead.advance_amount ?? 0));
}

export function isCommissionEligible(
  lead: Pick<LeadRecord, "deal_closed" | "payment_status" | "deal_amount">
) {
  return lead.deal_closed === true && lead.deal_amount !== null;
}
