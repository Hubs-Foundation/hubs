export const MAX_VOLUME_LABELS = 21;
export const MAX_GAIN_MULTIPLIER = 8;
export const SMALL_GAIN_STEP = 1 / (MAX_VOLUME_LABELS / 2);
export const SMALL_LEVEL_STEP = 1 / (MAX_GAIN_MULTIPLIER / 2);
export const BIG_GAIN_STEP = (MAX_GAIN_MULTIPLIER - 1) / (MAX_VOLUME_LABELS / 2);
export const BIG_LEVEL_STEP = 1;
export const DEFAULT_VOLUME_BAR_MULTIPLIER = 1.0;

export function calcGainStepUp(gainMultiplier) {
  return gainMultiplier > 1 - SMALL_GAIN_STEP ? BIG_GAIN_STEP : SMALL_GAIN_STEP;
}

export function calcGainStepDown(gainMultiplier) {
  return gainMultiplier > 1 + SMALL_GAIN_STEP ? BIG_GAIN_STEP : SMALL_GAIN_STEP;
}

export function calcLevel(gainMultiplier) {
  return Math.min(
    MAX_VOLUME_LABELS - 1,
    gainMultiplier <= 1.001
      ? Math.floor(gainMultiplier / SMALL_GAIN_STEP)
      : Math.floor(MAX_VOLUME_LABELS / 2 + (gainMultiplier - 1) / BIG_GAIN_STEP)
  );
}

export function calcGainMultiplier(level) {
  return Math.min(
    MAX_GAIN_MULTIPLIER,
    level <= MAX_VOLUME_LABELS / 2 ? level * SMALL_GAIN_STEP : 1 + (level - MAX_VOLUME_LABELS / 2) * BIG_GAIN_STEP
  );
}

export function updateAvatarVolumesPref(displayName, gainMultiplier, muted) {
  const avatarVoiceLevels = APP.store.state.preferences.avatarVoiceLevels || {};
  avatarVoiceLevels[displayName] = {
    gainMultiplier,
    muted
  };
  APP.store.update({
    preferences: {
      avatarVoiceLevels: avatarVoiceLevels
    }
  });
}

export function getAvatarVolumePref(displayName) {
  return APP.store.state.preferences.avatarVoiceLevels?.[displayName];
}
