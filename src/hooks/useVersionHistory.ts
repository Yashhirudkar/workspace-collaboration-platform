"use client";

import { useState, useCallback } from 'react';
import { versionClientService } from '@/services/version.client';
import type { DocumentVersion } from '@/types';
import { toast } from '@/hooks/useToast';

export function useVersionHistory(documentId: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await versionClientService.getHistory(documentId);
      setVersions(history);
    } catch {
      toast({ title: 'Failed to load version history', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const createSnapshot = useCallback(async () => {
    try {
      const newVersion = await versionClientService.snapshot(documentId);
      setVersions((prev) => [newVersion, ...prev]);
      toast({ title: 'Snapshot created', description: `Version #${newVersion.versionNumber} saved.`, variant: 'default' });
      return newVersion;
    } catch {
      toast({ title: 'Failed to create snapshot', variant: 'destructive' });
      return null;
    }
  }, [documentId]);

  const restoreVersion = useCallback(async (versionId: string) => {
    setIsRestoring(true);
    try {
      const response = await versionClientService.restore(documentId, versionId);
      toast({ title: 'Success', description: 'Document restored successfully.', variant: 'default' });
      return response;
    } catch {
      toast({ title: 'Failed to restore version', variant: 'destructive' });
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [documentId]);

  return {
    versions,
    isLoading,
    isRestoring,
    fetchVersions,
    createSnapshot,
    restoreVersion,
  };
}
