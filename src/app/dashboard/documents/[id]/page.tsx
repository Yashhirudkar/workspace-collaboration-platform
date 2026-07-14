"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { documentService } from '@/services/documents';
import { idbService } from '@/services/indexeddb.service';
import { autosaveService } from '@/services/autosave.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSocket } from '@/hooks/useSocket';
import { usePresence } from '@/hooks/usePresence';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { Editor } from '@/components/documents/Editor';
import { PresenceBar } from '@/components/documents/PresenceBar';
import { VersionHistoryDrawer } from '@/components/documents/VersionHistoryDrawer';
import { RestoreDialog } from '@/components/documents/RestoreDialog';
import { DocumentToolbar } from '@/components/documents/DocumentToolbar';
import { toast } from '@/hooks/useToast';
import type { Document, DocumentVersion } from '@/types';

export default function DocumentPage() {
  const params = useParams() as { id: string } | null;
  const id = params?.id || '';
  const isOnline = useNetworkStatus();

  // Socket and Realtime Collaboration Hooks
  const { connectionState, latency, socket } = useSocket();
  const { collaborators, broadcastCursor } = usePresence(socket, id);

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  // Version History state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRestoreVersion, setSelectedRestoreVersion] = useState<DocumentVersion | null>(null);

  const { status: saveStatus, triggerSave, setStatus: setSaveStatus } = useAutoSave(id, isOnline, document);

  // Callback to handle remote changes without feedback loops
  const handleRemoteChange = useCallback((update: { title?: string; content?: Record<string, unknown> }) => {
    if (update.title !== undefined) setTitle(update.title);
    if (update.content !== undefined) setContent(update.content);
  }, []);

  const { broadcastChange } = useRealtimeDocument(socket, id, handleRemoteChange);
  const { versions, isLoading: isVersionsLoading, isRestoring, fetchVersions, createSnapshot, restoreVersion } = useVersionHistory(id);

  // 1. Initial Load: Local-First (IDB first, then fresh backend load)
  useEffect(() => {
    async function loadDocument() {
      try {
        const cachedDoc = await idbService.getDocument(id);
        if (cachedDoc) {
          setDocument(cachedDoc);
          setTitle(cachedDoc.title);
          setContent(cachedDoc.content);
          setLastSynced(cachedDoc.updatedAt);
          setIsLoading(false);
        }

        if (navigator.onLine) {
          const freshDoc = await documentService.get(id);
          setDocument(freshDoc);
          setTitle(freshDoc.title);
          setContent(freshDoc.content);
          setLastSynced(freshDoc.updatedAt);
          await idbService.saveDocument(freshDoc);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        if (!document) {
          toast({ 
            title: 'Offline mode active', 
            description: 'Loaded local cached copy of this document.', 
            variant: 'default' 
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 2. Network Sync: process sync queue when returning online
  useEffect(() => {
    if (isOnline && id) {
      const syncPending = async () => {
        setIsSyncingQueue(true);
        setSaveStatus('saving');
        try {
          await autosaveService.processSyncQueue((syncedDoc) => {
            if (syncedDoc.id === id) {
              setDocument(syncedDoc);
              setTitle(syncedDoc.title);
              setContent(syncedDoc.content);
              setLastSynced(syncedDoc.updatedAt);
            }
          });
          setSaveStatus('saved');
        } catch (err) {
          console.error('Sync queue processing failed:', err);
        } finally {
          setIsSyncingQueue(false);
        }
      };
      syncPending();
    }
  }, [isOnline, id, setSaveStatus]);

  // 3. User Modification Handlers (Save + Broadcast updates)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = e.target.value;
    setTitle(nextTitle);
    triggerSave(nextTitle, content);
    broadcastChange(nextTitle, content);
  };

  const handleContentChange = (nextContent: Record<string, unknown>) => {
    setContent(nextContent);
    triggerSave(title, nextContent);
    broadcastChange(title, nextContent);
  };

  // 4. Version snapshot and restoration triggers
  const handleCreateSnapshot = async () => {
    await createSnapshot();
  };

  const handleConfirmRestore = async () => {
    if (!selectedRestoreVersion) return;
    const restoredOp = await restoreVersion(selectedRestoreVersion.id);
    
    if (restoredOp) {
      // Rollback editor workspace content and title programmatically
      const rolledContent = restoredOp.payload?.content || {};
      const rolledTitle = restoredOp.payload?.title || 'Restored Document';
      
      setContent(rolledContent);
      setTitle(rolledTitle);
      
      // Auto-save changes locally and broadcast rollbacks instantly to active peers
      triggerSave(rolledTitle, rolledContent);
      broadcastChange(rolledTitle, rolledContent);
      
      setSelectedRestoreVersion(null);
      setIsDrawerOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded w-2/3 mt-6" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded mt-4" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-lg font-semibold mb-2">Document not found</h2>
        <p className="text-muted-foreground text-sm mb-6">This document may have been deleted or you don&apos;t have access.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isViewer = document.role === 'VIEWER';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative space-y-4">
      {/* Dynamic Document Toolbar */}
      <DocumentToolbar
        document={document}
        onUpdate={setDocument}
        saveStatus={saveStatus}
        isSyncingQueue={isSyncingQueue}
        connectionState={connectionState}
        latency={latency}
        onHistoryOpen={() => setIsDrawerOpen(true)}
        lastSynced={lastSynced}
      />

      {/* Document header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/documents" passHref>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/45 hover:bg-muted shrink-0" aria-label="Go Back">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <Input
            id="doc-title-input"
            value={title}
            onChange={handleTitleChange}
            disabled={isViewer}
            className="text-2xl font-bold border-0 border-b border-transparent hover:border-border focus-visible:border-border focus-visible:ring-0 rounded-none px-0 h-auto py-1 bg-transparent"
            aria-label="Document title"
            placeholder="Untitled Document"
          />
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {document.role && (
            <Badge variant={document.role === 'OWNER' ? 'default' : 'secondary'} className="text-xs">
              {document.role}
            </Badge>
          )}
        </div>
      </div>

      {/* Editor Component */}
      <div className="w-full">
        <Editor
          content={content}
          onChange={handleContentChange}
          editable={!isViewer}
          onSelection={broadcastCursor}
        />
      </div>

      {/* Slide-out Version history timeline drawer */}
      <VersionHistoryDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        versions={versions}
        isLoading={isVersionsLoading}
        onRestoreSelect={(ver) => setSelectedRestoreVersion(ver)}
        onCreateSnapshot={handleCreateSnapshot}
        fetchVersions={fetchVersions}
      />

      {/* Confirmation Restore Dialog Modal */}
      <RestoreDialog
        open={selectedRestoreVersion !== null}
        versionNumber={selectedRestoreVersion?.versionNumber || null}
        onClose={() => setSelectedRestoreVersion(null)}
        onConfirm={handleConfirmRestore}
        isRestoring={isRestoring}
      />
    </div>
  );
}
