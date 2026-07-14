import { redirect } from 'next/navigation';

// Root "/" redirects to /dashboard.
// Unauthenticated users will be caught by useRequireAuth in the dashboard layout.
export default function HomePage() {
  redirect('/dashboard');
}
