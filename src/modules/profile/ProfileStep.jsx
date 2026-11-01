import { useState } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import './profile.css';

export default function ProfileStep() {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    showToast,
  } = useApp();
  const { t } = useT();

  const [newProfileName, setNewProfileName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      showToast(t('profileNameRequired'), 'warn');
      return;
    }
    const created = addProfile(newProfileName.trim());
    if (created) {
      setNewProfileName('');
      setIsAdding(false);
      showToast('Profil baru ditambahkan', 'success');
    }
  };

  return (
    <Card
      eyebrow={t('profileEyebrow')}
      title={t('profileTitle')}
      lead={t('profileLead')}
      stepNumber={1}
      nextDisabled={!activeProfile?.name?.trim()}
    >
      <div className="space-y-6">
        {/* Active Profile Editor */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <label htmlFor="activeSpeakerName" className="block text-sm font-bold text-[var(--ink)] mb-1.5">
            {t('profileLabel')}
          </label>
          <div className="text-xs text-[var(--muted)] mb-3">
            {t('profileInfo')}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              id="activeSpeakerName"
              type="text"
              value={activeProfile?.name || ''}
              onChange={(e) => updateProfile(activeProfile.id, e.target.value)}
              placeholder={t('profilePlaceholder')}
              className="flex-1 font-semibold text-base"
              autoComplete="name"
            />
            {activeProfile?.isDefault && (
              <span className="self-center px-3 py-1.5 rounded-xl bg-[var(--soft)] text-[var(--brand-text)] border border-[var(--line)] text-xs font-bold whitespace-nowrap">
                {t('profileDefaultBadge')}
              </span>
            )}
          </div>
        </div>

        {/* Profiles List / Switcher */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--ink)]">Daftar Penutur ({profiles.length})</span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="icon-btn text-xs py-1.5 px-3"
              >
                + {t('profileAddBtn')}
              </button>
            )}
          </div>

          {/* Add Profile Inline Form */}
          {isAdding && (
            <form onSubmit={handleAddProfile} className="mb-4 p-4 rounded-xl border border-[var(--brand-2)] bg-[var(--soft)] flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder={t('profilePlaceholder')}
                className="flex-1 min-w-[200px] text-sm"
                autoFocus
              />
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewProfileName('');
                }}
                className="icon-btn text-xs py-2 px-3"
              >
                Batal
              </button>
            </form>
          )}

          {/* Grid of profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const isActive = p.id === activeProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`profile-card flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer ${
                    isActive ? 'active' : 'border-[var(--line)] bg-[var(--surface)]'
                  }`}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-xl grid place-items-center font-bold text-xs ${
                        isActive
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-[var(--soft)] text-[var(--muted)]'
                      }`}
                    >
                      {p.name.trim().charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-[var(--ink)] truncate">{p.name.trim() || 'Belum diisi'}</div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {p.isDefault ? t('profileDefaultBadge') : isActive ? t('profileActiveBadge') : 'Penutur'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    {isActive ? (
                      <span className="h-6 w-6 rounded-full bg-[var(--brand)] text-white grid place-items-center text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      !p.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deleteProfile(p.id)) {
                              showToast('Profil dihapus', 'info');
                            }
                          }}
                          className="text-xs text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-1.5 rounded-lg"
                          title={t('profileDeleteBtn')}
                        >
                          ✕
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Information Callout */}
        <div className="hint">
          <svg className="w-4 h-4 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            Data profil tersimpan sepenuhnya di browser lokal Anda tanpa dikirim ke server.
          </div>
        </div>
      </div>
    </Card>
  );
}
