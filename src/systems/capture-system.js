import qsTruthy from "../utils/qs_truthy";

AFRAME.registerSystem("capture-system", {
  init() {
    this._gotAudioTrack = false;
    this._recorderTimeout = null;
  },

  _initRecorder() {
    if (!this.available()) return;

    this._stream = new MediaStream();

    const video = this.el.canvas.captureStream().getVideoTracks()[0];
    this._stream.addTrack(video);

    this._recorder = new MediaRecorder(this._stream, { mimeType: "video/webm; codecs=vp8" });

    const chunks = [];

    this._recorder.ondataavailable = e => {
      chunks.push(e.data);
    };
    this._recorder.onstop = () => {
      if (chunks.length === 0) return;
      const mimeType = chunks[0].type;
      const blob = new Blob(chunks, { type: mimeType });
      chunks.length = 0;
      this.el.emit("add_media", new File([blob], "capture", { type: mimeType }));
    };
  },

  available() {
    return qsTruthy("video_capture") && window.MediaRecorder && MediaRecorder.isTypeSupported("video/webm; codecs=vp8");
  },

  started() {
    return this._recorder && this._recorder.state !== "inactive";
  },

  _tryAddingAudioTrack() {
    if (this._gotAudioTrack || !this.el.audioListener) return;

    const listener = this.el.audioListener;
    const destination = listener.context.createMediaStreamDestination();
    listener.getInput().connect(destination);
    const audio = destination.stream.getAudioTracks()[0];

    this._stream.addTrack(audio);
    this._gotAudioTrack = true;
  },

  start() {
    if (!this._recorder) {
      this._initRecorder();
    }

    // The scene doesn't get an audioListener until something in the scene is playing audio.
    // So we have to get the audio track lazily.
    this._tryAddingAudioTrack();

    if (!this.started()) {
      this._recorder.start();
      this._recorderTimeout = setTimeout(() => {
        if (this.started()) {
          this._recorder.stop();
        }
      }, 15000);
    }
  },

  stop() {
    if (this.started()) {
      clearTimeout(this._recorderTimeout);
      this._recorder.stop();
    }
  }
});
