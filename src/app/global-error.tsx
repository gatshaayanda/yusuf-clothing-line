"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const details = "Yusuf Clothing Line application error\n" + (error.message || "Unknown application error") + (error.digest ? "\nDigest: " + error.digest : "") + "\nTime: " + new Date().toISOString();
  return (
    <html lang="en"><body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#F8F5F0", color: "#24201F" }}>
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <section style={{ maxWidth: 680, width: "100%", background: "#fff", border: "1px solid #e2d8cf", padding: 30 }}>
          <strong style={{ color: "#6B2636", letterSpacing: ".12em" }}>YUSUF CLOTHING LINE</strong>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}>Something did not complete</h1>
          <p>Try again. If the problem continues, the technical details below can help us investigate it.</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#F8F5F0", padding: 14, fontSize: 12 }}>{details}</pre>
          <button onClick={reset} style={{ padding: "11px 17px", border: 0, background: "#6B2636", color: "#fff", fontWeight: 800 }}>Try again</button>
        </section>
      </main>
    </body></html>
  );
}
