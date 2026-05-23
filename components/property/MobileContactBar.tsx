"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuickContactModal } from "@/components/search/QuickContactModal";
import { formatPrice } from "@/lib/utils";

interface MobileContactBarProps {
  price: number;
  currency: string;
  listingId: string;
  listingTitle: string;
  agentId: string;
  agentName: string | null;
  agentWhatsApp: string | null;
  agentAvatarUrl: string | null;
}

export function MobileContactBar({
  price,
  currency,
  listingId,
  listingTitle,
  agentId,
  agentName,
  agentWhatsApp,
  agentAvatarUrl,
}: MobileContactBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div>
          <p className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 leading-none">
            {formatPrice(price, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{currency}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setOpen(true)}>
          Contactar
        </Button>
      </div>

      <QuickContactModal
        open={open}
        onOpenChange={setOpen}
        listingId={listingId}
        listingTitle={listingTitle}
        agentId={agentId}
        agentName={agentName}
        agentWhatsApp={agentWhatsApp}
        agentAvatarUrl={agentAvatarUrl}
      />
    </>
  );
}
