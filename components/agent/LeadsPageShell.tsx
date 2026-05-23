"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LeadsTable } from "@/components/agent/LeadsTable";
import { useToast } from "@/components/providers/ToastProvider";
import type { Lead, LeadStatus } from "@/lib/supabase/types";

export interface LeadsPageShellProps {
  leads: Lead[];
}

export function LeadsPageShell({ leads }: LeadsPageShellProps) {
  const router = useRouter();
  const { addToast } = useToast();

  async function onUpdateStatus(leadId: string, status: LeadStatus) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", leadId);

    if (error) {
      addToast("Error al actualizar", { variant: "error", description: error.message });
      return;
    }
    router.refresh();
  }

  async function onMarkRead(leadId: string) {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("leads").update({ read: true }).eq("id", leadId);
    router.refresh();
  }

  return (
    <LeadsTable
      leads={leads}
      onUpdateStatus={onUpdateStatus}
      onMarkRead={onMarkRead}
    />
  );
}
