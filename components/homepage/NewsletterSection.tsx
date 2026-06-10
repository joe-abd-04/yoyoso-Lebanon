"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { newsletterSchema } from "@/lib/validation";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const showToast = useUIStore((s) => s.showToast);
  const { honeypotRef, check, recordSubmit } = useBotGuard({ formId: "newsletter" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate + length-cap the email before doing anything with it.
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    // Bot signals → pretend success, do nothing.
    if (!check().ok) {
      setEmail("");
      showToast("You're subscribed! Watch your inbox.", "success");
      return;
    }
    recordSubmit();
    showToast("You're subscribed! Watch your inbox.", "success");
    setEmail("");
  };

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail size={26} strokeWidth={1.75} className="text-primary" />
          </div>
          <h2 className="font-heading text-[26px] font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Get Exclusive Deals
          </h2>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            Subscribe and be the first to know about new arrivals and special offers
          </p>

          <form
            onSubmit={handleSubmit}
            className="relative mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <Honeypot inputRef={honeypotRef} />
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address"
              className="w-full flex-1 rounded-button border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-md"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              Subscribe
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="mt-4 text-xs text-text-secondary">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
