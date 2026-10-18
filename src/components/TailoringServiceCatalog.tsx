"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, hasFirebaseWebConfig } from "@/lib/firebase/client";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceLabel: string;
  illustrativePrice: number | null;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

const placeholders: Service[] = [
  { id: "custom-suits", name: "Custom suits", category: "Made to measure", description: "Formalwear shaped around your fit, fabric and occasion.", priceLabel: "Illustrative from P8,000", illustrativePrice: 8000, imageUrl: "", active: true, sortOrder: 10 },
  { id: "wedding-occasion-wear", name: "Wedding & occasion wear", category: "Occasion", description: "A considered look for the day that matters, from first fitting to final adjustments.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 20 },
  { id: "unisex-tailoring", name: "Unisex tailoring", category: "Made to measure", description: "Skirt suits, trouser suits and individual pieces designed around your preferences.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 30 },
  { id: "alterations-repairs", name: "Alterations & repairs", category: "Alterations", description: "Hems, sleeves, waist adjustments and fit corrections for garments you already own.", priceLabel: "Quote after assessment", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 40 },
  { id: "dresses-skirts", name: "Dresses & skirts", category: "Garments", description: "Made-to-measure dresses and skirts with your preferred silhouette and finishing.", priceLabel: "Quote after consultation", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 50 },
  { id: "corporate-wear", name: "Corporate & uniform wear", category: "Teams", description: "Discuss consistent fit, fabric and quantities for workwear or team uniforms.", priceLabel: "Quote by brief", illustrativePrice: null, imageUrl: "", active: true, sortOrder: 60 }
];

export default function TailoringServiceCatalog() {
  const [services, setServices] = useState<Service[]>(placeholders);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!hasFirebaseWebConfig) return;
    return onSnapshot(
      collection(db, "tailoringServices"),
      snapshot => {
        const records = snapshot.docs.map(item => ({ id: item.id, ...item.data() as Omit<Service, "id"> }));
        records.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
        if (snapshot.empty) {
          setServices(placeholders);
          setLive(false);
        } else {
          setServices(records.filter(item => item.active));
          setLive(true);
        }
      },
      () => {
        setServices(placeholders);
        setLive(false);
      }
    );
  }, []);

  return (
    <>
      {services.length === 0 && live ? <div className="yusufCatalogEmpty"><strong>The catalogue is being refreshed.</strong><p>Check back soon or start a request and describe what you need.</p><Link href="/request">Describe your tailoring request ↗</Link></div> : <div className="yusufServiceGrid">
        {services.map((service, index) => (
          <article className={`yusufServiceCard ${["wine", "sand", "olive", "ink"][index % 4]}`} key={service.id}>
            <div className="yusufServiceVisual" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {service.imageUrl ? <img src={service.imageUrl} alt="" loading="lazy" /> : <div className="yusufClothShape" />}
            </div>
            <div className="yusufServiceBody">
              <div className="yusufServiceMeta"><span>{service.category.toUpperCase()}</span><span>BOTSWANA</span></div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="yusufServicePrice"><strong>{service.priceLabel || "Quote after consultation"}</strong><small>{live ? "Guide only · final quote confirmed after review" : "Illustrative placeholder · not a Yusuf quote"}</small></div>
              <Link href={`/request?service=${encodeURIComponent(service.name)}`} className="yusufServiceLink">Choose this service <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        ))}
      </div>}
      <p className="yusufPricingNotice">{live ? "Catalogue content is managed by Yusuf. A displayed guide price is not a quotation; final price and timing must be agreed before work is confirmed." : "Example catalogue content is shown while the business catalogue is being configured. Any price shown is a clearly labelled illustration until Yusuf confirms the catalogue; no public listing verifies Yusuf Clothing Line prices."}</p>
    </>
  );
}
