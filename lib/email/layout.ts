// SERVER-SIDE email HTML helpers — shared branded shell + escaping.
// Email clients need inline styles and table layouts, so everything here is
// deliberately inline. YOYOSO brand teal: #1BA89B → #2BC4B6.

const BRAND_TEAL = "#1BA89B";
const BRAND_TEAL_LIGHT = "#2BC4B6";
const TEXT = "#1a1a1a";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

/** Escape user-supplied text before interpolating into email HTML. */
export function esc(input: unknown): string {
  const s = typeof input === "string" ? input : String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format an ISO date string as e.g. "12 Jun 2026". Falls back to the raw input. */
export function formatEmailDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Wrap body HTML in the branded YOYOSO shell (teal header + footer). `preheader`
 * is the hidden inbox-preview snippet.
 */
export function emailLayout(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
}): string {
  const { title, preheader = "", bodyHtml } = opts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_TEAL} 0%,${BRAND_TEAL_LIGHT} 100%);padding:28px 32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;letter-spacing:3px;color:#ffffff;">YOYOSO</span>
              <div style="font-size:12px;letter-spacing:2px;color:#ffffff;opacity:.9;margin-top:2px;">LEBANON</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BORDER};text-align:center;color:${MUTED};font-size:12px;">
              YOYOSO Lebanon · Delivered across Lebanon<br />
              This is an automated message — please don't reply unless invited to.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_COLORS = { BRAND_TEAL, BRAND_TEAL_LIGHT, TEXT, MUTED, BORDER };
