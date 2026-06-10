"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const MESSAGES = [
  "✨ New arrivals every week!",
  "💬 Questions? Chat with us: +961 3 133 307",
  "🌟 Aesthetic. Fashionable. Affordable.",
];

const INTERVAL_MS = 3000;
const FADE_MS = 300;

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        setFading(false);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="relative flex h-9 w-full items-center justify-center bg-primary px-10">
      <p
        className="text-center text-sm font-medium text-white transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {MESSAGES[index]}
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
