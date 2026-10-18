"use client";

import { useState } from "react";

export default function AppErrorFallback({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [copied, setCopied] = useState(false);
  const details = (error.message || "Unknown application error") + (error.digest ? "\nDigest: " + error.digest : "") + "\nTime: " + new Date().toISOString();
  async function copyDetails() {
    try { await navigator.clipboard.writeText(details); setCopied(true); }
    catch { setCopied(false); }
  }
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F8F5F0", fontFamily: "Arial, sans-serif", color: "#24201F" }}>
      <section style={{ width: "min(640px,100%)", background: "#fff", border: "1px solid #e2d8cf", padding: 32 }}>
        <strong style={{ color: "#6B2636", fontSize: 13, letterSpacing: 1 }}>YUSUF CLOTHING LINE</strong>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}>Something did not complete</h1>
        <p>We could not finish this screen. Please try again. If the issue continues, the details below can help us investigate it.</p>
        <details><summary>Show technical details</summary><pre style={{ whiteSpace: "pre-wrap", overflow: "auto", fontSize: 12, background: "#F8F5F0", padding: 16 }}>{details}</pre></details>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <button onClick={reset} style={{ border: 0, padding: "12px 18px", background: "#6B2636", color: "#fff", fontWeight: 800 }}>Try again</button>
          <button onClick={copyDetails} style={{ border: "1px solid #d9cec4", padding: "12px 18px", background: "#fff", fontWeight: 800 }}>{copied ? "Copied" : "Copy details"}</button>
        </div>
      </section>
    </main>
  );
}
