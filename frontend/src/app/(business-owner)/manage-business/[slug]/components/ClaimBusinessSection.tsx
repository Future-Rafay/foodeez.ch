"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, CheckCircle2, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import ModalPortal from "@/components/core/ModalPortal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClaimBusinessSection({ businessId, businessName }: { businessId: number; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/claim-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessId, businessName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Your claim request has been submitted.");
      setEmail("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Quick verification by the Foodeez team</p>
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
              <p id="claim-description" className="mt-2 text-gray-600">Please enter your official business email. Our team will contact you after reviewing your request.</p>
              <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="claim-email" className="mb-2 block text-sm font-medium text-gray-900">Official email</label>
                  <Input id="claim-email" type="email" autoComplete="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@business.com" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" className="h-auto rounded-full border-primary px-6 py-2.5 font-semibold text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="h-auto rounded-full bg-primary px-6 py-2.5 font-semibold text-white shadow-md hover:bg-primary-dark" disabled={submitting}>{submitting ? "Submitting..." : "Submit claim"}</Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
