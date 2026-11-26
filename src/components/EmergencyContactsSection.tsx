import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Edit3,
  PhoneCall,
  Plus,
  ShieldAlert,
  Star,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import type { EmergencyContact, EmergencyEvent, LanguageCode } from '../types';

export function resolvePrimaryAndSecondaryContacts(contacts: EmergencyContact[]): {
  primary: EmergencyContact | null;
  secondary: EmergencyContact | null;
  additional: EmergencyContact[];
  helplines: EmergencyContact[];
} {
  const helplines = contacts.filter((c) => c.isSystemDefault);
  const personal = contacts.filter((c) => !c.isSystemDefault);

  const primary =
    personal.find((c) => c.priority === 'primary') || personal[0] || null;
  const remainingAfterPrimary = personal.filter((c) => c.id !== primary?.id);
  const secondary =
    remainingAfterPrimary.find((c) => c.priority === 'secondary') ||
    remainingAfterPrimary[0] ||
    null;
  const additional = remainingAfterPrimary.filter((c) => c.id !== secondary?.id);

  return { primary, secondary, additional, helplines };
}

export function formatRelationshipLabel(
  contact: EmergencyContact,
  lang: LanguageCode = 'en'
): string {
  if (contact.relationshipDetail) return contact.relationshipDetail;
  const map: Record<LanguageCode, Record<string, string>> = {
    en: {
      family: 'Family Member',
      neighbour: 'Neighbour',
      caregiver: 'Caregiver',
      doctor: 'Personal Doctor',
      hospital: 'Hospital',
      national_emergency: 'National Emergency',
      ambulance: 'Ambulance',
      fire: 'Fire & Rescue',
      police: 'Police',
    },
    ta: {
      family: 'குடும்ப உறுப்பினர்',
      neighbour: 'அண்டை வீட்டார்',
      caregiver: 'பராமரிப்பாளர்',
      doctor: 'தனிப்பட்ட மருத்துவர்',
      hospital: 'மருத்துவமனை',
      national_emergency: 'தேசிய அவசர எண்',
      ambulance: 'அவசர ஊர்தி',
      fire: 'தீயணைப்பு',
      police: 'காவல்துறை',
    },
    hi: {
      family: 'परिवार के सदस्य',
      neighbour: 'पड़ोसी',
      caregiver: 'देखभालकर्ता',
      doctor: 'व्यक्तिगत डॉक्टर',
      hospital: 'अस्पताल',
      national_emergency: 'राष्ट्रीय आपातकाल',
      ambulance: 'एम्बुलेंस',
      fire: 'अग्निशमन',
      police: 'पुलिस',
    },
  };
  return map[lang][contact.relationship] || contact.relationship;
}

interface EmergencyContactsSectionProps {
  contacts: EmergencyContact[];
  events?: EmergencyEvent[];
  language?: LanguageCode;
  canEdit: boolean;
  compact?: boolean;
  onOpenEmergency: () => void;
  onAddContact?: (payload: {
    name: string;
    relationship: 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital';
    relationshipDetail?: string;
    phone: string;
    priority: 'primary' | 'secondary';
  }) => Promise<boolean>;
  onUpdateContact?: (
    id: string,
    payload: {
      name?: string;
      relationship?: 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital';
      relationshipDetail?: string;
      phone?: string;
      priority?: 'primary' | 'secondary';
    }
  ) => Promise<boolean>;
  onDeleteContact?: (id: string) => Promise<boolean>;
}

export const EmergencyContactsSection: React.FC<EmergencyContactsSectionProps> = ({
  contacts,
  events = [],
  language = 'en',
  canEdit,
  compact = false,
  onOpenEmergency,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const t = TRANSLATIONS[language].dashboard;
  const { primary, secondary, additional, helplines } =
    resolvePrimaryAndSecondaryContacts(contacts);
  const national112 = helplines.find((h) => h.phone === '112') || helplines[0];

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<
    'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital'
  >('family');
  const [relationshipDetail, setRelationshipDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [priority, setPriority] = useState<'primary' | 'secondary'>('primary');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeEvent = events.find((e) => e.status === 'active');

  const openAddForm = (defaultPriority: 'primary' | 'secondary') => {
    setEditingId(null);
    setName('');
    setRelationship('family');
    setRelationshipDetail('');
    setPhone('');
    setPriority(defaultPriority);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    const validRel = ['family', 'neighbour', 'caregiver', 'doctor', 'hospital'].includes(
      contact.relationship
    )
      ? (contact.relationship as 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital')
      : 'family';
    setRelationship(validRel);
    setRelationshipDetail(contact.relationshipDetail || '');
    setPhone(contact.phone);
    setPriority(contact.priority === 'primary' || primary?.id === contact.id ? 'primary' : 'secondary');
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 2) {
      setFormError('Please enter a contact name (at least 2 characters).');
      return;
    }
    if (!/^[+\d\s()-]{3,24}$/.test(cleanPhone) || cleanPhone.replace(/\D/g, '').length < 3) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    setBusy(true);
    let ok = false;
    if (editingId && onUpdateContact) {
      ok = await onUpdateContact(editingId, {
        name: cleanName,
        relationship,
        relationshipDetail: relationshipDetail.trim() || undefined,
        phone: cleanPhone,
        priority,
      });
    } else if (onAddContact) {
      ok = await onAddContact({
        name: cleanName,
        relationship,
        relationshipDetail: relationshipDetail.trim() || undefined,
        phone: cleanPhone,
        priority,
      });
    }
    setBusy(false);
    if (ok) {
      setFormOpen(false);
      setEditingId(null);
    } else {
      setFormError('Unable to save contact right now. Please check your input.');
    }
  };

  const renderContactCard = (
    contact: EmergencyContact | null,
    tierLabel: string,
    slotPriority: 'primary' | 'secondary'
  ) => {
    const isPrimarySlot = slotPriority === 'primary';
    if (!contact) {
      return (
        <div className="h-full p-5 rounded-2xl border border-dashed border-[#D9C098] bg-[#FAF3E8]/70 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#783F45]">{tierLabel}</div>
            <p className="text-sm text-[#63534B]">
              {isPrimarySlot ? t.noPrimaryContact : t.noSecondaryContact}
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => openAddForm(slotPriority)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>{t.addContactBtn}</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        className={`h-full p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
          isPrimarySlot
            ? 'bg-gradient-to-br from-[#FAF3E8] to-[#F3E7D2] border-[#C46A4A]/50'
            : 'bg-[#FAF3E8] border-[#E8D5B5]'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#783F45] flex items-center gap-1.5">
              {isPrimarySlot && <Star className="w-3.5 h-3.5 text-[#C46A4A] fill-[#C46A4A] shrink-0" />}
              <span>{tierLabel}</span>
            </span>
            {canEdit && (
              <div className="flex items-center gap-1">
                {!isPrimarySlot && onUpdateContact && (
                  <button
                    type="button"
                    onClick={() => onUpdateContact(contact.id, { priority: 'primary' })}
                    title={t.setPrimaryBtn}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-[#355C48] hover:bg-[#EFF3EC] transition-colors"
                  >
                    {t.setPrimaryBtn}
                  </button>
                )}
                {onUpdateContact && (
                  <button
                    type="button"
                    onClick={() => openEditForm(contact)}
                    aria-label={`${t.editContactBtn} ${contact.name}`}
                    className="p-1.5 rounded-lg text-[#63534B] hover:text-[#382C27] hover:bg-[#E8D5B5]/60 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onDeleteContact && (
                  <button
                    type="button"
                    onClick={() => onDeleteContact(contact.id)}
                    aria-label={`${t.removeContactBtn} ${contact.name}`}
                    className="p-1.5 rounded-lg text-[#63534B] hover:text-[#783F45] hover:bg-[#F7ECEE] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#382C27] leading-snug">{contact.name}</h3>
            <p className="text-sm text-[#63534B] mt-0.5">
              {formatRelationshipLabel(contact, language)}
            </p>
          </div>

          <div className="text-base font-mono-num font-bold text-[#382C27] pt-0.5">
            {contact.phone}
          </div>
        </div>

        <a
          href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
            isPrimarySlot
              ? 'bg-[#355C48] hover:bg-[#294838] text-white shadow-sm'
              : 'bg-[#FFFDF9] hover:bg-[#F3E7D2] text-[#382C27] border border-[#D9C098]'
          }`}
        >
          <PhoneCall className="w-4 h-4 shrink-0" />
          <span>{TRANSLATIONS[language].emergency.callNow}</span>
        </a>
      </div>
    );
  };

  return (
    <section
      aria-labelledby="emergency-contacts-heading"
      className="bg-[#FFFDF9] rounded-3xl border border-[#C46A4A]/45 p-6 space-y-5 shadow-sm"
    >
      {/* Aligned Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8D5B5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#783F45] shrink-0" />
            <h2
              id="emergency-contacts-heading"
              className="text-xl font-bold text-[#382C27] leading-snug"
            >
              {t.emergencyContactsTitle}
            </h2>
          </div>
          <p className="text-sm text-[#63534B]">{t.emergencyContactsSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => openAddForm(primary ? 'secondary' : 'primary')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] hover:bg-[#F3E7D2] text-[#382C27] font-semibold text-sm inline-flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              <Plus className="w-4 h-4 text-[#C46A4A] shrink-0" />
              <span>{t.addContactBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap shadow-sm transition-colors"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{t.emergencyAssistBtn}</span>
          </button>
        </div>
      </div>

      {/* Live Active Emergency Status Banner if triggered */}
      {activeEvent && (
        <div className="p-4 rounded-2xl bg-[#F7ECEE] border border-[#783F45]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#783F45] shrink-0 mt-0.5" />
            <div className="text-sm space-y-0.5">
              <div className="font-bold text-[#783F45]">
                Active Emergency Request · Status: {activeEvent.status} · Delivery: {activeEvent.deliveryStatus}
              </div>
              <div className="text-[#382C27]">
                {activeEvent.notes} · {activeEvent.locationLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] text-xs font-bold whitespace-nowrap shrink-0"
          >
            View Status &amp; Call Options
          </button>
        </div>
      )}

      {/* Inline Add / Edit Form */}
      {formOpen && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-[#F3E7D2]/70 border border-[#D9C098] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#382C27]">
              {editingId ? `${t.editContactBtn} Emergency Contact` : t.addContactBtn}
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="p-1.5 rounded-lg text-[#63534B] hover:bg-[#E8D5B5]"
              aria-label="Close contact form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#382C27] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Meenakshi / Arjun"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#382C27] mb-1">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) =>
                  setRelationship(
                    e.target.value as 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital'
                  )
                }
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
              >
                <option value="family">Family Member</option>
                <option value="neighbour">Neighbour</option>
                <option value="caregiver">Caregiver</option>
                <option value="doctor">Personal Doctor</option>
                <option value="hospital">Nearby Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#382C27] mb-1">
                Specific Role (Optional)
              </label>
              <input
                type="text"
                value={relationshipDetail}
                onChange={(e) => setRelationshipDetail(e.target.value)}
                placeholder="e.g., Daughter, Son, Next-door"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#382C27] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98400 00000"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm font-mono-num"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#382C27]">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority('primary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  priority === 'primary'
                    ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                    : 'bg-[#FFFDF9] text-[#382C27] border-[#D9C098]'
                }`}
              >
                Primary Contact
              </button>
              <button
                type="button"
                onClick={() => setPriority('secondary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  priority === 'secondary'
                    ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                    : 'bg-[#FFFDF9] text-[#382C27] border-[#D9C098]'
                }`}
              >
                Secondary Contact
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingId(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#355C48] hover:bg-[#294838] disabled:opacity-50 text-white text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Contact</span>
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-sm font-semibold text-[#783F45]">{formError}</p>
          )}
        </form>
      )}

      {/* Uniform 3-Column Equal-Height Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {renderContactCard(primary, t.primaryContactLabel, 'primary')}
        {renderContactCard(secondary, t.secondaryContactLabel, 'secondary')}

        {/* Third Column: Additional Contacts & 112 National Helpline */}
        <div className="h-full p-5 rounded-2xl border border-[#E8D5B5] bg-[#FAF3E8] flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#63534B]">
              {t.nationalHelplineTitle}
            </div>
            {national112 && (
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E8D5B5]">
                <div>
                  <div className="font-bold text-[#382C27]">{national112.name}</div>
                  <div className="text-lg font-mono-num font-bold text-[#783F45]">
                    {national112.phone}
                  </div>
                </div>
                <a
                  href={`tel:${national112.phone}`}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{national112.phone}</span>
                </a>
              </div>
            )}

            {!compact && additional.length > 0 ? (
              <div className="space-y-2">
                {additional.slice(0, 2).map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#382C27] truncate">{extra.name}</div>
                      <div className="text-xs text-[#63534B] font-mono-num">
                        {formatRelationshipLabel(extra, language)} · {extra.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`tel:${extra.phone.replace(/[^\d+]/g, '')}`}
                        className="p-2 rounded-lg bg-[#EFF3EC] text-[#355C48] hover:bg-[#DCE7D6]"
                        aria-label={`Call ${extra.name}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                      {canEdit && onDeleteContact && (
                        <button
                          type="button"
                          onClick={() => onDeleteContact(extra.id)}
                          aria-label={`Remove ${extra.name}`}
                          className="p-2 rounded-lg text-[#63534B] hover:text-[#783F45] hover:bg-[#F7ECEE]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#63534B] leading-relaxed">
                112 connects to ambulance, police, and fire support across India.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenEmergency}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F3E7D2] border border-[#D9C098] text-[#382C27] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {t.manageContactsBtn}
          </button>
        </div>
      </div>
    </section>
  );
};
