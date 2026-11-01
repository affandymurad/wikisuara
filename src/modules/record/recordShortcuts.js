import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts during recording:
 * - Space: Start / Stop recording (prevent page scroll)
 * - ArrowRight: Next word
 * - ArrowLeft: Previous word
 */
export function useRecordShortcuts({
  onToggleRecord,
  onNextWord,
  onPrevWord,
  enabled = true,
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onToggleRecord();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNextWord();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrevWord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleRecord, onNextWord, onPrevWord, enabled]);
}
