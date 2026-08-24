"use client";

import { MobileSheet } from "@/components/mobile-sheet";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
};

export function ConfirmSheet({
  request,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <MobileSheet
      open={Boolean(request)}
      onClose={onCancel}
      title={request?.title ?? "Confirm"}
      footer={
        request ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="mk-touch flex-1 rounded-xl border border-border bg-background text-sm font-medium"
              onClick={onCancel}
            >
              {request.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              className={`mk-touch flex-1 rounded-xl text-sm font-medium ${
                request.tone === "danger"
                  ? "bg-red-600 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
              onClick={onConfirm}
            >
              {request.confirmLabel ?? "Confirm"}
            </button>
          </div>
        ) : null
      }
    >
      <p className="text-sm leading-6 text-muted-foreground">{request?.message}</p>
    </MobileSheet>
  );
}

export function NoticeSheet({
  title,
  message,
  open,
  onClose,
}: {
  title: string;
  message: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button
          type="button"
          className="mk-touch w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground"
          onClick={onClose}
        >
          OK
        </button>
      }
    >
      <p className="text-sm leading-6 text-muted-foreground">{message}</p>
    </MobileSheet>
  );
}
