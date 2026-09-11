/**
 * Firmele NOASTRE care pot emite o factură, cu datele de pe factură.
 *
 * Sursa e brokerul Stripe (`stripe.knowbest.ro`, `data/companies.json`) — acolo stau
 * datele de facturare folosite deja pe plăți reale. Aici sunt doar ca afișare, ca
 * cine emite factura să nu fie nevoit să le caute.
 *
 * Regula: B2B pe Fabulosos (plătitoare de TVA), B2C pe Class RDA (neplătitoare).
 */
export const FIRME_EMITENTE = {
  fabulosos: {
    nume: "Fabulosos SRL",
    cui: "RO33968578",
    regCom: "J2015000297404",
    adresa: "Valea Oltului nr. 8, bl. A5, ap. 36, Sector 4, București",
    tva: true,
  },
  "class-rda": {
    nume: "Class RDA Impex SRL",
    cui: "29867320",
    regCom: "J40/2439/2012",
    adresa: "Str. Pridvorului nr. 5, bl. 6, ap. 1, București",
    tva: false,
  },
} as const;

export type EmitentSlug = keyof typeof FIRME_EMITENTE;
export const EMITENTI = Object.keys(FIRME_EMITENTE) as EmitentSlug[];
