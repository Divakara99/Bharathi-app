import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PIN = "9676";

/**
 * Clean a PIN so harmless differences don't cause a false "Wrong PIN":
 * surrounding quotes, spaces, and full-width digits (９６７６) from some keyboards.
 */
export function normalizePin(raw: string | null | undefined): string {
  if (!raw) return "";
  let v = raw.normalize("NFKC").trim();
  // values pasted as "9676" or '9676' into a dashboard
  if (v.length >= 2 && /^(["'`]).*\1$/.test(v)) v = v.slice(1, -1);
  return v.replace(/\s+/g, "");
}

// PIN required before anything can be deleted.
// Set DELETE_PIN in your environment (e.g. on Vercel) to change it.
// Read on every call so a changed setting is always honoured.
function expectedPin(): string {
  return normalizePin(process.env.DELETE_PIN) || DEFAULT_PIN;
}

export function isValidPin(pin: string | null | undefined): boolean {
  const given = normalizePin(pin);
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expectedPin());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Verify the supplied value before any database mutation. */
export function checkDeletePin(value: unknown): NextResponse | null {
  if (typeof value !== "string" || !normalizePin(value)) {
    return NextResponse.json(
      { error: "The PIN was not received. Please enter it again.", code: "PIN_REQUIRED" },
      { status: 400 },
    );
  }
  if (isValidPin(value)) return null;
  return NextResponse.json(
    { error: "Wrong PIN. Try again.", code: "WRONG_PIN" },
    { status: 403 },
  );
}

/** Keep the original DELETE APIs PIN-protected for existing clients. */
export function requirePin(req: NextRequest): NextResponse | null {
  return checkDeletePin(req.headers.get("x-delete-pin"));
}
