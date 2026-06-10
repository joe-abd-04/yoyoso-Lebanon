import type { Metadata } from "next";
import ContactView from "@/components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact Us | YOYOSO",
  description:
    "Get in touch with YOYOSO Lebanon. Chat on WhatsApp, call us, or send us a message.",
};

export default function ContactPage() {
  return <ContactView />;
}
