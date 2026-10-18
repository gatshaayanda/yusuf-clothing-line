# Yusuf Clothing Line — initial market and UX notes

**Research date:** 18 October 2026  
**Scope:** Publicly accessible Botswana tailoring and garment-service pages plus general usability guidance. This is a starting point, not a complete competitor census or evidence of Yusuf's own prices.

## Botswana service evidence

### King of Suits — Gaborone

- Its public suit catalogue lists made-to-measure suit examples at **P7,999, P8,699, P9,499 and P8,999**. These are competitor prices for its own named suit designs, not Yusuf Clothing Line prices.
- Its service pages cover custom shirts, alterations and garment refinement, style consultation, premium services and suits by occasion.
- Its consultation journey asks customers to discuss the brief, measure with guidance and agree the plan before work begins.
- The accessible alterations and consultation pages reviewed here did not expose a public numeric price list for every alteration category.

Sources: [Made-to-measure suits](https://kingofsuits.co.bw/suits), [services catalogue](https://kingofsuits.co.bw/services), [alterations and garment refinement](https://kingofsuits.co.bw/services/alterations-garment-refinement), [consultation](https://kingofsuits.co.bw/consultation).

### Uber Cleaners — Gaborone

- The public site lists alterations and mending, custom clothing and garment-care services.
- It describes home/office pickup and delivery in its service offering.
- The pages reviewed did not publish a tailoring/alterations price list, so no numeric rate is inferred from this source.

Sources: [Uber Cleaners](https://uber-cleaners.com/), [service overview](https://uber-cleaners.com/service.php).

### Fran's Tailor — Gaborone directory listing

- The directory listing describes custom clothing and alterations.
- The page exposes no numeric prices in the accessible listing reviewed.

Source: [Fran's Tailor listing](https://lephutshi.com/listing/frans-tailor-gaborone/).

## Seeded catalogue decisions

- **Custom suits:** “Illustrative from P8,000” is a rounded market-reference placeholder informed by the P7,999 starting example above. It is explicitly labelled as an illustration, not Yusuf's price or a quotation.
- **Wedding/occasion wear, unisex tailoring, alterations, dresses/skirts and corporate wear:** use “Quote after consultation/assessment” because a reliable comparable public price was not established for those specific services.
- Yusuf can edit, deactivate or delete these entries in the admin catalogue. Existing request documents snapshot the service name and garment details so later catalogue edits do not rewrite request history.
- No turnaround time, deposit rule, collection policy or final price is claimed as verified business policy.

## UX decisions and evidence

1. **Keep the first decision simple.** Customers can choose a service or start with a request; detailed style, fabric, measurement and fitting information is collected only in the request flow. The catalogue is intentionally scannable and service names are editable.
2. **Ask only for useful information and label optional fields.** Baymard's 2024 checkout research reports an average of 11.3 form fields and notes that perceived effort and unnecessary fields can hurt usability. This is checkout research, not tailoring-specific evidence, so it informs a design hypothesis rather than a predicted conversion lift. Source: [Baymard — Minimize form fields](https://baymard.com/research-articles/checkout-flow-average-form-fields).
3. **Explain errors and preserve entered values.** GOV.UK guidance recommends clear, actionable messages, field-specific error context and keeping entered data after a validation error. The request form keeps the customer's entered details and presents explicit recovery guidance. Source: [GOV.UK Design System — Error message](https://design-system.service.gov.uk/components/error-message/).
4. **Support discovery without overwhelming the customer.** Nielsen Norman Group's ecommerce search/filter research emphasizes relevant category, product and attribute discovery. Yusuf's initial catalogue uses clear categories and direct request actions rather than a large filter system before there is evidence it is needed. Source: [NN/g — Ecommerce search, filters and routing pages](https://www.nngroup.com/reports/ecommerce-ux-search-including-faceted-search/).
5. **Make business state explicit.** A submitted request is not a quote, accepted quote, confirmed order or payment. Customer acceptance is a separate authenticated action; staff confirmation, production stage and payment records are separate admin updates.
6. **Avoid false online/offline confirmations.** Customer request creation and quote acceptance use server endpoints that validate the authenticated customer and return an acknowledgement only after the server operation completes. Admin writes check for a server acknowledgement before showing success.

## Open research questions

- Obtain Yusuf's real service list, price policy, fitting and collection arrangements before replacing placeholders.
- Verify competitor alteration rates, lead times, appointment practices and collection/delivery policies through public pages or direct research; do not infer unavailable rates.
- Validate the request form and service catalogue with Botswana customers before adding more choices or mandatory measurements.
