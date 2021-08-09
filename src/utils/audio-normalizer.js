// Inserts analyser and gain nodes after audio source.
// Analyses audio source volume and adjusts gain value
// to make it in a certain range.
export class AudioNormalizer {
  constructor(audio) {
    this.audio = audio;
    this.analyser = audio.context.createAnalyser();
    this.connected = false;

    // To analyse volume, 32 fftsize may be good enough
    this.analyser.fftSize = 32;
    this.gain = audio.context.createGain();
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    this.volumes = [];
    this.volumeSum = 0;
  }

  apply() {
    if (window.APP.store.state.preferences.audioNormalization) {
      if (!this.connected) {
        this.connect();
      }
    } else {
      if (this.connected) {
        this.disconnect();
      }
      return;
    }

    // Adjusts volume in "a rule of the thumb" way
    // Any better algorithm?

    // Regards the RMS of time-domain data as volume.
    // Is this a right approach?
    // Using the RMS of frequency-domain data would be another option.
    this.analyser.getByteTimeDomainData(this.timeData);
    const squareSum = this.timeData.reduce((sum, num) => sum + Math.pow(num - 128, 2), 0);
    const volume = Math.sqrt(squareSum / this.analyser.frequencyBinCount);
    const baseVolume = window.APP.store.state.preferences.audioNormalization;

    // Regards volume under certain threshold as "not speaking" and skips.
    // I'm not sure if 0.4 is an appropriate threshold.
    if (volume >= Math.min(0.4, baseVolume)) {
      this.volumeSum += volume;
      this.volumes.push(volume);
      // Sees only recent volume history because there is a chance
      // that a speaker changes their master input volume.
      // I'm not sure if 600 is an appropriate number.
      while (this.volumes.length > 600) {
        this.volumeSum -= this.volumes.shift();
      }
      // Adjusts volume after getting many enough volume history.
      // I'm not sure if 60 is an appropriate number.
      if (this.volumes.length >= 60) {
        const averageVolume = this.volumeSum / this.volumes.length;
        this.gain.gain.setTargetAtTime(baseVolume / averageVolume, this.audio.context.currentTime, 0.01);
      }
    }
  }

  connect() {
    // Hacks. THREE.Audio connects audio nodes when source is set.
    // If audio is not played yet, THREE.Audio.setFilters() doesn't
    // reset connections. Then manually caling .connect()/disconnect() here.
    // This might be a bug of Three.js and should be fixed in Three.js side?
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.disconnect();
    }
    const filters = this.audio.getFilters();
    filters.unshift(this.analyser, this.gain);
    this.audio.setFilters(filters);
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.connect();
    }
    this.connected = true;
  }

  disconnect() {
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.disconnect();
    }
    const filters = [this.analyser, this.gain];
    this.audio.setFilters(this.audio.getFilters().filter(filter => !filters.includes(filter)));
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.connect();
    }
    this.connected = false;
  }
}
