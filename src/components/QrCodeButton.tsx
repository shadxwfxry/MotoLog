"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeButtonProps {
  vehicleId: string;
  vehicleName: string;
}

export function QrCodeButton({ vehicleId, vehicleName }: QrCodeButtonProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/api/external/vehicle/${vehicleId}`);
    }
  }, [vehicleId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-center text-xs text-foreground bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 py-3 rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" />
          <rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" />
          <path d="M21 16V21H16" />
          <path d="M21 12H16V16" />
          <path d="M12 21V16H16" />
          <path d="M12 12H9V9H12Z" />
          <path d="M3 12H9" />
          <path d="M12 3V9" />
        </svg>
        {t("qr_for_tournament") || "QR для Турнира"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border/80 shadow-2xl p-6 flex flex-col items-center gap-5 relative animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200"
              aria-label={t("close") || "Close"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            {/* Header info */}
            <div className="text-center space-y-1 mt-2">
              <h3 className="text-lg font-black tracking-tight uppercase text-foreground">
                {t("qr_for_tournament") || "QR для Турнира"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {vehicleName}
              </p>
            </div>

            {/* QR Code Container (Safe White Card for maximum scan accuracy) */}
            {qrUrl && (
              <div className="bg-white p-5 rounded-2xl shadow-xl flex items-center justify-center border border-white/10 hover:scale-[1.02] transition-transform duration-300">
                <QRCodeSVG
                  value={qrUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
            )}

            {/* URL Display and Quick Copy */}
            <div className="w-full flex flex-col items-center gap-2 mt-1">
              <div className="w-full bg-muted/60 border border-border/50 rounded-xl px-3 py-2 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-[10px] text-muted-foreground truncate font-mono select-all">
                  {qrUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                  title="Copy link"
                >
                  {copied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  )}
                </button>
              </div>
              {copied && (
                <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest animate-pulse">
                  {t("link_copied") || "Link copied!"}
                </span>
              )}
            </div>

            {/* Footer advice */}
            <div className="text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold uppercase tracking-wider transition-colors duration-200"
              >
                {t("close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
