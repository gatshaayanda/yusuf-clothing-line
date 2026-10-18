"use client";

import Link from "next/link";
import CustomerAccountLink from "@/components/CustomerAccountLink";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

type CustomerRequest = {
  id: string; customerId: string; serviceName: string; garmentType: string; status: string;
  quoteStatus: string; quoteAmount?: number | null; quoteNotes?: string; quoteAcceptedAmount?: number;
  paymentStatus: string; depositRequired?: number | null; depositPaid?: number | null;
  productionStage: string; fittingDate?: string; dueDate?: string; collectionMethod?: string;
  createdAt: string; updatedAt: string; notes?: string;
};

const statusLabels: Record<string, string> = {
  new: "Request received", reviewing: "Being reviewed", awaiting_customer: "Waiting for your reply",
  quote_ready: "Quote ready to review", quote_accepted: "Quote accepted · awaiting order confirmation",
  confirmed: "Order confirmed", in_production: "In production", ready_for_fitting: "Ready for fitting",
  alterations: "Alterations in progress", ready_for_collection: "Ready for collection",
  completed: "Work completed", collected: "Collected", cancelled: "Cancelled"
};
const stageLabels: Record<string, string> = {
  not_started: "Not started", awaiting_fabric: "Awaiting fabric", cutting: "Cutting",
  sewing: "Sewing", fitting: "Fitting", alterations: "Alterations",
  quality_check: "Quality check", ready_for_collection: "Ready for collection",
  collected: "Collected", cancelled: "Cancelled"
};

export default function CustomerAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!hasFirebaseWebConfig) {
      setLoading(false);
      setError("Your account service is not configured yet. Requests cannot be loaded until Firebase is configured.");
      return;
    }
    let creatingSession = false;
    const stop = onAuthStateChanged(auth, next => {
      if (next) {
        setUser(next);
        setLoading(false);
        return;
      }
      if (creatingSession) return;
      creatingSession = true;
      void signInAnonymously(auth).catch(() => {
        setLoading(false);
        setError("We couldn't open this device's private account session. Check your connection and retry.");
      }).finally(() => { creatingSession = false; });
    });
    return () => stop();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const stop = onSnapshot(query(collection(db, "tailoringRequests"), where("customerId", "==", user.uid)), snapshot => {
      setRequests(snapshot.docs.map(item => ({ id: item.id, ...item.data() as Omit<CustomerRequest, "id"> })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
      setError("");
    }, () => {
      setLoading(false);
      setError("Your requests could not be loaded. Check your connection and try again.");
    });
    return () => stop();
  }, [user]);

  async function acceptQuote(item: CustomerRequest) {
    if (!user || busyId) return;
    setBusyId(item.id); setError(""); setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/tailoring-request/accept-quote", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: item.id })
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The quote could not be accepted.");
      setMessage("Quote accepted. Yusuf still needs to confirm the order and any deposit or fitting arrangements.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The quote could not be accepted. Please retry.");
    } finally { setBusyId(""); }
  }

  return (
    <main className="yusufAccountPage">
      <header className="yusufAccountHeader">
        <Link href="/" className="yusufWordmark"><span className="yusufLogoMark" aria-hidden="true"><span /></span><span><strong>YUSUF</strong><small>CLOTHING LINE</small></span></Link>
        <Link href="/request" className="yusufHeaderCta">New request <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="yusufAccountIntro">
        <p className="yusufEyebrow">YOUR PRIVATE SPACE</p>
        <h1>Your requests.<br /><em>Your fit.</em></h1>
        <p>Review your requests, quotations, fitting dates and recorded progress in one place.</p>
        {user?.isAnonymous && <small>This session starts privately on this device. Link an email and password below to keep this request history accessible across devices.</small>}
      </section>
      {message && <p className="yusufAccountNotice" role="status">{message}</p>}
      {error && <p className="yusufAccountError" role="alert">{error}</p>}
      <section className="yusufAccountRequests">
        {loading && <p className="yusufAccountEmpty">Loading your private requests…</p>}
        {!loading && !error && requests.length === 0 && <div className="yusufAccountEmpty"><strong>Nothing here just yet.</strong><p>Start a tailoring request and your saved brief and updates will appear here.</p><Link href="/request">Start a request ↗</Link></div>}
        {requests.map(item => (
          <article className="yusufAccountRequest" key={item.id}>
            <div className="yusufAccountRequestHead"><div><small>REQUEST / {item.id.slice(0, 8).toUpperCase()}</small><h2>{item.serviceName}</h2><p>{item.garmentType}</p></div><span className={"yusufAccountStatus status-" + item.status}>{statusLabels[item.status] || item.status}</span></div>
            <div className="yusufAccountRequestMeta"><span>Submitted {new Date(item.createdAt).toLocaleDateString()}</span><span>Production: {stageLabels[item.productionStage] || item.productionStage}</span>{item.fittingDate && <span>Fitting: {item.fittingDate}</span>}{item.dueDate && <span>Due: {item.dueDate}</span>}</div>
            {item.quoteAmount != null && <div className="yusufAccountQuote"><div><small>QUOTATION</small><strong>P{item.quoteAmount.toLocaleString("en-BW", { maximumFractionDigits: 2 })}</strong></div><p>{item.quoteNotes || "Review the quoted amount and details before accepting."}</p></div>}
            {item.quoteStatus === "ready" && item.status === "quote_ready" && <div className="yusufAccountQuoteActions"><p>Accepting records your agreement to this quoted amount. The order is not confirmed until Yusuf confirms the next steps.</p><button type="button" disabled={busyId === item.id} onClick={() => void acceptQuote(item)}>{busyId === item.id ? "Recording acceptance…" : "Accept this quote"}</button></div>}
            {item.quoteStatus === "accepted" && <p className="yusufAccountAccepted">Quote acceptance recorded{item.quoteAcceptedAmount != null ? " for P" + item.quoteAcceptedAmount.toLocaleString("en-BW", { maximumFractionDigits: 2 }) : ""}. {item.status === "quote_accepted" ? "Waiting for order confirmation." : item.status === "cancelled" ? "This request is cancelled." : "Yusuf has recorded the next order status below."}</p>}
            {(item.depositRequired != null || item.depositPaid != null) && <div className="yusufAccountPayment"><span>Deposit required <strong>{item.depositRequired == null ? "Not set" : "P" + item.depositRequired.toLocaleString("en-BW")}</strong></span><span>Recorded as received <strong>{item.depositPaid == null ? "P0" : "P" + item.depositPaid.toLocaleString("en-BW")}</strong></span><span>Payment status <strong>{item.paymentStatus.replaceAll("_", " ")}</strong></span></div>}
            {item.collectionMethod && item.collectionMethod !== "not_set" && <p className="yusufAccountCollection">Collection / delivery: {item.collectionMethod}</p>}
          </article>
        ))}
      </section>
      <CustomerAccountLink user={user} requestsCount={requests.length} />
      <footer className="yusufAccountFooter"><Link href="/">Back to the studio</Link><span>Requests are not confirmed orders until the business records confirmation.</span></footer>
    </main>
  );
}
