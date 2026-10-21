/**
 * A button that copies a piece of text and says so (Fundraising S5, lane S5-UI-J).
 */

"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CopyTextButtonProps {
  text: string;
  label: string;
  /** What the toast calls the copied text, e.g. "Pay Bill details". */
  what: string;
}

export function CopyTextButton({ text, label, what }: CopyTextButtonProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error(`Could not copy the ${what.toLowerCase()}`);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <Copy className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
