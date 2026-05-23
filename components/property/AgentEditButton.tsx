"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useClientAuth } from "@/components/providers/ClientAuthProvider";
import { cn } from "@/lib/utils";

interface AgentEditButtonProps {
  listingId: string;
  agentId: string;   // owner of this listing
}

export function AgentEditButton({ listingId, agentId }: AgentEditButtonProps) {
  const { user } = useClientAuth();
  const isOwner = user?.id === agentId;

  return (
    <AnimatePresence>
      {isOwner && (
        <motion.div
          key="edit-btn"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 12 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link
            href={`/agent/listings/${listingId}/edit`}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl",
              "bg-gold-500 hover:bg-gold-400 active:bg-gold-600",
              "text-white text-sm font-semibold",
              "transition-colors ring-2 ring-white/30",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300"
            )}
          >
            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
            Editar propiedad
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
