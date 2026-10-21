"use client";

import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type InstallState = "page" | "embedded";

function environment() {
  if (typeof window === "undefined") {
    return { standalone: true, iosSafari: false, android: false, embedded: false };
  }
  const ua = navigator.userAgent || "";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const ios = /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iosSafari = ios && /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua);
  const android = /Android/i.test(ua);
  const embedded =
    /WhatsApp|Instagram|FBAN|FBAV|Messenger|Line|Twitter|TikTok|Snapchat/i.test(ua) ||
    (android && ua.includes("; wv)"));
  return { standalone, iosSafari, android, embedded };
}

export default function PwaRegister({
  initialEmbedded = false,
  initialAndroid = false,
}: {
  initialEmbedded?: boolean;
  initialAndroid?: boolean;
}) {
  const [offline, setOffline] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const installPromptRef = useRef<InstallPromptEvent | null>(null);
  const [nativeInstallAvailable, setNativeInstallAvailable] = useState(false);
  const [installCardDismissed, setInstallCardDismissed] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installState, setInstallState] = useState<InstallState>(initialEmbedded ? "embedded" : "page");
  const [embeddedAndroid, setEmbeddedAndroid] = useState(initialEmbedded && initialAndroid);
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const embeddedActionRef = useRef<HTMLButtonElement | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const env = environment();
    const embedded = initialEmbedded || env.embedded;
    setIosSafari(env.iosSafari);
    setEmbeddedAndroid((initialEmbedded && initialAndroid) || (env.embedded && env.android));

    if (env.standalone) {
      setInstallState("page");
      setInstallCardDismissed(true);
    } else if (embedded) {
      setInstallState("embedded");
    }

    const online = () => {
      setOffline(false);
      setReconnecting(true);
      window.setTimeout(() => setReconnecting(false), 1200);
    };
    const off = () => {
      setReconnecting(false);
      setOffline(true);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      if (environment().standalone) return;
      event.preventDefault();
      installPromptRef.current = event as InstallPromptEvent;
      setNativeInstallAvailable(true);
      setInstallCardDismissed(false);
    };
    const appInstalled = () => {
      installPromptRef.current = null;
      setNativeInstallAvailable(false);
      setInstallCardDismissed(true);
      setIosGuideOpen(false);
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", off);

    // Adopt an event captured before React hydration; preserve the browser's
    // one-shot event so the branded button can invoke prompt() from its click.
    const promptWindow = window as Window & {
      __yusufInstallPrompt?: Event;
      __yusufPwaListenerReady?: boolean;
    };
    promptWindow.__yusufPwaListenerReady = true;
    const earlyPrompt = promptWindow.__yusufInstallPrompt;
    if (earlyPrompt) {
      delete promptWindow.__yusufInstallPrompt;
      onBeforeInstallPrompt(earlyPrompt);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", appInstalled);

    let registration: ServiceWorkerRegistration | null = null;
    const inspect = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) {
        setUpdateReady(registration.waiting);
      }
    };
    const register = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        inspect();
        registration.addEventListener("updatefound", () => {
          const worker = registration?.installing;
          if (!worker) return;
          worker.addEventListener("statechange", inspect);
        });
        await registration.update();
        inspect();
      } catch {
        // The app remains usable if service-worker registration is unavailable.
      }
    };

    void register();
    const controllerChange = () => {
      if (reloadForUpdate.current) window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChange);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", appInstalled);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChange);
    };
  }, [initialEmbedded, initialAndroid]);

  useEffect(() => {
    if (installState !== "embedded") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    embeddedActionRef.current?.focus();
    const keepDialogFocused = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        embeddedActionRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keepDialogFocused, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keepDialogFocused, true);
    };
  }, [installState]);

  function installFromClick() {
    const prompt = installPromptRef.current;
    if (!prompt) return;
    // Call the native browser prompt immediately inside the user's click handler.
    void prompt.prompt()
      .then(() => prompt.userChoice)
      .catch(() => undefined)
      .finally(() => {
        installPromptRef.current = null;
        setNativeInstallAvailable(false);
        setInstallCardDismissed(true);
      });
  }

  function dismissInstallCard() {
    setInstallCardDismissed(true);
    setIosGuideOpen(false);
  }

  function openBrowser() {
    const url = window.location.href;
    const env = environment();
    if (env.android) {
      window.location.href = "intent://" + url.replace("https://", "").replace("http://", "") + "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function applyUpdate() {
    reloadForUpdate.current = true;
    if (updateReady) {
      try {
        updateReady.postMessage({ type: "SKIP_WAITING" });
      } catch {
        // Navigation below remains the recovery path.
      }
    }
    window.setTimeout(() => {
      if (reloadForUpdate.current) window.location.reload();
    }, 1800);
  }

  const env = environment();
  const showInstallCard = !env.standalone &&
    installState !== "embedded" &&
    !installCardDismissed &&
    (nativeInstallAvailable || iosSafari);

  return (
    <>
      {offline && (
        <div className="offlineBanner" role="status" aria-live="polite">
          <span aria-hidden="true">⚡</span> Offline · Previously viewed pages may be available on this device. New requests and account changes need a connection.
        </div>
      )}
      {!offline && reconnecting && (
        <div className="offlineBanner reconnectingBanner" role="status" aria-live="polite">
          <span aria-hidden="true">↻</span> Reconnected · Checking for the latest catalogue and request information.
        </div>
      )}

      {showInstallCard && (
        <aside className="yusufInstallCard" aria-label="Install Yusuf Clothing Line">
          <div className="yusufInstallBrand">
            <span className="yusufInstallMark" aria-hidden="true">Y</span>
            <span className="yusufInstallBrandText">
              <strong>YUSUF CLOTHING LINE</strong>
              <small>TAILORING · BOTSWANA</small>
            </span>
          </div>
          <button
            className="yusufInstallClose"
            type="button"
            aria-label="Dismiss installation card"
            onClick={dismissInstallCard}
          >
            ×
          </button>
          {iosSafari && !nativeInstallAvailable && iosGuideOpen && (
            <p className="yusufInstallGuide" role="status">
              In Safari, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
            </p>
          )}
          <button
            className="yusufInstallAction"
            type="button"
            onClick={() => {
              if (installPromptRef.current) {
                installFromClick();
              } else if (iosSafari) {
                setIosGuideOpen((open) => !open);
              }
            }}
          >
            Install Yusuf Clothing Line <span aria-hidden="true">↗</span>
          </button>
        </aside>
      )}

      {installState === "embedded" && (
        <div
          className="yusufEmbeddedGate"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="yusuf-embedded-title"
          aria-describedby="yusuf-embedded-message"
        >
          <div className="pwaInstallInfo">
            <div>
              <strong id="yusuf-embedded-title">OPEN YUSUF CLOTHING LINE IN YOUR BROWSER</strong>
              <span id="yusuf-embedded-message">
                {embeddedAndroid
                  ? <>Open this page in Chrome to use the full website experience.</>
                  : <>Yusuf Clothing Line opened inside another app. Use that app’s menu to open this page in your browser.</>}
              </span>
            </div>
            <div className="pwaInstallActions">
              <button ref={embeddedActionRef} type="button" onClick={openBrowser}>
                {embeddedAndroid ? "OPEN IN CHROME" : "OPEN IN BROWSER"}
              </button>
            </div>
          </div>
        </div>
      )}

      {updateReady && (
        <div className="pwaUpdate" role="status" aria-live="polite">
          <div>
            <strong>Yusuf Clothing Line update is ready</strong>
            <span>Refresh when you are ready.</span>
          </div>
          <button type="button" className="yusufPwaUpdateButton" onClick={applyUpdate}>Refresh</button>
        </div>
      )}
    </>
  );
}
