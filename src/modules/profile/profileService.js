/**
 * Profile service helpers
 */
export function validateSpeakerName(name) {
  const clean = (name || '').trim();
  if (!clean) {
    return { valid: false, error: 'profileNameRequired' };
  }
  return { valid: true, name: clean };
}
