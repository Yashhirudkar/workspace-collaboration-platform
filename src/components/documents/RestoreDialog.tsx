"use client";

import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  versionNumber: number | null;
  onClose: () => void;
  onConfirm: () => void;
  isRestoring: boolean;
}

export function RestoreDialog({ open, versionNumber, onClose, onConfirm, isRestoring }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Modal content */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background border border-border rounded-xl shadow-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
          aria-describedby="restore-dialog-desc"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <Dialog.Title className="font-semibold text-base">Restore Version</Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 focus:outline-none"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p id="restore-dialog-desc" className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to restore **Version #{versionNumber}**? This will replace the current active document content with the snapshot state.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-xs"
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 text-xs bg-amber-600 text-white hover:bg-amber-700"
              loading={isRestoring}
            >
              Confirm Restore
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
