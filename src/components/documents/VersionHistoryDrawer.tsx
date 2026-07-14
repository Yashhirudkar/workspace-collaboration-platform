"use client";

import { useEffect } from 'react';
import { X, Clock, RefreshCw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DocumentVersion } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  isLoading: boolean;
  onRestoreSelect: (version: DocumentVersion) => void;
  onCreateSnapshot: () => void;
  fetchVersions: () => void;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function VersionHistoryDrawer({
  open,
  onClose,
  versions,
  isLoading,
  onRestoreSelect,
  onCreateSnapshot,
  fetchVersions,
}: Props) {
  // Reload versions when drawer is opened
  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fetchVersions]);

  return (
    <aside
      className={`fixed top-0 right-0 z-40 h-screen w-80 border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Version history drawer"
    >
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Version History
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Manual Snapshot Control */}
      <div className="p-4 border-b border-border bg-muted/10">
        <Button
          id="create-snapshot-btn"
          onClick={onCreateSnapshot}
          className="w-full text-xs gap-1.5 justify-center"
          size="sm"
        >
          <Camera className="h-4 w-4" />
          Create Local Snapshot
        </Button>
      </div>

      {/* Version List Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {isLoading && versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading version logs…
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs">
            No snapshots captured yet.
          </div>
        ) : (
          versions.map((ver) => (
            <Card
              key={ver.id}
              className="p-3.5 hover:bg-muted/30 cursor-pointer transition-colors relative group"
              onClick={() => onRestoreSelect(ver)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-foreground">
                  Version #{ver.versionNumber}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(ver.createdAt)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Author: {ver.createdBy ? 'System/Collaborator' : 'You'}
              </p>
              
              {/* Hover action overlay */}
              <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4 rounded-lg pointer-events-none">
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                  Restore this
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </aside>
  );
}
