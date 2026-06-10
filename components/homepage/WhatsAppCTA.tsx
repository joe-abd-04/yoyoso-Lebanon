"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { buildSupportWhatsAppUrl } from "@/lib/whatsapp";
import { useContactInfo } from "@/components/shared/SettingsProvider";

export default function WhatsAppCTA() {
  const contact = useContactInfo();
  const waUrl = buildSupportWhatsAppUrl(contact.whatsapp);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #20B2A5 0%, #25d366 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-14 text-center text-white sm:px-8 md:flex-row md:justify-between md:text-left">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            We&apos;re here for you
          </p>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Have a Question? Chat With Us
          </h2>
          <p className="mt-2 text-base text-white/85">
            Our team is here to help with any questions about our products or your order.
          </p>
          <p className="mt-4 text-2xl font-bold tracking-wide sm:text-3xl">
            {contact.phone}
          </p>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex w-full flex-col items-center gap-4 md:w-auto"
        >
          <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/20 md:flex">
            <MessageCircle size={40} strokeWidth={1.5} className="text-white" />
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-[12px] bg-white px-7 py-3.5 text-base font-bold text-[#1BA89B] shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl md:w-auto"
          >
            <MessageCircle size={20} />
            Chat on WhatsApp
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
