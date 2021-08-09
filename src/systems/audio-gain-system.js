const CLIPPING_GAIN = 0.0001;

const distanceModels = {
  linear: function(distance, rolloffFactor, refDistance, maxDistance) {
    return 1.0 - rolloffFactor * ((distance - refDistance) / (maxDistance - refDistance));
  },
  inverse: function(distance, rolloffFactor, refDistance) {
    return refDistance / (refDistance + rolloffFactor * (Math.max(distance, refDistance) - refDistance));
  },
  exponential: function(distance, rolloffFactor, refDistance) {
    return Math.pow(Math.max(distance, refDistance) / refDistance, -rolloffFactor);
  }
};

const updateAttenuation = (() => {
  const listenerPos = new THREE.Vector3();
  const sourcePos = new THREE.Vector3();
  return source => {
    source.el.sceneEl.audioListener.getWorldPosition(listenerPos);
    source.audioRef.getWorldPosition(sourcePos);
    const distance = sourcePos.distanceTo(listenerPos);
    if (source.audioRef.panner) {
      return distanceModels[source.audioRef.panner.distanceModel](
        distance,
        source.audioRef.panner.rolloffFactor,
        source.audioRef.panner.refDistance,
        source.audioRef.panner.maxDistance
      );
    } else {
      return 1.0;
    }
  };
})();

export class GainSystem {
  constructor() {
    this.sources = [];
    this.onPrefsUpdated = this.updatePrefs.bind(this);
    window.APP.store.addEventListener("statechanged", this.onPrefsUpdated);
  }

  remove() {
    this.sources = [];
    window.APP.store.removeEventListener("statechanged", this.onPrefsUpdated);
  }

  registerSource(source) {
    this.sources.push(source);
  }

  unregisterSource(source) {
    const index = this.sources.indexOf(source);

    if (index !== -1) {
      this.sources.splice(index, 1);
    }
  }

  tick() {
    this.sources.forEach(source => {
      if (source.audioRef && source.data.clippingEnabled) {
        const att = updateAttenuation(source);
        if (att < source.data.clippingThreshold) {
          if (source.audioRef.gain.gain.value > 0 && !source.data.isClipped) {
            source.clipGain(CLIPPING_GAIN);
          }
        } else if (source.data.isClipped) {
          source.unclipGain();
        }
      } else if (source.data.isClipped) {
        source.unclipGain();
      }
    });
  }

  updatePrefs() {
    this.sources.forEach(source => {
      source.updateClipping();
    });
  }
}
