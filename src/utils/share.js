const isMobileVR = AFRAME.utils.device.isMobileVR();

export function canShare() {
  // TODO, fix up when OB/FxR support sharing
  return navigator.share && !isMobileVR;
}

/**
 * Wraps navigator.share with a fallback to twitter for unsupported browsers
 */
export function share(opts) {
  if (canShare()) {
    return navigator.share(opts);
  } else {
    const { title, url } = opts;
    const width = 550;
    const height = 420;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const params = `scrollbars=no,menubar=no,toolbar=no,status=no,width=${width},height=${height},top=${top},left=${left}`;
    const tweetLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
      title
    )}`;
    window.open(tweetLink, "_blank", params);
    return Promise.resolve();
  }
}
