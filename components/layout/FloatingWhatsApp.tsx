"use client";

import { MessageCircle } from "lucide-react";
import { buildSupportWhatsAppUrl } from "@/lib/whatsapp";
import { useContactInfo } from "@/components/shared/SettingsProvider";

// WhatsApp is a support/questions channel — not for placing orders.
export default function FloatingWhatsApp() {
  const { whatsapp } = useContactInfo();
  return (
    <a
      href={buildSupportWhatsAppUrl(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="animate-whatsapp-ping fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-white shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95"
    >
      <MessageCircle size={22} className="shrink-0" />
      <span className="hidden text-sm font-medium sm:inline">Need Help?</span>
    </a>
  );
}
