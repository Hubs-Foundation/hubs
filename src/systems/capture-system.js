export class CaptureSystem {
  constructor(scene) {
    this.scene = scene;

    this.gotAudioTrack = false;
    this.stream = new MediaStream();

    this.scene.addEventListener("loaded", () => {
      const video = this.scene.canvas.captureStream().getVideoTracks()[0];
      this.stream.addTrack(video);

      this.recorder = new MediaRecorder(this.stream);

      this.chunks = [];

      this.recorder.ondataavailable = e => {
        this.chunks.push(e.data);
      };
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "video/webm" });
        this.chunks.length = 0;
        this.scene.emit("add_media", new File([blob], "capture.webm", { type: "video/webm" }));
      };
    });
  }
  get started() {
    return this.recorder.state !== "inactive";
  }

  // The scene doesn't get an audioListener until something in the scene is playing audio.
  // So we have to get the audio track lazily.
  tryAddingAudioTrack() {
    if (this.gotAudioTrack || !this.scene.audioListener) return;

    const listener = this.scene.audioListener;
    const destination = listener.context.createMediaStreamDestination();
    listener.getInput().connect(destination);
    const audio = destination.stream.getAudioTracks()[0];

    this.stream.addTrack(audio);
    this.gotAudioTrack = true;
  }

  start() {
    this.tryAddingAudioTrack();

    if (!this.started) {
      this.recorder.start();
    }

    setTimeout(() => {
      if (this.started) {
        this.recorder.stop();
      }
    }, 15000);
  }
  stop() {
    if (this.started) {
      this.recorder.stop();
    }
  }
}
