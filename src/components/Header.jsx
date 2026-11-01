import { useState, useEffect } from 'react';
import { useT } from '../lib/i18n.js';
import AboutModal from './AboutModal.jsx';
import { getStoredTheme, setTheme } from '../lib/theme.js';

export default function Header() {
  const { lang, toggleLanguage, t } = useT();
  const [showAbout, setShowAbout] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    setIsDark(nextTheme === 'dark');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--line)_80%,transparent)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        {/* Logo and Brand */}
        <a href="#top" className="flex items-center gap-2.5 font-extrabold text-[17px] tracking-tight text-[var(--ink)] no-underline">
          <i
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white shadow-md shadow-[rgba(45,79,156,0.3)]"
            style={{ boxShadow: '0 4px 12px rgba(45, 79, 156, .25), inset 0 1px 0 rgba(255, 255, 255, .3)' }}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </i>
          <span className="hidden min-[420px]:inline">{t('appName')}</span>
          <span className="hidden sm:inline-block rounded-full bg-[var(--soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-text)] border border-[var(--line)]">
            {t('appShort')}
          </span>
        </a>

        {/* Tools: About, Author, Theme switch & Language switch */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="header-btn"
            title={t('aboutBtn')}
            aria-label={t('aboutBtn')}
          >
            <svg className="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span className="hidden md:inline">{t('aboutBtn')}</span>
          </button>
          <a
            href="https://affandymurad.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="header-btn"
            title={t('authorBtn')}
            aria-label={t('authorBtn')}
          >
            <svg className="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="hidden md:inline">{t('authorBtn')}</span>
          </a>

          {/* Theme switch (sun / moon) */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={handleToggleTheme}
            className="switch"
            title={t('themeToggle')}
            aria-label={t('themeToggle')}
          >
            <i></i>
            <span>
              {/* Sun icon */}
              <svg className="h-4 w-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            <span>
              {/* Moon icon */}
              <svg className="h-4 w-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </span>
          </button>

          {/* Language switch (ID / EN) */}
          <button
            type="button"
            role="switch"
            aria-checked={lang === 'en'}
            onClick={toggleLanguage}
            className="switch"
            title={t('langToggle')}
            aria-label={t('langToggle')}
          >
            <i></i>
            <span>ID</span>
            <span>EN</span>
          </button>
        </div>
      </div>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </header>
  );
}
