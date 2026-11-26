export interface OfficialStatistic {
  id: string;
  geography: 'Global' | 'India' | 'Tamil Nadu';
  metric: string;
  exactValue: string;
  populationScope: string;
  measurementYear: string;
  dataType: 'Actual Census / Survey' | 'Official Estimate' | 'Official Projection';
  sourceOrganization: string;
  reportTitle: string;
  publicationYear: number;
  sourceUrl: string;
}

export interface ImpactProjectionRow {
  horizon: string;
  category: 'Baseline (Published Context)' | '5-Year Scenario (DEMO Assumption)' | '10-Year Scenario (DEMO Assumption)';
  targetEldersSupported: string;
  caregiverHoursSavedPerYear: string;
  transportSavingsInr: string;
  transportSavingsUsd: string;
  healthcareEfficiencyInr: string;
  healthcareEfficiencyUsd: string;
  methodologyNote: string;
}

export const OFFICIAL_STATISTICS: OfficialStatistic[] = [
  {
    id: 'who-global-2020-2030-2050',
    geography: 'Global',
    metric: 'Population aged 60 years and older (1 billion in 2020 -> 1.4 billion by 2030 -> 2.1 billion by 2050)',
    exactValue: '1.0B (2020) · 1.4B (2030) · 2.1B (2050)',
    populationScope: 'Adults aged 60+ globally',
    measurementYear: '2020 baseline; 2030 & 2050 projections',
    dataType: 'Official Projection',
    sourceOrganization: 'World Health Organization (WHO)',
    reportTitle: 'Ageing and Health Fact Sheet',
    publicationYear: 2024,
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/ageing-and-health',
  },
  {
    id: 'un-desa-share-2050',
    geography: 'Global',
    metric: 'Share of world population aged 60+ expected to nearly double from 12% (2015) to 22% (2050)',
    exactValue: '12% (2015) -> 22% (2050)',
    populationScope: 'Share of total global population aged 60+',
    measurementYear: '2015 baseline; 2050 projection',
    dataType: 'Official Projection',
    sourceOrganization: 'WHO / UN DESA Population Division',
    reportTitle: 'World Population Prospects & WHO Ageing Fact Sheet',
    publicationYear: 2024,
    sourceUrl: 'https://population.un.org/wpp/',
  },
  {
    id: 'india-census-2011',
    geography: 'India',
    metric: 'Measured elderly population in India (Census 2011)',
    exactValue: '103.8 million (8.6% of population)',
    populationScope: 'Persons aged 60+ in India',
    measurementYear: '2011',
    dataType: 'Actual Census / Survey',
    sourceOrganization: 'Office of the Registrar General & Census Commissioner / MoSPI',
    reportTitle: 'Elderly in India 2021',
    publicationYear: 2021,
    sourceUrl: 'https://mospi.gov.in/',
  },
  {
    id: 'india-unfpa-2021-2036-2050',
    geography: 'India',
    metric: 'India elderly population projected to grow from 149 million (2022, 10.5%) to 227 million (2036, 15.0%) and 347 million (2050, 20.8%)',
    exactValue: '149M (2022) · 227M (2036) · 347M (2050)',
    populationScope: 'Persons aged 60+ in India',
    measurementYear: '2022 estimate; 2036 & 2050 projections',
    dataType: 'Official Projection',
    sourceOrganization: 'UNFPA India & International Institute for Population Sciences (IIPS)',
    reportTitle: 'India Ageing Report 2023',
    publicationYear: 2023,
    sourceUrl: 'https://india.unfpa.org/en/publications/india-ageing-report-2023',
  },
  {
    id: 'tamil-nadu-elderly-share',
    geography: 'Tamil Nadu',
    metric: 'Tamil Nadu elderly population share (10.4% in Census 2011; projected 13.6% in 2021 and 18.2% by 2031)',
    exactValue: '10.4% (2011) · 13.6% (2021) · 18.2% (2031)',
    populationScope: 'Persons aged 60+ in Tamil Nadu (~7.51M in 2011; ~10.4M in 2021)',
    measurementYear: '2011 Census; 2021 & 2031 Technical Group projections',
    dataType: 'Official Projection',
    sourceOrganization: 'MoSPI & UNFPA India Ageing Report 2023',
    reportTitle: 'Population Projections for India and States 2011–2036 / India Ageing Report 2023',
    publicationYear: 2023,
    sourceUrl: 'https://india.unfpa.org/en/publications/india-ageing-report-2023',
  },
  {
    id: 'lasi-living-alone-and-morbidity',
    geography: 'India',
    metric: 'Elderly living alone or with spouse only, and chronic morbidity prevalence',
    exactValue: '5.7% living alone · ~20% living with spouse only · ~45% report chronic condition',
    populationScope: 'Adults aged 60+ surveyed in India (LASI Wave 1)',
    measurementYear: '2017–2018 (Published 2020)',
    dataType: 'Actual Census / Survey',
    sourceOrganization: 'IIPS, Ministry of Health & Family Welfare (MoHFW), Harvard T.H. Chan School',
    reportTitle: 'Longitudinal Ageing Study in India (LASI) Wave 1 National Report',
    publicationYear: 2020,
    sourceUrl: 'https://www.iipsindia.ac.in/lasi',
  },
];

export const IMPACT_PROJECTIONS: ImpactProjectionRow[] = [
  {
    horizon: 'Current Reference (Public Baseline)',
    category: 'Baseline (Published Context)',
    targetEldersSupported: 'Prototype demonstration (1 synthetic patient cluster)',
    caregiverHoursSavedPerYear: '0 claimed (demo mode)',
    transportSavingsInr: '₹0 claimed',
    transportSavingsUsd: '$0 claimed',
    healthcareEfficiencyInr: '₹0 claimed',
    healthcareEfficiencyUsd: '$0 claimed',
    methodologyNote: 'Prototype uses synthetic demo data only; no fabricated live adoption or savings claimed.',
  },
  {
    horizon: '5-Year Illustrative Scale Scenario (100,000 Elders)',
    category: '5-Year Scenario (DEMO Assumption)',
    targetEldersSupported: '100,000 elderly users (hypothetical target)',
    caregiverHoursSavedPerYear: '10.4 million hrs/yr (assumes 2 hrs/week coordination saved)',
    transportSavingsInr: '₹36.0 Crore / yr',
    transportSavingsUsd: '$4.3M / yr',
    healthcareEfficiencyInr: '₹120.0 Crore / yr',
    healthcareEfficiencyUsd: '$14.4M / yr',
    methodologyNote: 'Hypothetical economic model assuming ₹3,600/yr transport bundling & ₹12,000/yr avoided preventable ER visits per enrolled senior at ₹83.5/USD.',
  },
  {
    horizon: '10-Year Illustrative Scale Scenario (1,000,000 Elders)',
    category: '10-Year Scenario (DEMO Assumption)',
    targetEldersSupported: '1,000,000 elderly users (hypothetical national + CSR scale)',
    caregiverHoursSavedPerYear: '104.0 million hrs/yr (assumes 2 hrs/week saved)',
    transportSavingsInr: '₹360.0 Crore / yr',
    transportSavingsUsd: '$43.1M / yr',
    healthcareEfficiencyInr: '₹1,200.0 Crore / yr',
    healthcareEfficiencyUsd: '$143.7M / yr',
    methodologyNote: 'Hypothetical 10-year projection assuming public-private NPHCE/NGO adoption and subsidized CSR tiers. Clearly labelled DEMO projection.',
  },
];

export const GOVERNMENT_INITIATIVES = [
  {
    name: 'National Programme for Health Care of the Elderly (NPHCE)',
    alignment: 'SENIORA can complement NPHCE geriatric outpatient follow-ups by helping seniors track medication adherence and schedule visits in local languages.',
    disclaimer: 'Conceptual alignment only — not an official government integration or endorsement.',
  },
  {
    name: 'Ayushman Bharat — Health & Wellness Centres / PM-JAY',
    alignment: 'Supports preventive lifestyle reminders, hydration, and regular checkup coordination aligned with primary geriatric wellness goals.',
    disclaimer: 'Conceptual alignment only — requires formal institutional onboarding for any live linkage.',
  },
  {
    name: 'Ayushman Bharat Digital Mission (ABDM)',
    alignment: 'Consent-first health record sharing architecture mirrors ABDM principles where elderly patients explicitly approve doctor and caregiver access.',
    disclaimer: 'Architecture prepared for future consent-artifact standards; no live ABHA connection in demo.',
  },
];
