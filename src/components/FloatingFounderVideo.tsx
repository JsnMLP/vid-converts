"use client";

import { useState, useEffect } from "react";

export default function FloatingFounderVideo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Slide in after 2.5s so it doesn't compete with page load
  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isDismissed) return null;

  const VIDEO_ID = "CuIW-DHR2Rs";

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        transition-all duration-500 ease-out
        ${hasLoaded ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}
      `}
      style={{ fontFamily: "'Mulish', sans-serif" }}
    >
      {/* Collapsed pill — shown when video is not open */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-3 rounded-full pl-2 pr-5 py-2 shadow-2xl cursor-pointer border border-white/10 hover:border-[#00FFB2]/40 transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #0d1f1a 0%, #0a1a16 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,178,0.08)",
          }}
        >
          {/* Pulsing VC logo */}
          <div className="relative flex-shrink-0">
            {/* Outer pulse ring */}
            <div
              className="absolute -inset-1 rounded-full animate-ping opacity-25"
              style={{ background: "#00FFB2", animationDuration: "2s" }}
            />
            {/* Second slower pulse for depth */}
            <div
              className="absolute -inset-0.5 rounded-full animate-ping opacity-15"
              style={{ background: "#00FFB2", animationDuration: "3s", animationDelay: "0.5s" }}
            />
            <img
              src="/VC_logo.png"
              alt="Vid Converts"
              className="relative w-11 h-11 rounded-full object-cover"
            />
          </div>

          {/* Text */}
          <div className="text-left">
            <p
              className="text-xs font-black tracking-wide leading-tight"
              style={{
                color: "#00FFB2",
                fontFamily: "'Encode Sans Expanded', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.08em",
              }}
            >
              WHY I BUILT VID CONVERTS
            </p>
            <p className="text-white/70 text-xs leading-tight mt-0.5" style={{ fontSize: "11px" }}>
              Watch — short video →
            </p>
          </div>
        </button>
      )}

      {/* Expanded card */}
      {isExpanded && (
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            width: "300px",
            background: "linear-gradient(145deg, #0d1f1a 0%, #091510 100%)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,178,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/5"
          >
            <div>
              <p
                className="font-black tracking-widest text-[10px]"
                style={{
                  color: "#00FFB2",
                  fontFamily: "'Encode Sans Expanded', sans-serif",
                  letterSpacing: "0.1em",
                }}
              >
                WHY I BUILT VID CONVERTS
              </p>
              <p className="text-white/40 text-[11px] mt-0.5" style={{ fontWeight: 700 }}>
                for you — from Jason
              </p>
            </div>
            <button
              onClick={() => {
                setIsExpanded(false);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
              aria-label="Collapse"
            >
              ↓
            </button>
          </div>

          {/* YouTube Short embed — vertical 9:16 */}
          <div
            className="relative w-full"
            style={{ paddingBottom: "177.78%" /* 9:16 */ }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
              title="Why Vid Converts was built for you"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Footer CTA */}
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-white/40 text-[11px]" style={{ fontWeight: 700 }}>
              Ready to see what's killing your conversions?
            </p>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-white/25 hover:text-white/50 text-[10px] transition-colors ml-3 flex-shrink-0"
              aria-label="Dismiss"
            >
              ✕ close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
