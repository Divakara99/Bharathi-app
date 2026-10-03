"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeEnvironment = () => () => {};
const installEligible = () => window.isSecureContext && window.self === window.top;
const standaloneSnapshot = () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const serverSnapshot = () => false;
function subscribeStandalone(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => { displayMode.removeEventListener("change", callback); window.removeEventListener("appinstalled", callback); };
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallApp() {
  const eligible = useSyncExternalStore(subscribeEnvironment, installEligible, serverSnapshot);
  const standalone = useSyncExternalStore(subscribeStandalone, standaloneSnapshot, serverSnapshot);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const isInstalled = standaloneSnapshot;
    const canInstall = installEligible();
    const modeChanged = () => { if (alive) setInstalled(isInstalled()); };
    const installAvailable = (event: Event) => {
      if (!canInstall || isInstalled()) return;
      event.preventDefault();
      if (alive) { setPrompt(event as InstallPromptEvent); setError(""); }
    };
    const appInstalled = () => { if (alive) { setInstalled(true); setPrompt(null); } };
    displayMode.addEventListener("change", modeChanged);
    window.addEventListener("beforeinstallprompt", installAvailable);
    window.addEventListener("appinstalled", appInstalled);

    let registration: ServiceWorkerRegistration | null = null;
    const updateWorker = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    };
    if (window.isSecureContext && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js?v=20261003", { scope: "/", updateViaCache: "none" }).then((registered) => {
        registration = registered;
        void registered.update().catch(() => {});
      }).catch(() => {});
      document.addEventListener("visibilitychange", updateWorker);
    }

    return () => {
      alive = false;
      displayMode.removeEventListener("change", modeChanged);
      window.removeEventListener("beforeinstallprompt", installAvailable);
      window.removeEventListener("appinstalled", appInstalled);
      document.removeEventListener("visibilitychange", updateWorker);
    };
  }, []);

  const install = async () => {
    if (busy || !prompt || !eligible || installed || standalone) return;
    setBusy(true); setError("");
    try {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } catch { setError("Could not open installation. Try again."); }
    finally { setBusy(false); }
  };

  // No help card or explanation when the native install prompt is unavailable.
  if (!eligible || installed || standalone || !prompt) return null;
  return <section aria-label="Install Bharathi Enterprises" data-testid="pwa-install" className="flex flex-wrap items-center justify-end gap-2">
    <button type="button" onClick={() => void install()} disabled={busy} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white active:bg-indigo-800 disabled:opacity-60">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" /></svg>
      {busy ? "Opening…" : "Install app"}
    </button>
    {error && <p role="status" className="text-xs text-rose-700">{error}</p>}
  </section>;
}
