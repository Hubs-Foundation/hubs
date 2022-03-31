import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { TweetEditorModalContainer } from "./TweetEditorModalContainer";
import { TwitterOAuthModalContainer } from "./TwitterOAuthModalContainer";
import configs from "../../utils/configs";

export function TweetModalContainer({ hubChannel, initialTweet, mediaUrl, contentSubtype, onClose, isAdmin }) {
  const [canTweet, setCanTweet] = useState(hubChannel.can("tweet"));

  const onConnected = useCallback(() => {
    setCanTweet(true);
  }, []);

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
    return (
      <TwitterOAuthModalContainer
        appName={configs.translation("app-name")}
        hubChannel={hubChannel}
        onConnected={onConnected}
        onClose={onClose}
        isAdmin={isAdmin}
      />
    );
  }
}

TweetModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  initialTweet: PropTypes.string,
  mediaUrl: PropTypes.string,
  contentSubtype: PropTypes.string,
  onClose: PropTypes.func,
  isAdmin: PropTypes.bool
};
