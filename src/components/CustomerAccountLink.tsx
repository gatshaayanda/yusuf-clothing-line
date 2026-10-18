"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  linkWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function CustomerAccountLink({ user, requestsCount }: { user: User; requestsCount: number }) {
  const [mode, setMode] = useState<"link" | "signin">("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password.length < (mode === "link" ? 8 : 6)) {
      setError(mode === "link" ? "Use a password with at least 8 characters." : "Enter your account password.");
      return;
    }
    if (mode === "signin" && user.isAnonymous && requestsCount > 0) {
      setError("This browser has requests in a temporary guest session. Signing into a different account will not transfer them. Link this session to a new email address or contact Yusuf before switching accounts.");
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "link") {
        if (!user.isAnonymous) {
          setMessage("This account is already linked. Use the same email and password on another device.");
          return;
        }
        const linked = await linkWithCredential(user, EmailAuthProvider.credential(email.trim(), password));
        setPassword("");
        try {
          await sendEmailVerification(linked.user);
          setMessage("Your account is linked to this request history. Check your email for a verification link; you can now sign in on another device.");
        } catch {
          setMessage("Your account is linked to this request history. Email verification could not be sent just now, but you can still sign in on another device.");
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setPassword("");
        setMessage("Signed in. Your saved requests are loading.");
      }
    } catch (cause) {
      const code = (cause as { code?: string })?.code || "";
      if (code === "auth/email-already-in-use" || code === "auth/credential-already-in-use") {
        setError("That email already belongs to an account. Switch to sign in only if this browser has no guest requests; otherwise contact Yusuf before switching so your request history is not left behind.");
      } else if (code === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Choose a stronger password with at least 8 characters.");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("The email or password was not recognized.");
      } else if (code === "auth/operation-not-allowed") {
        setError("Email/password accounts are not enabled in Firebase yet. Enable the Email/Password provider before linking or signing in.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Wait a little and try again.");
      } else {
        setError("The account action could not be completed. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    setError(""); setMessage(""); setMode("signin");
    try { await signOut(auth); }
    catch { setError("We could not switch accounts right now. Please retry."); }
  }

  return (
    <section className="yusufAccountSecurity">
      <p className="yusufEyebrow">ACCOUNT ACCESS</p>
      {!user.isAnonymous ? (
        <div className="yusufAccountLinked">
          <strong>Account linked</strong>
          <p>Signed in as {user.email || "your email account"}. Your saved requests are attached to this account.</p>
          <button type="button" onClick={() => void switchAccount()}>Switch account</button>
        </div>
      ) : (
        <>
          <div className="yusufAccountMode" role="group" aria-label="Account action">
            <button type="button" aria-pressed={mode === "link"} onClick={() => { setMode("link"); setError(""); setMessage(""); }}>Link this request history</button>
            <button type="button" aria-pressed={mode === "signin"} onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>Sign in to an account</button>
          </div>
          <p>{mode === "link" ? "Add an email and password to preserve this guest session and access the same requests on another device." : "Sign in with an account you linked previously. Guest requests in this browser cannot be transferred automatically."}</p>
          <form onSubmit={submit}>
            <label>Email address<input type="email" autoComplete="email" required maxLength={200} value={email} onChange={event => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete={mode === "link" ? "new-password" : "current-password"} required minLength={mode === "link" ? 8 : 6} value={password} onChange={event => setPassword(event.target.value)} /></label>
            <button className="yusufAccountSecuritySubmit" type="submit" disabled={busy}>{busy ? "Working…" : mode === "link" ? "Link account and keep history" : "Sign in"}</button>
          </form>
        </>
      )}
      {message && <p className="yusufAccountNotice" role="status">{message}</p>}
      {error && <p className="yusufAccountError" role="alert">{error}</p>}
    </section>
  );
}
