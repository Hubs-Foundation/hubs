export function playVideoWithStopOnBlur(videoEl) {
  function toggleVideo() {
    // Play the video if the window/tab is visible.
    if (document.hasFocus()) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
  }
  if ("hasFocus" in document) {
    document.addEventListener("visibilitychange", toggleVideo);
    window.addEventListener("focus", toggleVideo);
    window.addEventListener("blur", toggleVideo);
  }
}
