"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, FileText, LayoutDashboard, User as UserIcon, Mail, ShieldAlert, Sparkles, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Document } from '@/types';
import { CreateDocumentModal } from '@/components/documents/CreateDocumentModal';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.list();
      setDocuments(docs);
    } catch {
      toast({ title: 'Failed to fetch dashboard metrics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // Extract top 5 recently edited documents
  const recentlyEdited = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-6 rounded-xl border border-border/80">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              Welcome back, {user?.name.split(' ')[0] || 'User'}! <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is what is happening in your collaborative workspace today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Connection:</span>
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px] py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px] py-0.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Offline Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Dashboard Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                Workspace Profile
              </CardTitle>
              <CardDescription>Authenticated user details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium">{user?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Count Metric */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-[120px] pt-2">
              <div>
                <p className="text-4xl font-extrabold tracking-tight">
                  {isLoading ? '...' : documents.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active files in cloud storage</p>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => window.location.href = '/dashboard/documents'}
                className="text-xs font-semibold p-0 h-auto justify-start text-primary group gap-1"
              >
                View all documents
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card 
              className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors border-dashed border-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary border">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Create New Document</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Start collaborating on a blank canvas</p>
              </div>
            </Card>

            <Card 
              className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors border-dashed border-2"
              onClick={() => window.location.href = '/dashboard/documents'}
            >
              <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary border">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Open File Library</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Browse, search, and manage existing files</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Recently Edited Section */}
        <Card>
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                Recently Edited Documents
              </CardTitle>
              <CardDescription>Your 5 most active files</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading file logs...</div>
            ) : recentlyEdited.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-6 w-6 text-muted-foreground/50" />
                No documents found. Create one to get started!
              </div>
            ) : (
              <div className="divide-y">
                {recentlyEdited.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/10 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/dashboard/documents/${doc.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{doc.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Edited {formatDate(doc.updatedAt)}
                    </span>
                  </div>
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
          window.location.href = `/dashboard/documents/${doc.id}`;
        }}
      />
    </>
  );
}
