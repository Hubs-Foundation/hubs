
export async function shareInviteUrl(intl, url, values = {}, event) {
  try {
    event.preventDefault();
    event.stopPropagation();
    const title = intl.formatMessage(
      {
        id: "invite-popover.share-title",
        defaultMessage: "You're invited to join room “{name}” on {host}"
      },
      values
    );
    const text = intl.formatMessage(
      {
        id: "invite-popover.share-text",
        defaultMessage: "{host} is an immersive 3D space you can access on any device. Meet and collaborate in real time using an avatar and add your own media!"
      },
      values
    );
    const data = { title, text, url};
    console.info(`attempting to share:`, data);
    await share(data);
  } catch (error) {
    console.error("unable to share:", error);
  }
}

export function canShare() {
  return 'function' === typeof navigator.share;
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
