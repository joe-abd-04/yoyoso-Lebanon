/**
 * Price formatting for YOYOSO (USD display only).
 * LBP is kept in the data model for WhatsApp messages but not shown in UI.
 */

export function formatUSD(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatLBP(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " LL";
}
