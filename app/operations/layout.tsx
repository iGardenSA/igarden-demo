"use client";

import { DemoAuthProvider, useDemoAuth } from "@/app/components/DemoAuthContext";
import { LoginScreen } from "@/app/components/LoginScreen";

/**
 * Auth gate for everything under /operations — wraps with RC-2's DemoAuthProvider
 * so the local demo / demo credentials gate the entire HMI surface. Auth state
 * is shared with RC-2's / (compliance) via the same localStorage key, so the
 * user logs in once and both surfaces unlock together.
 */
export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoAuthProvider>
      <Gate>{children}</Gate>
    </DemoAuthProvider>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { signedIn, ready } = useDemoAuth();
  if (!ready) return null;            // first paint while reading localStorage
  if (!signedIn) return <LoginScreen />;
  return <>{children}</>;
}
