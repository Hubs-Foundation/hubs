import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { TweetEditorModalContainer } from "./TweetEditorModalContainer";
import { TwitterOAuthModalContainer } from "./TwitterOAuthModalContainer";

export function TweetModalContainer({ hubChannel, initialTweet, mediaUrl, contentSubtype, onClose }) {
  const [canTweet, setCanTweet] = useState(hubChannel.can("tweet"));

  const onConnected = useCallback(
    () => {
      hubChannel.fetchPermissions().then(() => {
        setCanTweet(hubChannel.can("tweet"));
      });
    },
    [hubChannel]
  );

  if (canTweet) {
    return (
      <TweetEditorModalContainer
        initialTweet={initialTweet}
        mediaUrl={mediaUrl}
        contentSubtype={contentSubtype}
        onClose={onClose}
      />
    );
  } else {
    return <TwitterOAuthModalContainer hubChannel={hubChannel} onConnected={onConnected} onClose={onClose} />;
  }
}

TweetModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  initialTweet: PropTypes.string,
  mediaUrl: PropTypes.string,
  contentSubtype: PropTypes.string,
  onClose: PropTypes.func
};
