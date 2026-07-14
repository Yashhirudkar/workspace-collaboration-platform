"use client";

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import swagger-ui-react to bypass Next.js SSR build checks
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-3 bg-slate-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs font-medium text-slate-500">Loading Swagger UI...</span>
    </div>
  ),
});

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/openapi" />
    </div>
  );
}
