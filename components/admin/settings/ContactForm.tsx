"use client";

import { useState, useTransition } from "react";
import { Phone } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { updateContactInfo } from "@/app/admin/settings/actions";
import type { ContactInfo } from "@/lib/settings/shared";
import SettingsCard, {
  fieldClass,
  FieldError,
  FieldLabel,
  SaveButton,
} from "@/components/admin/settings/SettingsCard";

export default function ContactForm({ initial }: { initial: ContactInfo }) {
  const [phone, setPhone] = useState(initial.phone);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [email, setEmail] = useState(initial.email);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useUIStore((s) => s.showToast);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateContactInfo({ phone, whatsapp, email });
      if (res.ok) {
        showToast("Contact info updated.", "success");
      } else {
        setError(res.error);
        showToast(res.error, "error");
      }
    });
  };

  return (
    <SettingsCard
      title="Store contact info"
      description="Phone, WhatsApp and email shown around the site (header, footer, contact page)."
      icon={<Phone size={20} />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Phone (display)</FieldLabel>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03 133 307"
              maxLength={30}
              className={fieldClass()}
            />
          </div>
          <div>
            <FieldLabel>WhatsApp number (for wa.me link)</FieldLabel>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="96103133307"
              maxLength={30}
              className={fieldClass()}
            />
            <p className="mt-1 text-xs text-text-secondary">
              Full international digits, no “+”. e.g. 96103133307
            </p>
          </div>
        </div>
        <div className="sm:max-w-md">
          <FieldLabel>Email</FieldLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lebanon@bestfor-lb.com"
            maxLength={254}
            className={fieldClass(!!error)}
          />
          <FieldError msg={error} />
        </div>
        <div>
          <SaveButton pending={pending} />
        </div>
      </form>
    </SettingsCard>
  );
}
