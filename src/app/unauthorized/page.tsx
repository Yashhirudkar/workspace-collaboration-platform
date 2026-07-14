import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export const metadata = {
  title: '403 — Unauthorized',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-6">
        <ShieldX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">403</h1>
      <p className="text-muted-foreground text-lg mb-1">Access denied</p>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
