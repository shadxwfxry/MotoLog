"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { Modal } from "@/shared/ui";

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
        className="btn h-11 w-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20"
      >
        <QrCode size={15} strokeWidth={2.4} />
        {t("qr_for_tournament")}
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("qr_for_tournament")}
        className="max-w-sm"
      >
        <div className="flex flex-col items-center gap-5">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {vehicleName}
          </p>

          {/* The code itself stays on a hard white plate regardless of theme —
              scanners need the contrast, and a tinted QR is a broken QR. */}
          {qrUrl && (
            <div className="rounded-lg bg-white p-5 shadow-[0_0_60px_-12px_hsl(var(--primary))]">
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

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 [border-color:hsl(var(--hairline))]">
              <span className="num select-all truncate text-[10px] text-muted-foreground">
                {qrUrl}
              </span>
              <button
                onClick={handleCopy}
                title="Copy link"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {copied ? (
                  <Check size={13} strokeWidth={3} className="text-signal-lime" />
                ) : (
                  <Copy size={13} strokeWidth={2.4} />
                )}
              </button>
            </div>

            {copied && (
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-signal-lime">
                {t("link_copied")}
              </p>
            )}
          </div>

          <button onClick={() => setIsOpen(false)} className="btn-ghost h-11 w-full">
            {t("close")}
          </button>
        </div>
      </Modal>
    </>
  );
}
