"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, FileText, LayoutDashboard, User as UserIcon, Mail, 
  Sparkles, FolderOpen, ArrowRight, Star, Pin, Database, 
  Clock, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Document } from '@/types';
import { CreateDocumentModal } from '@/components/documents/CreateDocumentModal';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/useWorkspace';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [favorites, setFavorites] = useState<Document[]>([]);
  const [pinned, setPinned] = useState<Document[]>([]);
  const [recent, setRecent] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Storage metric states
  const [storageUsage, setStorageUsage] = useState(0); // in KB
  const [storageLimit, setStorageLimit] = useState(1024 * 50); // mock 50MB quota standard fallback

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allDocs, favs, pins, recents] = await Promise.all([
        documentService.list(),
        documentService.getFavorites(),
        documentService.getPinned(),
        documentService.getRecent()
      ]);
      setDocuments(allDocs);
      setFavorites(favs);
      setPinned(pins);
      setRecent(recents);

      // Fetch actual browser quota estimation dynamically
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageKB = Math.round((estimate.usage || 0) / 1024);
        const quotaKB = Math.round((estimate.quota || 1024 * 1024 * 50) / 1024);
        setStorageUsage(usageKB);
        setStorageLimit(quotaKB);
      }
    } catch {
      toast({ title: 'Failed to fetch dashboard metrics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Real-time workspace event subscriptions ──────────────────────────────
  useWorkspace({
    onDocumentCreated: ({ document }) => {
      setDocuments(prev => [document, ...prev]);
      setRecent(prev => [document, ...prev.slice(0, 19)]);
    },
    onDocumentDeleted: ({ documentId }) => {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setFavorites(prev => prev.filter(d => d.id !== documentId));
      setPinned(prev => prev.filter(d => d.id !== documentId));
      setRecent(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentPermanentlyDeleted: ({ documentId }) => {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setFavorites(prev => prev.filter(d => d.id !== documentId));
      setPinned(prev => prev.filter(d => d.id !== documentId));
      setRecent(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentRestored: ({ document }) => {
      setDocuments(prev => {
        if (prev.some(d => d.id === document.id)) return prev;
        return [document, ...prev];
      });
    },
    onDocumentUpdated: ({ documentId, changes }) => {
      const applyChanges = (d: Document) =>
        d.id === documentId ? { ...d, ...changes } : d;
      setDocuments(prev => prev.map(applyChanges));
      setFavorites(prev => prev.map(applyChanges));
      setPinned(prev => prev.map(applyChanges));
      setRecent(prev => prev.map(applyChanges));
    },
    onDocumentFavorited: ({ documentId, isFavorite }) => {
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, isFavorite } : d));
      if (isFavorite) {
        const doc = documents.find(d => d.id === documentId);
        if (doc) setFavorites(prev => prev.some(d => d.id === documentId) ? prev : [...prev, { ...doc, isFavorite: true }]);
      } else {
        setFavorites(prev => prev.filter(d => d.id !== documentId));
      }
    },
    onDocumentPinned: ({ documentId, isPinned }) => {
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, isPinned } : d));
      if (isPinned) {
        const doc = documents.find(d => d.id === documentId);
        if (doc) setPinned(prev => prev.some(d => d.id === documentId) ? prev : [...prev, { ...doc, isPinned: true }]);
      } else {
        setPinned(prev => prev.filter(d => d.id !== documentId));
      }
    },
  });

  // Group Recent Documents by chronological age segments
  const getGroupedRecent = () => {
    const today: Document[] = [];
    const yesterday: Document[] = [];
    const last7Days: Document[] = [];
    const lastMonth: Document[] = [];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    recent.forEach(doc => {
      const docDate = new Date(doc.updatedAt);
      const diffTime = now.getTime() - docDate.getTime();
      const diffDays = Math.floor(diffTime / oneDay);

      if (diffDays === 0 && docDate.getDate() === now.getDate()) {
        today.push(doc);
      } else if (diffDays <= 1) {
        yesterday.push(doc);
      } else if (diffDays <= 7) {
        last7Days.push(doc);
      } else {
        lastMonth.push(doc);
      }
    });

    return { today, yesterday, last7Days, lastMonth };
  };

  const { today, yesterday, last7Days, lastMonth } = getGroupedRecent();
  const storagePercentage = Math.min(100, Math.round((storageUsage / storageLimit) * 100)) || 1;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Welcome Dashboard Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/65 backdrop-blur-md p-6 rounded-xl border border-border/80">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              Welcome back, {user?.name.split(' ')[0] || 'User'}! <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Docflow workspace coordination overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sync Connection:</span>
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px] py-0.5 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online Mode
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px] py-0.5 animate-pulse font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Offline Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Dashboard Grid Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Files Card */}
          <Card className="bg-card/45 hover:bg-card transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Total Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-extrabold tracking-tight">{isLoading ? '...' : documents.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Active files in workspace</p>
            </CardContent>
          </Card>

          {/* Favorites Card */}
          <Card className="bg-card/45 hover:bg-card transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-extrabold tracking-tight">{isLoading ? '...' : favorites.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Starred files for quick launch</p>
            </CardContent>
          </Card>

          {/* Pinned Card */}
          <Card className="bg-card/45 hover:bg-card transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-primary fill-primary rotate-45" /> Pinned
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-extrabold tracking-tight">{isLoading ? '...' : pinned.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Workspaces anchored on top</p>
            </CardContent>
          </Card>

          {/* Storage Estimate Card */}
          <Card className="bg-card/45 hover:bg-card transition-colors">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-500" /> Local Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-extrabold tracking-tight">
                {isLoading ? '...' : `${storageUsage} KB`}
              </p>
              <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/80 mt-1 flex justify-between">
                <span>IndexedDB usage</span>
                <span>Quota: {Math.round(storageLimit / 1024)} MB</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors border-dashed border-2 bg-card/10"
            onClick={() => setIsCreateOpen(true)}
          >
            <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary border shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs truncate">New Document</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Start editing a canvas</p>
            </div>
          </Card>

          <Card 
            className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors border-dashed border-2 bg-card/10"
            onClick={() => router.push('/dashboard/favorites')}
          >
            <div className="h-10 w-10 bg-amber-500/5 rounded-lg flex items-center justify-center text-amber-500 border shrink-0">
              <Star className="h-5 w-5 fill-amber-500/10" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs truncate">Starred Board</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Browse favorite documents</p>
            </div>
          </Card>

          <Card 
            className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors border-dashed border-2 bg-card/10"
            onClick={() => router.push('/dashboard/trash')}
          >
            <div className="h-10 w-10 bg-destructive/5 rounded-lg flex items-center justify-center text-destructive border shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs truncate">Open Trash Bin</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Review soft-deleted files</p>
            </div>
          </Card>
        </div>

        {/* Chronological Recent Activity List */}
        <Card className="bg-card/45">
          <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Recent Activities
              </CardTitle>
              <CardDescription className="text-[10px]">Your history of document opens and edits</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading recent logs...</div>
            ) : recent.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-6 w-6 text-muted-foreground/50 animate-bounce" />
                No document opens tracked yet. Open a document to start logging activity.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {/* TODAY */}
                {today.length > 0 && (
                  <div className="bg-muted/30 px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/80">Today</div>
                )}
                {today.map(doc => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-semibold text-foreground truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground/80">Active {formatDate(doc.updatedAt)}</span>
                  </Link>
                ))}

                {/* YESTERDAY */}
                {yesterday.length > 0 && (
                  <div className="bg-muted/30 px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/80">Yesterday</div>
                )}
                {yesterday.map(doc => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-semibold text-foreground truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground/80">Active {formatDate(doc.updatedAt)}</span>
                  </Link>
                ))}

                {/* LAST 7 DAYS */}
                {last7Days.length > 0 && (
                  <div className="bg-muted/30 px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/80">Last 7 Days</div>
                )}
                {last7Days.map(doc => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-semibold text-foreground truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground/80">Active {formatDate(doc.updatedAt)}</span>
                  </Link>
                ))}

                {/* LAST MONTH */}
                {lastMonth.length > 0 && (
                  <div className="bg-muted/30 px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/80">Older Items</div>
                )}
                {lastMonth.map(doc => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-semibold text-foreground truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground/80">Active {formatDate(doc.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateDocumentModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(doc) => {
          setIsCreateOpen(false);
          router.push(`/dashboard/documents/${doc.id}`);
        }}
      />
    </>
  );
}
