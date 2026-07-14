"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { autosaveService } from '@/services/autosave.service';
import type { Document } from '@/types';

export type SaveStatus = 'saved' | 'saving' | 'offline';

export function useAutoSave(
  documentId: string,
  isOnline: boolean,
  existingDoc: Document | null
) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const triggerSave = useCallback((title: string, content: Record<string, unknown>) => {
    setStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const nextStatus = await autosaveService.save(
          documentId,
          title,
          content,
          isOnline,
          existingDoc
        );
        setStatus(nextStatus);
      } catch (error) {
        console.error('Autosave hook failed:', error);
        setStatus('offline'); // fallback to offline state since local save is guaranteed
      }
    }, 500); // 500ms debounce
  }, [documentId, isOnline, existingDoc]);

  return { status, triggerSave, setStatus };
}
