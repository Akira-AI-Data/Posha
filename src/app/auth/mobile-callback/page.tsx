'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Landing page for mobile OAuth callback.
// Chrome Custom Tab redirects here after Google sign-in.
// The session cookie is set by NextAuth on myposha.com domain.
// The app detects browserFinished and navigates to /dashboard.
export default function MobileCallbackPage() {
  useEffect(() => {
    // Attempt to close the Custom Tab via window.close (unreliable but harmless)
    window.close();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in… returning to app</p>
    </div>
  );
}
