import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '404 — Page Not Found',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-6">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-muted-foreground text-lg mb-1">Page not found</p>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Go to Dashboard
      </Link>
    </div>
  );
}
