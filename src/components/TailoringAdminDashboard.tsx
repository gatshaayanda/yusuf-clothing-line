"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, waitForPendingWrites, writeBatch
} from "firebase/firestore";
import { getBlob, ref } from "firebase/storage";
import { db, hasFirebaseWebConfig, storage } from "@/lib/firebase/client";

type ServiceRecord = {
  id: string; name: string; category: string; description: string; priceLabel: string;
  illustrativePrice: number | null; imageUrl: string; active: boolean; sortOrder: number;
  createdAt: string; updatedAt: string;
};
type RequestRecord = {
  id: string; customerId: string; customerName: string; phone: string; email: string;
  requestType: string; serviceId: string; serviceName: string; garmentType: string;
  stylePreferences: string; fabricPreferences: string; measurements: string;
  needsFittingHelp: boolean; preferredFittingDate: string;
  referenceImage: { storagePath: string; name: string; type: string; size: number } | null;
  notes: string; status: string; quoteStatus: string; paymentStatus: string;
  productionStage: string; quoteAmount?: number | null; quoteNotes?: string;
  depositRequired?: number | null; depositPaid?: number | null; dueDate?: string;
  fittingDate?: string; collectionMethod?: string; adminNotes?: string;
  createdAt: string; updatedAt: string;
};
type ServiceForm = {
  name: string; category: string; description: string; priceLabel: string;
  illustrativePrice: string; imageUrl: string; active: boolean; sortOrder: string;
};
type RequestDraft = {
  status: string; quoteStatus: string; paymentStatus: string; productionStage: string;
  quoteAmount: string; quoteNotes: string; depositRequired: string; depositPaid: string;
  dueDate: string; fittingDate: string; collectionMethod: string; adminNotes: string;
};

const seedServices = [
  { id: "custom-suits", name: "Custom suits", category: "Made to measure", description: "Formalwear shaped around your fit, fabric and occasion.", priceLabel: "Illustrative from P8,000", illustrativePrice: 8000, imageUrl: "", active: true, sortOrder: 10 },
  { id: "wedding-occasion-wear", name: "Wedding & occasion wear", category: "Occasion", description: "A considered look for the day that matters, from first fitting to final adjustments.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 20 },
  { id: "unisex-tailoring", name: "Unisex tailoring", category: "Made to measure", description: "Skirt suits, trouser suits and individual pieces designed around your preferences.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 30 },
  { id: "alterations-repairs", name: "Alterations & repairs", category: "Alterations", description: "Hems, sleeves, waist adjustments and fit corrections for garments you already own.", priceLabel: "Quote after assessment", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 40 },
  { id: "dresses-skirts", name: "Dresses & skirts", category: "Garments", description: "Made-to-measure dresses and skirts with your preferred silhouette and finishing.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 50 },
  { id: "corporate-wear", name: "Corporate & uniform wear", category: "Teams", description: "Discuss consistent fit, fabric and quantities for workwear or team uniforms.", priceLabel: "Quote by brief", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 60 }
];

const statusOptions = [
  ["new", "New request"], ["reviewing", "Reviewing"], ["awaiting_customer", "Awaiting customer"],
  ["quote_ready", "Quote ready"], ["confirmed", "Confirmed order"], ["in_production", "In production"],
  ["ready_for_fitting", "Ready for fitting"], ["alterations", "Alterations"], ["ready_for_collection", "Ready for collection"],
  ["completed", "Completed"], ["collected", "Collected"], ["cancelled", "Cancelled"]
];
const quoteOptions = [["not_quoted", "Not quoted"], ["ready", "Quote ready"], ["declined", "Declined"], ["accepted", "Accepted by customer"]];
const paymentOptions = [["unpaid", "Unpaid"], ["deposit_pending", "Deposit pending"], ["partially_paid", "Partially paid"], ["paid", "Paid"], ["refunded", "Refunded"]];
const productionOptions = [["not_started", "Not started"], ["awaiting_fabric", "Awaiting fabric"], ["cutting", "Cutting"], ["sewing", "Sewing"], ["fitting", "Fitting"], ["alterations", "Alterations"], ["quality_check", "Quality check"], ["ready_for_collection", "Ready for collection"], ["collected", "Collected"], ["cancelled", "Cancelled"]];

function emptyServiceForm(): ServiceForm {
  return { name: "", category: "Made to measure", description: "", priceLabel: "Quote after consultation", illustrativePrice: "", imageUrl: "", active: true, sortOrder: "100" };
}
function requestDraft(item: RequestRecord): RequestDraft {
  return {
    status: item.status || "new", quoteStatus: item.quoteStatus || "not_quoted",
    paymentStatus: item.paymentStatus || "unpaid", productionStage: item.productionStage || "not_started",
    quoteAmount: item.quoteAmount == null ? "" : String(item.quoteAmount), quoteNotes: item.quoteNotes || "",
    depositRequired: item.depositRequired == null ? "" : String(item.depositRequired),
    depositPaid: item.depositPaid == null ? "" : String(item.depositPaid), dueDate: item.dueDate || "",
    fittingDate: item.fittingDate || "", collectionMethod: item.collectionMethod || "not_set",
    adminNotes: item.adminNotes || ""
  };
}
async function confirmServerWrite() {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SERVER_ACK_TIMEOUT")), 15000);
    void waitForPendingWrites(db).then(() => { clearTimeout(timer); resolve(); }).catch(error => { clearTimeout(timer); reject(error); });
  });
}
function moneyInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function TailoringAdminDashboard() {
  const [tab, setTab] = useState<"requests" | "services">("requests");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [editingId, setEditingId] = useState("");
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm());
  const [drafts, setDrafts] = useState<Record<string, RequestDraft>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [referencePreviews, setReferencePreviews] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  useEffect(() => {
    if (!hasFirebaseWebConfig) { setError("Firebase web configuration is missing. Admin data cannot be loaded."); return; }
    let stopped = false;
    let stopServices: (() => void) | undefined;
    const start = async () => {
      try {
        const snapshot = await getDocs(collection(db, "tailoringServices"));
        if (stopped) return;
        if (snapshot.empty) {
          const batch = writeBatch(db);
          const now = new Date().toISOString();
          for (const item of seedServices) {
            batch.set(doc(db, "tailoringServices", item.id), { ...item, createdAt: now, updatedAt: now });
          }
          await batch.commit();
          await confirmServerWrite();
        }
        if (stopped) return;
        stopServices = onSnapshot(collection(db, "tailoringServices"), data => {
          setServices(data.docs.map(item => ({ id: item.id, ...item.data() as Omit<ServiceRecord, "id"> })).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
        }, () => setError("The tailoring catalogue could not be loaded. Check the Firebase rules and connection."));
      } catch {
        setError("The tailoring catalogue could not be initialized. Confirm this account has admin access and try again.");
      }
    };
    void start();
    const stopRequests = onSnapshot(collection(db, "tailoringRequests"), data => {
      setRequests(data.docs.map(item => ({ id: item.id, ...item.data() as Omit<RequestRecord, "id"> })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }, () => setError("Customer requests could not be loaded. Check admin access and the Firebase rules."));
    return () => { stopped = true; stopServices?.(); stopRequests(); };
  }, []);

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  const visibleRequests = useMemo(() => requests.filter(item => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [item.customerName, item.phone, item.serviceName, item.garmentType, item.id].some(value => String(value || "").toLowerCase().includes(term));
    const matchesStatus = filter === "all" || item.status === filter;
    return matchesText && matchesStatus;
  }), [requests, search, filter]);

  function editService(item: ServiceRecord) {
    setEditingId(item.id);
    setServiceForm({ name: item.name, category: item.category, description: item.description, priceLabel: item.priceLabel, illustrativePrice: item.illustrativePrice == null ? "" : String(item.illustrativePrice), imageUrl: item.imageUrl || "", active: item.active, sortOrder: String(item.sortOrder) });
    setNotice("");
    setError("");
  }
  function resetService() { setEditingId(""); setServiceForm(emptyServiceForm()); }

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!isOnline) { setError("You appear to be offline. No service changes were confirmed; reconnect and try again."); return; }
    if (!serviceForm.name.trim() || !serviceForm.description.trim()) { setError("Add a service name and description."); return; }
    const price = moneyInput(serviceForm.illustrativePrice);
    if (serviceForm.illustrativePrice.trim() && price === null) { setError("Enter a non-negative illustrative price, or leave it blank."); return; }
    if (serviceForm.imageUrl.trim()) {
      try { const url = new URL(serviceForm.imageUrl.trim()); if (url.protocol !== "https:") throw new Error(); }
      catch { setError("Service image URLs must be valid HTTPS links."); return; }
    }
    setBusyId("service");
    try {
      const id = editingId || doc(collection(db, "tailoringServices")).id;
      const existing = services.find(item => item.id === id);
      const now = new Date().toISOString();
      await setDoc(doc(db, "tailoringServices", id), {
        name: serviceForm.name.trim(), category: serviceForm.category.trim() || "General",
        description: serviceForm.description.trim(), priceLabel: serviceForm.priceLabel.trim() || "Quote after consultation",
        illustrativePrice: price, imageUrl: serviceForm.imageUrl.trim(), active: serviceForm.active,
        sortOrder: Number(serviceForm.sortOrder) || 100, createdAt: existing?.createdAt || now, updatedAt: now
      });
      await confirmServerWrite();
      setNotice(editingId ? "Service updated. Active customer catalogues will refresh automatically." : "Service created and available in the customer catalogue.");
      resetService();
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "SERVER_ACK_TIMEOUT" ? "The server did not confirm this service change in time. Refresh before retrying to avoid duplicate edits." : "The service could not be saved. Check your admin access and try again.");
    } finally { setBusyId(""); }
  }

  async function removeService(item: ServiceRecord) {
    if (!isOnline) { setError("You appear to be offline. No service deletion was confirmed."); return; }
    if (!window.confirm(`Delete “${item.name}” from the catalogue? Existing requests keep their saved service name.`)) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      await deleteDoc(doc(db, "tailoringServices", item.id));
      await confirmServerWrite();
      if (editingId === item.id) resetService();
      setNotice("Service deleted from the catalogue. Existing request history is unchanged.");
    } catch { setError("The service could not be deleted. Check your admin access and try again."); }
    finally { setBusyId(""); }
  }

  function patchDraft(item: RequestRecord, patch: Partial<RequestDraft>) {
    setDrafts(current => ({ ...current, [item.id]: { ...(current[item.id] || requestDraft(item)), ...patch } }));
  }

  async function saveRequest(item: RequestRecord) {
    if (!isOnline) { setError("You appear to be offline. No request changes were confirmed; reconnect and retry."); return; }
    const draft = drafts[item.id] || requestDraft(item);
    const quoteAmount = moneyInput(draft.quoteAmount);
    const depositRequired = moneyInput(draft.depositRequired);
    const depositPaid = moneyInput(draft.depositPaid);
    if ((draft.quoteAmount.trim() && quoteAmount === null) || (draft.depositRequired.trim() && depositRequired === null) || (draft.depositPaid.trim() && depositPaid === null)) {
      setError("Quotation and deposit amounts must be non-negative numbers."); return;
    }
    if (depositRequired !== null && depositPaid !== null && depositPaid > depositRequired) {
      setError("The recorded deposit cannot exceed the required deposit."); return;
    }
    const nextQuoteStatus = draft.status === "quote_ready" && draft.quoteStatus === "not_quoted" ? "ready" : draft.quoteStatus;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      await updateDoc(doc(db, "tailoringRequests", item.id), {
        status: draft.status, quoteStatus: nextQuoteStatus, paymentStatus: draft.paymentStatus,
        productionStage: draft.productionStage, quoteAmount, quoteNotes: draft.quoteNotes.trim(),
        depositRequired, depositPaid, dueDate: draft.dueDate, fittingDate: draft.fittingDate,
        collectionMethod: draft.collectionMethod, adminNotes: draft.adminNotes.trim(),
        updatedAt: new Date().toISOString()
      });
      await confirmServerWrite();
      setNotice(`Updated request ${item.id.slice(0, 8).toUpperCase()}.`);
      setDrafts(current => { const next = { ...current }; delete next[item.id]; return next; });
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "SERVER_ACK_TIMEOUT" ? "The server did not confirm this update in time. Refresh the request before retrying." : "The request update was rejected. Confirm the values and current Firebase rules, then retry.");
    } finally { setBusyId(""); }
  }

  async function showReference(item: RequestRecord) {
    const path = item.referenceImage?.storagePath;
    if (!path || referencePreviews[item.id]) return;
    setError("");
    try {
      const blob = await getBlob(ref(storage, path));
      const url = URL.createObjectURL(blob);
      previewUrlsRef.current.push(url);
      setReferencePreviews(current => ({ ...current, [item.id]: url }));
    } catch { setError("The reference image could not be retrieved with this admin session."); }
  }

  const count = (status: string) => requests.filter(item => item.status === status).length;

  return (
    <main className="yusufAdminPage">
      <header className="yusufAdminHeader">
        <div><a href="/" className="yusufFooterBrand">YUSUF <span>CLOTHING LINE</span></a><p className="yusufEyebrow">BUSINESS WORKSPACE</p><h1>Made-to-measure<br /><em>operations.</em></h1></div>
        <div className="yusufAdminHeaderNote"><strong>Keep every detail together.</strong><span>Requests, quotations, fittings and production updates stay in the app.</span></div>
      </header>
      <div className="yusufAdminStats">
        <article><small>New requests</small><strong>{count("new")}</strong></article>
        <article><small>Quotes ready</small><strong>{count("quote_ready")}</strong></article>
        <article><small>In production</small><strong>{count("in_production")}</strong></article>
        <article><small>Ready to collect</small><strong>{count("ready_for_collection")}</strong></article>
      </div>
      <div className="yusufAdminTabs" role="tablist" aria-label="Business workspace">
        <button type="button" role="tab" aria-selected={tab === "requests"} onClick={() => setTab("requests")}>Customer requests <span>{requests.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "services"} onClick={() => setTab("services")}>Service catalogue <span>{services.length}</span></button>
      </div>
      {error && <p className="yusufAdminError" role="alert">{error}</p>}
      {notice && <p className="yusufAdminNotice" role="status">{notice}</p>}

      {tab === "services" ? (
        <section className="yusufAdminPanel">
          <div className="yusufAdminPanelIntro"><div><p className="yusufEyebrow">EDITABLE CONTENT</p><h2>{editingId ? "Edit service" : "Add a service"}</h2></div><p>Changes publish to the customer catalogue after saving. Prices and policies must remain clearly labelled until Yusuf confirms them.</p></div>
          <form className="yusufAdminServiceForm" onSubmit={saveService}>
            <label>Service name *<input required maxLength={120} value={serviceForm.name} onChange={e => setServiceForm(v => ({ ...v, name: e.target.value }))} /></label>
            <label>Category<input maxLength={80} value={serviceForm.category} onChange={e => setServiceForm(v => ({ ...v, category: e.target.value }))} /></label>
            <label className="wide">Description *<textarea required maxLength={2000} rows={3} value={serviceForm.description} onChange={e => setServiceForm(v => ({ ...v, description: e.target.value }))} /></label>
            <label>Price label<input maxLength={120} value={serviceForm.priceLabel} onChange={e => setServiceForm(v => ({ ...v, priceLabel: e.target.value }))} placeholder="Quote after consultation" /></label>
            <label>Illustrative price (P)<input type="number" min="0" step="1" value={serviceForm.illustrativePrice} onChange={e => setServiceForm(v => ({ ...v, illustrativePrice: e.target.value }))} placeholder="Leave blank if not applicable" /></label>
            <label className="wide">Image URL (HTTPS, optional)<input type="url" value={serviceForm.imageUrl} onChange={e => setServiceForm(v => ({ ...v, imageUrl: e.target.value }))} placeholder="https://…" /></label>
            <label>Display order<input type="number" min="0" step="1" value={serviceForm.sortOrder} onChange={e => setServiceForm(v => ({ ...v, sortOrder: e.target.value }))} /></label>
            <label className="yusufAdminCheck"><input type="checkbox" checked={serviceForm.active} onChange={e => setServiceForm(v => ({ ...v, active: e.target.checked }))} /> Active in customer catalogue</label>
            <div className="yusufAdminFormActions"><button type="submit" disabled={busyId === "service" || !isOnline}>{busyId === "service" ? "Saving…" : editingId ? "Save changes" : "Create service"}</button>{editingId && <button type="button" className="secondary" onClick={resetService}>Cancel edit</button>}</div>
          </form>
          <div className="yusufAdminListHeading"><h3>Services</h3><span>{services.filter(item => item.active).length} active · {services.length} total</span></div>
          <div className="yusufAdminServiceList">
            {services.map(item => <article key={item.id} className={!item.active ? "inactive" : ""}><div><strong>{item.name}</strong><small>{item.category} · {item.priceLabel}</small><p>{item.description}</p></div><div className="yusufAdminRowActions"><span>{item.active ? "Active" : "Inactive"}</span><button type="button" onClick={() => editService(item)}>Edit</button><button type="button" className="danger" disabled={busyId === item.id || !isOnline} onClick={() => void removeService(item)}>Delete</button></div></article>)}
          </div>
        </section>
      ) : (
        <section className="yusufAdminPanel">
          <div className="yusufAdminPanelIntro"><div><p className="yusufEyebrow">CUSTOMER WORK QUEUE</p><h2>Requests & production</h2></div><p>Submitting a request is not an accepted quote, confirmed order or payment. Record each decision explicitly.</p></div>
          <div className="yusufAdminFilters"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, phone, service or reference…" aria-label="Search requests" /><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter request status"><option value="all">All statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="quote_accepted">Quote accepted</option></select></div>
          <div className="yusufAdminRequestList">
            {visibleRequests.length === 0 && <div className="yusufAdminEmpty"><strong>No matching requests</strong><p>New customer requests will appear here after they are saved.</p></div>}
            {visibleRequests.map(item => {
              const draft = drafts[item.id] || requestDraft(item);
              return <article className="yusufAdminRequest" key={item.id}>
                <div className="yusufAdminRequestTop"><div><span className="yusufAdminRequestId">REQUEST / {item.id.slice(0, 8).toUpperCase()}</span><h3>{item.serviceName} <span>· {item.garmentType}</span></h3><p>{item.customerName} · {item.phone}{item.email ? " · " + item.email : ""}</p></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>
                <div className="yusufAdminBrief">
                  {item.stylePreferences && <p><b>Style</b>{item.stylePreferences}</p>}
                  {item.fabricPreferences && <p><b>Fabric</b>{item.fabricPreferences}</p>}
                  {item.measurements && <p><b>Measurements</b>{item.measurements}</p>}
                  {item.needsFittingHelp && <p><b>Fitting</b>Customer requested measuring or fitting assistance{item.preferredFittingDate ? " · preferred " + item.preferredFittingDate : ""}</p>}
                  {item.notes && <p><b>Notes</b>{item.notes}</p>}
                  {item.referenceImage && <div className="yusufAdminReference"><button type="button" disabled={!isOnline} onClick={() => void showReference(item)}>View private reference image</button>{referencePreviews[item.id] && <img src={referencePreviews[item.id]} alt={"Private reference for " + item.garmentType} />}</div>}
                </div>
                <div className="yusufAdminRequestFields">
                  <label>Status<select value={draft.status} onChange={e => patchDraft(item, { status: e.target.value })}>{item.status === "quote_accepted" && <option value="quote_accepted" disabled>Quote accepted by customer</option>}{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Quotation status<select value={draft.quoteStatus} onChange={e => patchDraft(item, { quoteStatus: e.target.value })}>{quoteOptions.map(([value, label]) => <option key={value} value={value} disabled={value === "accepted"}>{label}</option>)}</select></label>
                  <label>Quote amount (P)<input type="number" min="0" step="0.01" value={draft.quoteAmount} onChange={e => patchDraft(item, { quoteAmount: e.target.value })} /></label>
                  <label>Deposit required (P)<input type="number" min="0" step="0.01" value={draft.depositRequired} onChange={e => patchDraft(item, { depositRequired: e.target.value })} /></label>
                  <label>Deposit received (P)<input type="number" min="0" step="0.01" value={draft.depositPaid} onChange={e => patchDraft(item, { depositPaid: e.target.value })} /></label>
                  <label>Payment status<select value={draft.paymentStatus} onChange={e => patchDraft(item, { paymentStatus: e.target.value })}>{paymentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Production stage<select value={draft.productionStage} onChange={e => patchDraft(item, { productionStage: e.target.value })}>{productionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Fitting date<input type="date" value={draft.fittingDate} onChange={e => patchDraft(item, { fittingDate: e.target.value })} /></label>
                  <label>Due date<input type="date" value={draft.dueDate} onChange={e => patchDraft(item, { dueDate: e.target.value })} /></label>
                  <label>Collection / delivery<select value={draft.collectionMethod} onChange={e => patchDraft(item, { collectionMethod: e.target.value })}><option value="not_set">Not set</option><option value="collection">Collection</option><option value="delivery">Delivery</option></select></label>
                  <label className="wide">Quote notes<textarea rows={2} maxLength={2000} value={draft.quoteNotes} onChange={e => patchDraft(item, { quoteNotes: e.target.value })} /></label>
                  <label className="wide">Internal admin notes<textarea rows={2} maxLength={3000} value={draft.adminNotes} onChange={e => patchDraft(item, { adminNotes: e.target.value })} /></label>
                </div>
                <div className="yusufAdminRequestFooter"><span>Last updated {new Date(item.updatedAt).toLocaleString()}</span><button type="button" disabled={busyId === item.id || !isOnline} onClick={() => void saveRequest(item)}>{busyId === item.id ? "Saving…" : "Save request updates"}</button></div>
              </article>;
            })}
          </div>
        </section>
      )}
      <footer className="yusufAdminFooter"><span>Yusuf Clothing Line · Private business workspace</span><a href="/">View customer storefront ↗</a></footer>
    </main>
  );
}
