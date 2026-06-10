"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Mail, MessageCircle, ChevronDown, Check } from "lucide-react";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { useContactInfo } from "@/components/shared/SettingsProvider";
import { cn } from "@/lib/utils";
import { contactSchema, SUBJECTS, type ContactInput } from "@/lib/validation";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";
import { submitContactMessage } from "@/app/contact/actions";

// ── Social icons (lucide v1 dropped brand icons) ──────────────────────────────

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "We deliver within 4 working days across all of Lebanon.",
  },
  {
    q: "How much does delivery cost?",
    a: "Delivery is a flat rate of $4.50 anywhere in Lebanon.",
  },
  {
    q: "How do I place an order?",
    a: "Browse our website, add items to your cart, and complete checkout. For assistance, reach us on WhatsApp.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 14 days of delivery. Items must be unused, in original condition, and in original packaging with all tags intact.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept Cash on Delivery only. You pay when your order arrives.",
  },
  {
    q: "Do you deliver all across Lebanon?",
    a: "Yes! We deliver to all regions across Lebanon for a flat rate of $4.50.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="pr-4 font-medium text-text-primary">{q}</span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-text-secondary">{a}</p>
      )}
    </div>
  );
}

// ── Contact form ──────────────────────────────────────────────────────────────

function fieldCls(hasError: boolean) {
  return cn(
    "w-full rounded-button border bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
    hasError ? "border-primary" : "border-border focus:border-primary",
  );
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-primary">{msg}</p>;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ContactView() {
  const contact = useContactInfo();
  const waUrl = `https://wa.me/${getWhatsAppNumber(contact.whatsapp)}`;
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const { honeypotRef, check, recordSubmit } = useBotGuard({ formId: "contact" });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    // Client bot signals (honeypot / too-fast / throttle). Reject silently: show
    // the same success UI so bots get no feedback, but never call the server.
    if (!check().ok) {
      setSubmitted(true);
      reset();
      return;
    }
    recordSubmit();

    // Persist via the server action: re-validates, rate-limits per IP, sanitises
    // and saves to the contact_messages table.
    const result = await submitContactMessage({
      ...data,
      hp: honeypotRef.current?.value ?? "",
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setSubmitted(true);
    reset();
  });

  return (
    <div>
      {/* Hero */}
      <div
        className="py-12 text-white"
        style={{
          background: "linear-gradient(135deg, #1BA89B 0%, #2BC4B6 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <nav className="mb-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Contact Us</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-lg text-white/90">
            We&apos;d love to hear from you!
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">

        {/* ── Section 1: Contact cards ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* WhatsApp */}
          <div className="flex flex-col items-center rounded-card border border-border bg-white p-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10">
              <MessageCircle size={24} className="text-[#25D366]" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-text-primary">
              Chat on WhatsApp
            </h3>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {contact.phone}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Fastest way to reach us
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-button bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle size={15} />
              Start Chat
            </a>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center rounded-card border border-border bg-white p-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Phone size={24} className="text-primary" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-text-primary">
              Call Us
            </h3>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {contact.phone}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Available during store hours
            </p>
          </div>

          {/* Email */}
          <div className="flex flex-col items-center rounded-card border border-border bg-white p-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail size={24} className="text-primary" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-text-primary">
              Email Us
            </h3>
            <p className="mt-1 break-all text-base font-semibold text-text-primary">
              {contact.email}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              We&apos;ll reply within 24 hours
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-5 inline-flex items-center gap-2 rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <Mail size={15} />
              Send Email
            </a>
          </div>
        </div>

        {/* ── Section 2: Contact form ── */}
        <div className="mt-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Send Us a Message
            </h2>
            <p className="mt-2 text-text-secondary">
              Fill in the form and we&apos;ll get back to you as soon as
              possible.
            </p>

            <div className="mt-8">
              {submitted ? (
                <div className="rounded-card border border-green-200 bg-green-50 px-6 py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <p className="mt-4 font-heading text-lg font-bold text-green-800">
                    Message sent! We&apos;ll get back to you soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
                  <Honeypot inputRef={honeypotRef} />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        Full Name{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        maxLength={100}
                        className={fieldCls(!!errors.fullName)}
                        {...register("fullName")}
                      />
                      <ErrMsg msg={errors.fullName?.message} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        Email Address{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="your@email.com"
                        maxLength={254}
                        className={fieldCls(!!errors.email)}
                        {...register("email")}
                      />
                      <ErrMsg msg={errors.email?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        Phone Number{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+961 XX XXX XXX"
                        maxLength={30}
                        className={fieldCls(!!errors.phone)}
                        {...register("phone")}
                      />
                      <ErrMsg msg={errors.phone?.message} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        Subject{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <select
                        className={fieldCls(!!errors.subject)}
                        defaultValue=""
                        {...register("subject")}
                      >
                        <option value="">Select a subject…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ErrMsg msg={errors.subject?.message} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="How can we help you?"
                      maxLength={2000}
                      className={cn(fieldCls(!!errors.message), "resize-none")}
                      {...register("message")}
                    />
                    <ErrMsg msg={errors.message?.message} />
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="rounded-button border border-[#FF7A6B]/40 bg-[#FF7A6B]/10 px-3 py-2.5 text-sm font-medium text-[#C0392B]"
                    >
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 w-full items-center justify-center rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Visit our stores ── */}
        <div className="mt-16 rounded-card bg-surface px-6 py-10 text-center">
          <h2 className="font-heading text-2xl font-bold text-primary">
            Visit Our Stores
          </h2>
          <p className="mt-2 text-text-secondary">
            Find us at any of our 5 locations across Lebanon
          </p>
          <Link
            href="/stores"
            className="mt-6 inline-flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            View All Stores
          </Link>
        </div>

        {/* ── Section 4: Follow us ── */}
        {/* TODO: update social handles to YOYOSO Lebanon when new accounts are created */}
        <div className="mt-16 text-center">
          <h2 className="font-heading text-2xl font-bold text-primary">
            Follow Us
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/bestforlebanon/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-button border border-border px-5 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <InstagramIcon size={18} />
              @bestforlebanon
            </a>
            <a
              href="https://www.facebook.com/bestforlebanon/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-button border border-border px-5 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <FacebookIcon size={18} />
              Best For Lebanon
            </a>
          </div>
        </div>

        {/* ── Section 5: FAQ ── */}
        <div className="mt-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 divide-y divide-border rounded-card border border-border bg-white p-6">
              {FAQS.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
