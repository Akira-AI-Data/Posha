import { Loader2 } from 'lucide-react';

// Target for mobile OAuth redirect after Google sign-in via Chrome Custom Tab.
// The session cookie is already set on this domain by the time this page renders.
// The Capacitor app detects this URL via browserPageLoaded, calls Browser.close(),
// then navigates to /dashboard where the session is active.
export default function MobileCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in&hellip;</p>
    </div>
  );
}
