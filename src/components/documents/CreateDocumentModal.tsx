"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import type { Document } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (doc: Document) => void;
}

export function CreateDocumentModal({ open, onClose, onCreated }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const doc = await documentService.create({ title: data.title, content: {} });
      toast({ title: 'Document created', variant: 'default' });
      reset();
      onCreated(doc);
    } catch {
      toast({ title: 'Failed to create document', variant: 'destructive' });
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-xl shadow-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="create-doc-desc"
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-semibold text-base">New Document</Dialog.Title>
            <Dialog.Close asChild>
              <button
                id="create-doc-close"
                aria-label="Close dialog"
                className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description id="create-doc-desc" className="sr-only">
            Enter a title to create a new document
          </Dialog.Description>

          <form id="create-doc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-doc-title">Document Title</Label>
              <Input
                id="new-doc-title"
                placeholder="Untitled Document"
                autoFocus
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="create-doc-form" className="flex-1" loading={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
