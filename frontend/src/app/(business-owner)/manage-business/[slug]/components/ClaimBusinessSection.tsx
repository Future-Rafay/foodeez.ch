"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building2, CheckCircle2, ShieldCheck, X } from "lucide-react";
import ModalPortal from "@/components/core/ModalPortal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = { name: "start" } | { name: "code"; requestId: number; sentTo: string } | { name: "done"; manual: boolean };

const primaryButton = "h-auto rounded-full bg-primary px-6 py-2.5 font-semibold text-white shadow-md hover:bg-primary-dark";
const outlineButton = "h-auto rounded-full border-primary px-6 py-2.5 font-semibold text-primary hover:bg-primary/10 hover:text-primary";

export default function ClaimBusinessSection({ businessId, businessName }: { businessId: number; businessName: string }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ name: "start" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  async function send(body: Record<string, unknown>) {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/claim-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || result.message || "We couldn't process your claim. Please try again.");
      if (result.status === "email_pending") setStep({ name: "code", requestId: result.requestId, sentTo: result.sentTo });
      else setStep({ name: "done", manual: Boolean(result.manual) });
      setCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't process your claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startClaim(event: FormEvent) {
    event.preventDefault();
    void send({ action: "start", businessId });
  }

  function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (step.name === "code") void send({ action: "verify", requestId: step.requestId, code: code.trim() });
  }

  const description =
    status !== "authenticated"
      ? "Sign in or create a free Foodeez account first. The restaurant will be linked to that account."
      : step.name === "start"
        ? "We will send a 6-digit code to the email address this restaurant has on Foodeez. After you enter it, our team checks the claim and gives you access."
        : step.name === "code"
          ? `We sent a 6-digit code to ${step.sentTo}. It expires in 15 minutes.`
          : step.manual
            ? "This restaurant has no email on file, so our team will check your claim by hand and email you."
            : "Thank you. Your email is confirmed and our team will review your claim. We will email you once you have access.";

  return (
    <>
      <section className="relative mx-auto my-10 flex min-h-[280px] max-w-5xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-secondary/10 p-6 shadow-lg sm:p-10">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10" />
        <div className="relative flex w-full flex-col items-start justify-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-primary shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Business owner
            </span>
            <div className="flex items-start gap-4">
              <div className="hidden rounded-2xl bg-primary p-4 text-white shadow-md sm:block"><Building2 className="h-7 w-7" aria-hidden="true" /></div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Is this your business?</h2>
                <p className="mt-3 text-base leading-7 text-gray-600">Claim your profile to manage how {businessName} appears on Foodeez and keep your business information up to date.</p>
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Verified through your restaurant's email, then checked by the Foodeez team</p>
              </div>
            </div>
          </div>
          <Button className="h-auto w-full rounded-full bg-primary px-9 py-3.5 text-base font-semibold text-white shadow-md hover:bg-primary-dark sm:w-auto" onClick={() => setOpen(true)}>Claim it</Button>
        </div>
      </section>

      {open && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="claim-title" aria-describedby="claim-description" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
              <button type="button" aria-label="Close claim form" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><X aria-hidden="true" /></button>
              <h2 id="claim-title" className="pr-10 text-2xl font-semibold text-gray-900">Claim {businessName}</h2>
              <p id="claim-description" className="mt-2 text-gray-600">{description}</p>
              {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

              {status !== "authenticated" ? (
                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" className={outlineButton} onClick={() => setOpen(false)}>Cancel</Button>
                  <Button asChild className={primaryButton}>
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}>Sign in</Link>
                  </Button>
                </div>
              ) : step.name === "start" ? (
                <form onSubmit={startClaim} className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" className={outlineButton} onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className={primaryButton} disabled={submitting}>{submitting ? "Sending..." : "Send code"}</Button>
                </form>
              ) : step.name === "code" ? (
                <form onSubmit={verifyCode} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="claim-code" className="mb-2 block text-sm font-medium text-gray-900">Verification code</label>
                    <Input id="claim-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="123456" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" className="text-sm font-medium text-primary hover:underline disabled:opacity-50" disabled={submitting} onClick={() => void send({ action: "start", businessId })}>Send a new code</button>
                    <Button type="submit" className={primaryButton} disabled={submitting || code.length !== 6}>{submitting ? "Checking..." : "Confirm"}</Button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 flex justify-end">
                  <Button type="button" className={primaryButton} onClick={() => setOpen(false)} autoFocus>Done</Button>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
