import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExternalLink, Globe2, Landmark, Building2 } from 'lucide-react';
import type { LanguageCode } from '../types';
import { safeReadResponseJson } from '../services/safeJson';

interface OfficialStat {
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

interface ProjectionRow {
  horizon: string;
  category: string;
  targetEldersSupported: string;
  caregiverHoursSavedPerYear: string;
  transportSavingsInr: string;
  transportSavingsUsd: string;
  healthcareEfficiencyInr: string;
  healthcareEfficiencyUsd: string;
  methodologyNote: string;
}

interface GovInitiative {
  name: string;
  alignment: string;
  disclaimer: string;
}

export const GlobalImpactPage: React.FC<{ language?: LanguageCode }> = ({ language = 'en' }) => {
  const [stats, setStats] = useState<OfficialStat[]>([]);
  const [projections, setProjections] = useState<ProjectionRow[]>([]);
  const [initiatives, setInitiatives] = useState<GovInitiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/official')
      .then((r) =>
        safeReadResponseJson<{
          statistics?: OfficialStat[];
          projections?: ProjectionRow[];
          initiatives?: GovInitiative[];
        }>(r, {})
      )
      .then((parsed) => {
        setStats(parsed.data.statistics || []);
        setProjections(parsed.data.projections || []);
        setInitiatives(parsed.data.initiatives || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const chartData = [
    { label: '2011 India (Census)', millions: 103.8 },
    { label: '2022 India (UNFPA)', millions: 149 },
    { label: '2036 India (Proj.)', millions: 227 },
    { label: '2050 India (Proj.)', millions: 347 },
  ];

  const heading =
    language === 'ta'
      ? 'முதியோர் உலகம் — SENIORA ஏன் அவசியம்'
      : language === 'hi'
      ? 'बढ़ती उम्र की दुनिया — SENIORA क्यों ज़रूरी है'
      : 'The Ageing World — Why SENIORA Matters';

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E8] to-[#F3E7D2] rounded-3xl border border-[#E8D5B5] p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#355C48] mb-2">
          <Globe2 className="w-4 h-4 text-[#9E4B30]" />
          <span>GLOBAL IMPACT · Official Demographics &amp; Projections</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#382C27]">{heading}</h2>
        <p className="text-base text-[#63534B] mt-2 max-w-3xl">
          Verified demographic measurements and official UN/WHO/MoSPI projections are strictly separated below from illustrative SENIORA platform projections (labelled DEMO).
        </p>

        {/* Chart: India 60+ Growth */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-64 bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-4">
            <div className="text-sm font-semibold text-[#382C27] mb-2">
              India Population Aged 60+ (Millions — Census 2011 &amp; UNFPA 2023 Projections)
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5B5" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#382C27' }} />
                <YAxis tick={{ fontSize: 12, fill: '#382C27' }} />
                <Tooltip />
                <Bar dataKey="millions" fill="#355C48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5]">
              <div className="text-xs font-semibold text-[#63534B]">GLOBAL 60+ (WHO, 2024)</div>
              <div className="text-2xl font-bold text-[#382C27] tabular-nums mt-1">1.0B → 2.1B</div>
              <div className="text-sm text-[#63534B]">2020 baseline to 2050 official projection</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5]">
              <div className="text-xs font-semibold text-[#63534B]">TAMIL NADU 60+ SHARE (MoSPI / UNFPA)</div>
              <div className="text-2xl font-bold text-[#382C27] tabular-nums mt-1">10.4% → 18.2%</div>
              <div className="text-sm text-[#63534B]">2011 Census to 2031 official state projection</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5]">
              <div className="text-xs font-semibold text-[#63534B]">LIVING ALONE / SPOUSE ONLY (LASI Wave 1)</div>
              <div className="text-2xl font-bold text-[#382C27] tabular-nums mt-1">5.7% alone · ~20% spouse</div>
              <div className="text-sm text-[#63534B]">Surveyed adults aged 60+ in India (2017–18)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cited Official Statistics Table */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 md:p-8">
        <h3 className="text-xl font-bold text-[#382C27] mb-4">
          Verified Official Statistics &amp; Citations
        </h3>
        {loading ? (
          <div className="text-sm text-[#63534B] py-4">Loading cited datasets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E8D5B5] text-[#63534B]">
                  <th className="py-3 pr-4 font-semibold">Scope</th>
                  <th className="py-3 pr-4 font-semibold">Statistic &amp; Definition</th>
                  <th className="py-3 pr-4 font-semibold">Exact Value</th>
                  <th className="py-3 pr-4 font-semibold">Type &amp; Year</th>
                  <th className="py-3 font-semibold">Official Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D5B5]">
                {stats.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="py-3.5 pr-4 font-semibold text-[#382C27] whitespace-nowrap">
                      {row.geography}
                    </td>
                    <td className="py-3.5 pr-4 text-[#382C27]">
                      <div className="font-medium text-[#382C27]">{row.metric}</div>
                      <div className="text-xs text-[#63534B] mt-0.5">{row.populationScope}</div>
                    </td>
                    <td className="py-3.5 pr-4 font-mono-num font-semibold text-[#355C48] whitespace-nowrap">
                      {row.exactValue}
                    </td>
                    <td className="py-3.5 pr-4 text-[#382C27]">
                      <div className="font-medium">{row.dataType}</div>
                      <div className="text-xs text-[#63534B]">{row.measurementYear}</div>
                    </td>
                    <td className="py-3.5 text-[#382C27]">
                      <div className="font-medium">{row.sourceOrganization} ({row.publicationYear})</div>
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#9E4B30] hover:underline mt-0.5"
                      >
                        {row.reportTitle}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial & Economic Impact (INR & USD) */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#9E4B30] mb-1">
          <Building2 className="w-4 h-4 text-[#C46A4A]" />
          <span>Financial &amp; Economic Impact Scenarios (INR ₹ &amp; USD $)</span>
        </div>
        <h3 className="text-xl font-bold text-[#382C27] mb-2">
          Current Baseline vs. 5-Year &amp; 10-Year DEMO Projections
        </h3>
        <p className="text-sm text-[#63534B] mb-5">
          Important: Rows marked DEMO Assumption represent hypothetical economic scenarios, not verified past revenue or realized savings.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {projections.map((p) => (
            <div key={p.horizon} className="p-5 rounded-2xl border border-[#E8D5B5] bg-[#FAF3E8] space-y-3">
              <div className="text-xs font-semibold text-[#783F45]">{p.category}</div>
              <h4 className="text-lg font-bold text-[#382C27]">{p.horizon}</h4>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="text-[#63534B]">Reach: </span>
                  <span className="font-semibold text-[#382C27]">{p.targetEldersSupported}</span>
                </div>
                <div>
                  <span className="text-[#63534B]">Caregiver Time Saved: </span>
                  <span className="font-mono-num font-semibold text-[#382C27]">{p.caregiverHoursSavedPerYear}</span>
                </div>
                <div>
                  <span className="text-[#63534B]">Transport Efficiency: </span>
                  <span className="font-mono-num font-semibold text-[#382C27]">
                    {p.transportSavingsInr} / {p.transportSavingsUsd}
                  </span>
                </div>
                <div>
                  <span className="text-[#63534B]">Preventive Care Value: </span>
                  <span className="font-mono-num font-semibold text-[#382C27]">
                    {p.healthcareEfficiencyInr} / {p.healthcareEfficiencyUsd}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#63534B] pt-2 border-t border-[#E8D5B5]">
                {p.methodologyNote}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Government & Business Ecosystem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#355C48] mb-2">
            <Landmark className="w-4 h-4 text-[#355C48]" />
            <span>Public Healthcare Alignment</span>
          </div>
          <h3 className="text-xl font-bold text-[#382C27] mb-4">
            Supporting National Elder Welfare Initiatives
          </h3>
          <div className="space-y-4">
            {initiatives.map((init) => (
              <div key={init.name} className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                <div className="font-bold text-[#382C27]">{init.name}</div>
                <p className="text-sm text-[#382C27] mt-1">{init.alignment}</p>
                <p className="text-xs text-[#63534B] mt-1.5">{init.disclaimer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6">
          <h3 className="text-xl font-bold text-[#382C27] mb-4">
            Sustainable Access &amp; Stakeholder Business Model
          </h3>
          <div className="space-y-3 text-sm text-[#382C27]">
            <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A]">
              <div className="font-bold text-[#382C27]">1. Sponsored Access for Low-Income Seniors (CSR &amp; NGO)</div>
              <p className="mt-1">Zero-cost voice companion access funded through CSR elder-care grants and NGO partnerships.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
              <div className="font-bold text-[#382C27]">2. Family Subscription Tier</div>
              <p className="mt-1">Remote wellbeing summaries, Voices of Love greetings, and appointment coordination for NRI/distant families.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
              <div className="font-bold text-[#382C27]">3. Hospital, Pharmacy &amp; Mobility Partnerships</div>
              <p className="mt-1">Coordinated follow-up adherence, verified medicine fulfillment, and wheelchair-accessible clinic transport.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
