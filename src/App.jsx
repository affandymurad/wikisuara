import Header from './components/Header.jsx';
import Stepper from './components/Stepper.jsx';
import Toast from './components/Toast.jsx';
import ProfileStep from './modules/profile/ProfileStep.jsx';
import LanguagesStep from './modules/languages/LanguagesStep.jsx';
import HardwareStep from './modules/hardware/HardwareStep.jsx';
import ListStep from './modules/list/ListStep.jsx';
import RecordStep from './modules/record/RecordStep.jsx';
import ReviewStep from './modules/review/ReviewStep.jsx';
import { useApp } from './state/AppContext.jsx';
import { useT } from './lib/i18n.js';

export default function App() {
  const { step } = useApp();
  const { t } = useT();

  const renderActiveStep = () => {
    switch (step) {
      case 1:
        return <ProfileStep />;
      case 2:
        return <LanguagesStep />;
      case 3:
        return <HardwareStep />;
      case 4:
        return <ListStep />;
      case 5:
        return <RecordStep />;
      case 6:
        return <ReviewStep />;
      default:
        return <ProfileStep />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Sticky Header */}
      <Header />

      <main className="wrap flex-1 py-8 md:py-12">
        {/* Hero Section (Wikirekap style) */}
        <section className="mb-10 anim-rise">
          <div className="mb-3">
            <span className="badge">
              ● <span>{t('heroBadge')}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] my-4 text-[var(--ink)]">
            {t('heroTitle')}{' '}
            <em className="not-italic bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] bg-clip-text text-transparent">
              {t('heroTitleEm')}
            </em>
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
            {t('heroLead')}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <span className="chip-tag">{t('chipWav')}</span>
            <span className="chip-tag">{t('chipNoLogin')}</span>
            <span className="chip-tag">{t('chipAutoNaming')}</span>
            <span className="chip-tag">{t('chipZipExport')}</span>
          </div>

        </section>

        {/* Main Workspace Layout: Left Stepper (lg:col-span-4), Right Step Workspace (lg:col-span-8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <Stepper />
          </div>

          <div className="lg:col-span-8">
            {renderActiveStep()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--line)] py-8 text-xs text-[var(--muted)]">
        <div className="wrap flex flex-wrap items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} <strong className="text-[var(--ink)]">Wikisuara</strong> · {t('footerNote')}
          </div>
          <div className="flex items-center gap-4">
            <span>Format: <code>WS-&#123;QID&#125; (&#123;kode&#125;)-&#123;kemahiran&#125;-&#123;penutur&#125;-&#123;kata&#125;.wav</code></span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast />
    </div>
  );
}
