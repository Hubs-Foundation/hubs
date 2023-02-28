// This computation is expensive, so we run on at most one avatar per frame, including quiet avatars.
// However if we detect an avatar is seen speaking (its volume is above DISABLE_AT_VOLUME_THRESHOLD)
// then we continue analysis for at least DISABLE_GRACE_PERIOD_MS and disable doing it every frame if
// the avatar is quiet during that entire duration (eg they are muted)
export const DISABLE_AT_VOLUME_THRESHOLD = 0.00001;
export const DISABLE_GRACE_PERIOD_MS = 10000;
export const IS_TALKING_THRESHOLD_MS = 1000;
export const MIN_VOLUME_THRESHOLD = 0.08;

type VolumeUpdaterParams = {
  analyser: AnalyserNode;
  levels: Uint8Array;
  volume: number;
  prevVolume: number;
};

export const calculateVolume = (analyser: AnalyserNode, levels: Uint8Array) => {
  // take care with compatibility, e.g. safari doesn't support getFloatTimeDomainData
  analyser.getByteTimeDomainData(levels);
  let sum = 0;
  for (let i = 0; i < levels.length; i++) {
    const amplitude = (levels[i] - 128) / 128;
    sum += amplitude * amplitude;
  }
  const currVolume = Math.sqrt(sum / levels.length);
  return currVolume;
};

export const updateVolume = (params: VolumeUpdaterParams): number => {
  const { volume, prevVolume, analyser, levels } = params;

  const newRawVolume = calculateVolume(analyser, levels);
  const newPerceivedVolume = Math.log(THREE.MathUtils.mapLinear(newRawVolume, 0, 1, 1, Math.E));
  const newVolume = newPerceivedVolume < MIN_VOLUME_THRESHOLD ? 0 : newPerceivedVolume;
  const s = newVolume > prevVolume ? 0.35 : 0.3;
  return s * newVolume + (1 - s) * prevVolume;
};
