import Link from "next/link";

const services = [
  { number: "01", name: "Custom suits", detail: "Made-to-measure formalwear shaped around your fit, fabric and occasion.", price: "P1,600", note: "illustrative starting point", tone: "wine" },
  { number: "02", name: "Wedding & occasion wear", detail: "A considered look for the day that matters, from first fitting to final adjustments.", price: "P1,800", note: "illustrative starting point", tone: "sand" },
  { number: "03", name: "Unisex tailoring", detail: "Skirt suits, trouser suits and individual pieces designed around your preferences.", price: "P1,200", note: "illustrative starting point", tone: "olive" },
  { number: "04", name: "Alterations & repairs", detail: "Hems, sleeves, waist adjustments and fit corrections for garments you already own.", price: "Quote after assessment", note: "depends on the garment and work", tone: "ink" }
];

export default function Home() {
  return (
    <main className="yusufHome">
      <div className="yusufAnnouncement">
        <span>BOTSWANA · MADE AROUND YOU</span>
        <span>Custom tailoring · Alterations · Fittings</span>
      </div>

      <header className="yusufHeader">
        <Link href="/" className="yusufWordmark" aria-label="Yusuf Clothing Line home">
          <span className="yusufLogoMark" aria-hidden="true"><span /></span>
          <span><strong>YUSUF</strong><small>CLOTHING LINE</small></span>
        </Link>
        <nav className="yusufNav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#process">How it works</a>
          <Link href="/account">My orders</Link>
        </nav>
        <Link className="yusufHeaderCta" href="/request">Start a request <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="yusufHero">
        <div className="yusufHeroCopy">
          <p className="yusufEyebrow"><span /> PERSONAL TAILORING · BOTSWANA</p>
          <h1>Made for you.<br /><em>Made to fit.</em></h1>
          <p className="yusufHeroText">Clothes should feel like they belong to you. Start with an idea, a garment that needs work, or a fit you want to get right.</p>
          <div className="yusufHeroActions">
            <Link href="/request" className="yusufButtonPrimary">Tell us what you need <span aria-hidden="true">↗</span></Link>
            <a href="#services" className="yusufTextLink">Explore services <span aria-hidden="true">↓</span></a>
          </div>
          <p className="yusufFinePrint">No installation needed. Share your brief here and follow the next steps in your account.</p>
        </div>
        <div className="yusufHeroArt" aria-label="Decorative tailoring-inspired line artwork" role="img">
          <div className="yusufArtFrame">
            <div className="yusufPatternCircle" />
            <div className="yusufPatternLine yusufPatternLineOne" />
            <div className="yusufPatternLine yusufPatternLineTwo" />
            <div className="yusufPatternTape">CUT · FIT · FINISH</div>
            <div className="yusufPatternLabel"><span>YCL</span><small>YOUR FIT, YOUR STORY</small></div>
          </div>
          <span className="yusufArtIndex">STUDIO NOTES / 001</span>
        </div>
      </section>

      <section className="yusufTrustStrip" aria-label="Service principles">
        <span><b>01</b> Your brief comes first</span>
        <span><b>02</b> Fitting guidance when you need it</span>
        <span><b>03</b> Clear quote before work is confirmed</span>
      </section>

      <section className="yusufServices" id="services">
        <div className="yusufSectionIntro">
          <div><p className="yusufEyebrow">THE SERVICE EDIT</p><h2>Start with<br /><em>what you need.</em></h2></div>
          <p>Choose a direction to get started. You can describe the garment, add a reference photo and ask for fitting help in your request.</p>
        </div>
        <div className="yusufServiceGrid">
          {services.map((service) => (
            <article className={`yusufServiceCard ${service.tone}`} key={service.number}>
              <div className="yusufServiceVisual" aria-hidden="true"><span>{service.number}</span><div className="yusufClothShape" /></div>
              <div className="yusufServiceBody">
                <div className="yusufServiceMeta"><span>TAILORING / {service.number}</span><span>BOTSWANA</span></div>
                <h3>{service.name}</h3>
                <p>{service.detail}</p>
                <div className="yusufServicePrice"><strong>{service.price}</strong><small>{service.note}</small></div>
                <Link href={`/request?service=${encodeURIComponent(service.name)}`} className="yusufServiceLink">Choose this service <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
        <p className="yusufPricingNotice">Price examples are placeholders for planning only, informed by publicly listed tailoring prices in Botswana. They are not Yusuf Clothing Line prices or a quotation. Final pricing depends on fabric, construction, measurements and scope and must be agreed before work begins.</p>
      </section>

      <section className="yusufProcess" id="process">
        <div className="yusufProcessHeading"><p className="yusufEyebrow">A CLEARER WAY TO GET IT MADE</p><h2>From your idea<br />to the <em>final fit.</em></h2></div>
        <div className="yusufProcessSteps">
          <article><span>01</span><h3>Tell us the brief</h3><p>Choose a service, describe your style and share a reference image if you have one.</p></article>
          <article><span>02</span><h3>Review the details</h3><p>We clarify measurements, fitting needs, fabric choices, price and timing before confirming the work.</p></article>
          <article><span>03</span><h3>Track the progress</h3><p>Keep your request, quotation and recorded order updates together in your account.</p></article>
        </div>
      </section>

      <section className="yusufClosing">
        <div><p className="yusufEyebrow">YOUR NEXT STEP</p><h2>Bring the idea.<br /><em>We’ll shape the plan.</em></h2></div>
        <Link href="/request" className="yusufButtonPrimary">Start your tailoring request <span aria-hidden="true">↗</span></Link>
      </section>

      <footer className="yusufFooter">
        <Link href="/" className="yusufFooterBrand">YUSUF <span>CLOTHING LINE</span></Link>
        <p>Custom tailoring and alterations · Botswana</p>
        <div><Link href="/account">My orders</Link><Link href="/admin">Business admin</Link></div>
        <small>Illustrative catalogue content · Business details and policies will be confirmed by Yusuf.</small>
      </footer>
    </main>
  );
}
