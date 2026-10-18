"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { auth, db, hasFirebaseWebConfig, storage } from "@/lib/firebase/client";

const serviceOptions = [
  "Custom suits",
  "Wedding & occasion wear",
  "Unisex tailoring",
  "Dresses & skirts",
  "Shirts & trousers",
  "Alterations & repairs",
  "Uniforms & corporate wear",
  "Corporate & uniform wear",
  "Other / not sure"
];

type ReferenceImage = { storagePath: string; name: string; type: string; size: number };

export default function RequestForm() {
  const [service, setService] = useState("");
  const [availableServices, setAvailableServices] = useState<string[]>(serviceOptions);
  const [garmentType, setGarmentType] = useState("");
  const [stylePreferences, setStylePreferences] = useState("");
  const [fabricPreferences, setFabricPreferences] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [needsFittingHelp, setNeedsFittingHelp] = useState(true);
  const [preferredFittingDate, setPreferredFittingDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedService = (params.get("service") || "").slice(0, 120);
    if (requestedService) {
      setService(requestedService);
      setAvailableServices(current => current.includes(requestedService) ? current : [...current, requestedService]);
    }
  }, []);

  useEffect(() => {
    if (!hasFirebaseWebConfig) return;
    return onSnapshot(collection(db, "tailoringServices"), snapshot => {
      const names = snapshot.docs.map(item => item.data()).filter(item => item.active === true && typeof item.name === "string").map(item => String(item.name).slice(0, 120));
      setAvailableServices(current => [...new Set([...serviceOptions, ...names, service].filter(Boolean))]);
    });
  }, [service]);

  function chooseFile(next: File | null) {
    setError("");
    if (!next) { setFile(null); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(next.type)) {
      setFile(null);
      setError("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("The reference image must be 5 MB or smaller.");
      return;
    }
    setFile(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!hasFirebaseWebConfig) {
      setError("The request service is not configured yet. Your details have not been sent; keep this form open and try again later.");
      return;
    }
    if (!service || !name.trim() || !phone.trim() || !garmentType.trim()) {
      setError("Choose a service and add your name, phone number and garment or alteration details.");
      return;
    }
    if (!navigator.onLine) {
      setError("You appear to be offline. Your request has not been submitted; reconnect and try again.");
      return;
    }
    setBusy(true);
    let uploadedPath = "";
    try {
      const current = auth.currentUser || (await signInAnonymously(auth)).user;
      const requestRef = doc(collection(db, "tailoringRequests"));
      let referenceImage: ReferenceImage | null = null;
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "reference-image";
        uploadedPath = `tailoringReferences/${current.uid}/${requestRef.id}/${safeName}`;
        await uploadBytes(ref(storage, uploadedPath), file, {
          contentType: file.type,
          customMetadata: { ownerUid: current.uid, requestId: requestRef.id }
        });
        referenceImage = { storagePath: uploadedPath, name: file.name.slice(0, 180), type: file.type, size: file.size };
      }
      const serviceId = service.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const token = await current.getIdToken();
      const response = await fetch("/api/tailoring-request/create", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestRef.id,
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          requestType: "quote_request",
          serviceId,
          serviceName: service,
          garmentType: garmentType.trim(),
          stylePreferences: stylePreferences.trim(),
          fabricPreferences: fabricPreferences.trim(),
          measurements: measurements.trim(),
          needsFittingHelp,
          preferredFittingDate,
          referenceImage,
          notes: notes.trim()
        })
      });
      const result = await response.json().catch(() => ({})) as { requestId?: string; error?: string };
      if (!response.ok || !result.requestId) {
        throw new Error(result.error || "The request could not be saved. No request was confirmed; please retry.");
      }
      setSavedId(result.requestId);
      setFile(null);
    } catch (cause) {
      if (uploadedPath) {
        try { await deleteObject(ref(storage, uploadedPath)); } catch { /* best-effort cleanup */ }
      }
      const code = typeof cause === "object" && cause !== null && "code" in cause
        ? String((cause as { code?: unknown }).code) : "";
      setError(code === "storage/unauthorized"
        ? "The reference image could not be saved securely. No request was submitted; remove the image or try again later."
        : cause instanceof Error && cause.message && !cause.message.startsWith("Firebase:")
          ? cause.message
          : "We couldn't save this request. Your form details are still here; check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (savedId) {
    return (
      <main className="yusufRequestPage">
        <section className="yusufRequestSuccess">
          <Link href="/" className="yusufFooterBrand">YUSUF <span>CLOTHING LINE</span></Link>
          <p className="yusufEyebrow">REQUEST RECEIVED</p>
          <h1>Your idea is<br /><em>in good hands.</em></h1>
          <p>Your request was saved. This is an acknowledgement, not a confirmed quotation or order. Yusuf will need to review the garment, measurements, fabric and timing before confirming the scope and price.</p>
          <div className="yusufRequestReference"><small>REQUEST REFERENCE</small><strong>{savedId}</strong></div>
          <div className="yusufRequestActions"><Link href="/account">Open my account</Link><Link href="/">Back to the studio</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main className="yusufRequestPage">
      <header className="yusufRequestHeader">
        <Link href="/" className="yusufWordmark"><span className="yusufLogoMark" aria-hidden="true"><span /></span><span><strong>YUSUF</strong><small>CLOTHING LINE</small></span></Link>
        <Link href="/" className="yusufRequestBack">Back to studio ↗</Link>
      </header>
      <div className="yusufRequestLayout">
        <aside className="yusufRequestIntro">
          <p className="yusufEyebrow">LET'S START WITH YOUR BRIEF</p>
          <h1>Tell us what<br /><em>you have in mind.</em></h1>
          <p>Share the garment, fit or alteration you need. You can provide measurements now or ask for fitting help.</p>
          <div className="yusufPrivacyNote"><strong>Your details stay private.</strong><span>Measurements and reference images are attached to your request and are not displayed publicly.</span></div>
        </aside>
        <form className="yusufRequestForm" onSubmit={submit}>
          <div className="yusufFormHeading"><span>01 / THE GARMENT</span><p>Start with the kind of work you need.</p></div>
          <label>Service <span>*</span>
            <select required value={service} onChange={event => setService(event.target.value)}>
              <option value="">Choose a service</option>
              {availableServices.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>Garment or alteration details <span>*</span>
            <input required value={garmentType} onChange={event => setGarmentType(event.target.value)} placeholder="e.g. two-piece suit, graduation dress, trouser hem" maxLength={120} />
          </label>
          <div className="yusufFormGrid">
            <label>Style or design preferences
              <textarea value={stylePreferences} onChange={event => setStylePreferences(event.target.value)} placeholder="Cut, colour, occasion, pockets, buttons…" maxLength={1500} rows={3} />
            </label>
            <label>Fabric preferences
              <textarea value={fabricPreferences} onChange={event => setFabricPreferences(event.target.value)} placeholder="Fabric type, feel, colour, or help choosing" maxLength={500} rows={3} />
            </label>
          </div>
          <label>Reference image <span>· optional · max 5 MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={event => chooseFile(event.target.files?.[0] || null)} />
            {file && <small className="yusufSelectedFile">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB <button type="button" onClick={() => setFile(null)}>Remove</button></small>}
          </label>

          <div className="yusufFormHeading"><span>02 / FITTING & MEASUREMENTS</span><p>Share what you know. You can ask for help.</p></div>
          <label className="yusufCheckRow"><input type="checkbox" checked={needsFittingHelp} onChange={event => setNeedsFittingHelp(event.target.checked)} /> I would like help with measuring or arranging a fitting.</label>
          <label>Measurements <span>· optional</span>
            <textarea value={measurements} onChange={event => setMeasurements(event.target.value)} placeholder="Add any measurements you already have, with units. Leave blank if you'd prefer fitting assistance." maxLength={3000} rows={4} />
            <small>Measurements are private personal details. Only share what is needed; you can leave this blank and request fitting help.</small>
          </label>
          <label>Preferred fitting date <span>· optional</span>
            <input type="date" value={preferredFittingDate} onChange={event => setPreferredFittingDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </label>

          <div className="yusufFormHeading"><span>03 / YOUR DETAILS</span><p>So the team can follow up inside your request.</p></div>
          <div className="yusufFormGrid">
            <label>Your name <span>*</span><input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={120} /></label>
            <label>Phone number <span>*</span><input required type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={60} placeholder="+267 …" /></label>
          </div>
          <label>Email <span>· optional</span><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={200} /></label>
          <label>Anything else we should know? <span>· optional</span>
            <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Budget guidance, deadline, collection or delivery preference, or other requirements…" maxLength={3000} rows={4} />
          </label>
          {error && <p className="yusufFormError" role="alert">{error}</p>}
          <button className="yusufButtonPrimary yusufSubmitButton" type="submit" disabled={busy}>{busy ? "Saving your request…" : "Send tailoring request"} <span aria-hidden="true">↗</span></button>
          <p className="yusufFormLegal">Submitting sends a request for review. It does not confirm a price, appointment, order, deposit or completion date. Those details must be agreed before work begins.</p>
        </form>
      </div>
    </main>
  );
}
