export interface TaxCode {
  code: string;
  label: string;
  rate: number;
}

export interface TaxRegion {
  region: string;
  provinceCode: string;
  taxes: TaxCode[];
}

export const TAX_REGIONS: TaxRegion[] = [
  {
    region: "Alberta",
    provinceCode: "AB",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
    ],
  },
  {
    region: "British Columbia",
    provinceCode: "BC",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
      { code: "PST", label: "PST — Provincial Sales Tax",  rate: 0.07 },
    ],
  },
  {
    region: "Manitoba",
    provinceCode: "MB",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
      { code: "RST", label: "RST — Retail Sales Tax",      rate: 0.07 },
    ],
  },
  {
    region: "New Brunswick",
    provinceCode: "NB",
    taxes: [
      { code: "HST", label: "HST — Harmonized Sales Tax", rate: 0.15 },
    ],
  },
  {
    region: "Newfoundland & Labrador",
    provinceCode: "NL",
    taxes: [
      { code: "HST", label: "HST — Harmonized Sales Tax", rate: 0.15 },
    ],
  },
  {
    region: "Northwest Territories",
    provinceCode: "NT",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
    ],
  },
  {
    region: "Nova Scotia",
    provinceCode: "NS",
    taxes: [
      { code: "HST", label: "HST — Harmonized Sales Tax", rate: 0.15 },
    ],
  },
  {
    region: "Nunavut",
    provinceCode: "NU",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
    ],
  },
  {
    region: "Ontario",
    provinceCode: "ON",
    taxes: [
      { code: "HST", label: "HST — Harmonized Sales Tax", rate: 0.13 },
    ],
  },
  {
    region: "Prince Edward Island",
    provinceCode: "PE",
    taxes: [
      { code: "HST", label: "HST — Harmonized Sales Tax", rate: 0.15 },
    ],
  },
  {
    region: "Quebec",
    provinceCode: "QC",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05   },
      { code: "QST", label: "QST — Quebec Sales Tax",      rate: 0.09975 },
    ],
  },
  {
    region: "Saskatchewan",
    provinceCode: "SK",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
      { code: "PST", label: "PST — Provincial Sales Tax",  rate: 0.06 },
    ],
  },
  {
    region: "Yukon",
    provinceCode: "YT",
    taxes: [
      { code: "GST", label: "GST — Goods & Services Tax", rate: 0.05 },
    ],
  },
];
