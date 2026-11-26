import React, { useState } from 'react';
import { PhoneCall, Plus, ShieldAlert, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import type { EmergencyContact, EmergencyEvent, LanguageCode } from '../types';

interface EmergencyModalProps {
  open: boolean;
  onClose: () => void;
  language: LanguageCode;
  contacts: EmergencyContact[];
  events: EmergencyEvent[];
  address: string;
  onTriggerSos: (locationConsent: boolean, notes: string) => Promise<void>;
  onAddContact: (name: string, relationship: 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital', phone: string) => Promise<void>;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  open,
  onClose,
  language,
  contacts,
  events,
  address,
  onTriggerSos,
  onAddContact,
}) => {
  const [locationConsent, setLocationConsent] = useState(true);
  const [notes, setNotes] = useState('');
  const [alertSent, setAlertSent] = useState(false);
  const [cName, setCName] = useState('');
  const [cRelation, setCRelation] = useState<'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital'>('neighbour');
  const [cPhone, setCPhone] = useState('');

  if (!open) return null;

  const t = TRANSLATIONS[language].emergency;
  const systemHelplines = contacts.filter((c) => c.isSystemDefault);
  const personalContacts = contacts.filter((c) => !c.isSystemDefault);

  const handleConfirmSos = async () => {
    await onTriggerSos(locationConsent, notes);
    setAlertSent(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;
    await onAddContact(cName.trim(), cRelation, cPhone.trim());
    setCName('');
    setCPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#382C27]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 bg-[#783F45] text-[#FAF3E8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 shrink-0 text-[#E8D5B5]" />
            <div>
              <h2 className="text-xl font-bold">{t.title}</h2>
              <p className="text-sm text-[#FAF3E8]/90">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAlertSent(false);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#613136] hover:bg-[#4E262A] text-[#FAF3E8]"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Confirm Emergency Alert */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF3E8] to-[#F3E4CC] border-2 border-[#C46A4A] space-y-4">
            <h3 className="text-lg font-bold text-[#382C27]">{t.confirmPrompt}</h3>
            <label className="flex items-start gap-2.5 text-sm text-[#382C27] cursor-pointer">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(e) => setLocationConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#355C48]"
              />
              <span>
                {t.consentLocation} ({address})
              </span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note (e.g., Feeling dizzy / knee injury)"
              className="w-full px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-base"
            />
            <button
              type="button"
              onClick={handleConfirmSos}
              className="w-full py-4 px-5 rounded-2xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-bold text-lg shadow-sm transition-colors"
            >
              {t.triggerAlertBtn}
            </button>
            {alertSent && (
              <div className="p-3 rounded-xl bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27] text-sm font-semibold">
                {t.alertRecorded}
              </div>
            )}
            <p className="text-xs text-[#63534B] leading-relaxed">{t.honestNotice}</p>
          </div>

          {/* India Emergency Helplines */}
          <div>
            <h3 className="text-base font-bold text-[#382C27] mb-3">{t.indiaNumbersTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemHelplines.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-[#E8D5B5] bg-[#FAF3E8] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-[#382C27]">{c.name}</div>
                    <div className="text-lg font-mono-num font-bold text-[#783F45]">{c.phone}</div>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="px-4 py-2.5 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-semibold text-sm flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {t.callNow} {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Trusted Contacts */}
          <div>
            <h3 className="text-base font-bold text-[#382C27] mb-3">{t.trustedContactsTitle}</h3>
            <div className="space-y-2.5">
              {personalContacts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-[#E8D5B5] bg-[#FAF3E8] flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-[#382C27]">{c.name}</div>
                    <div className="text-sm text-[#63534B]">
                      {c.relationship} · <span className="font-mono-num">{c.phone}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-semibold text-sm flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {t.callNow}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Contact */}
          <form onSubmit={handleSaveContact} className="p-4 rounded-2xl border border-[#E8D5B5] bg-[#F3E7D2] space-y-3">
            <h4 className="font-bold text-[#382C27] text-sm">{t.addContactTitle}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Name"
                className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
              />
              <select
                value={cRelation}
                onChange={(e) =>
                  setCRelation(e.target.value as 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital')
                }
                className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
              >
                <option value="neighbour">Neighbour</option>
                <option value="family">Family</option>
                <option value="caregiver">Caregiver</option>
                <option value="doctor">Personal Doctor</option>
                <option value="hospital">Nearby Hospital</option>
              </select>
              <input
                type="tel"
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                placeholder="Phone (+91...)"
                className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-semibold text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t.saveContactBtn}
            </button>
          </form>

          {events.length > 0 && (
            <div className="text-xs text-[#63534B] border-t border-[#E8D5B5] pt-3">
              Recent SOS Log: {events[0].trigger} · {events[0].status} ({new Date(events[0].createdAt).toLocaleString()})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
