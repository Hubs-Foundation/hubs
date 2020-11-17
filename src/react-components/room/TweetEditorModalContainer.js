import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { TweetEditorModal } from "./TweetEditorModal";
import { Modifier, EditorState } from "draft-js";
import { createEditorStateWithText } from "draft-js-plugins-editor";
import { fetchReticulumAuthenticated } from "../../utils/phoenix-utils";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";

// Taken from draft-js-emoji
const addEmoji = (emoji, editorState) => {
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity("emoji", "IMMUTABLE", { emojiUnicode: emoji });
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const currentSelectionState = editorState.getSelection();

  let emojiAddedContent;
  let emojiEndPos = 0;
  let blockSize = 0;

  // in case text is selected it is removed and then the emoji is added
  const afterRemovalContentState = Modifier.removeRange(contentState, currentSelectionState, "backward");

  // deciding on the position to insert emoji
  const targetSelection = afterRemovalContentState.getSelectionAfter();

  emojiAddedContent = Modifier.insertText(afterRemovalContentState, targetSelection, emoji, null, entityKey);

  emojiEndPos = targetSelection.getAnchorOffset();
  const blockKey = targetSelection.getAnchorKey();
  blockSize = contentState.getBlockForKey(blockKey).getLength();

  // If the emoji is inserted at the end, a space is appended right after for
  // a smooth writing experience.
  if (emojiEndPos === blockSize) {
    emojiAddedContent = Modifier.insertText(emojiAddedContent, emojiAddedContent.getSelectionAfter(), " ");
  }

  const newEditorState = EditorState.push(editorState, emojiAddedContent, "insert-emoji");
  return EditorState.forceSelection(newEditorState, emojiAddedContent.getSelectionAfter());
};

export function TweetEditorModalContainer({ initialTweet, mediaUrl, contentSubtype, onClose }) {
  const [editorState, setEditorState] = useState(() => createEditorStateWithText(initialTweet || ""));
  const editorRef = useRef();

  useEffect(() => {
    // Other attempts at doing this resulted in no visible cursor or weird editor behavior:
    setEditorState(editorState => addEmoji("🐤", editorState));
  }, []);

  const [sending, setSending] = useState(false);

  const sendTweet = useCallback(
    async () => {
      setSending(true);

      try {
        const body = editorState.getCurrentContent().getPlainText();
        // For now assume url is a stored file media url
        await fetchReticulumAuthenticated("/api/v1/twitter/tweets", "POST", { media_stored_file_url: mediaUrl, body });
      } catch (error) {
        setSending(false);
        console.error(error);
      }

      onClose();
    },
    [mediaUrl, editorState, onClose]
  );

  const mediaThumbnailUrl = useMemo(
    () => {
      return contentSubtype && !contentSubtype.startsWith("video")
        ? scaledThumbnailUrlFor(mediaUrl, 450, 255)
        : mediaUrl;
    },
    [contentSubtype, mediaUrl]
  );

  return (
    <TweetEditorModal
      editorState={editorState}
      editorRef={editorRef}
      onClose={onClose}
      sending={sending}
      onSend={sendTweet}
      onChange={setEditorState}
      mediaThumbnailUrl={mediaThumbnailUrl}
      contentSubtype={contentSubtype}
    />
  );
}

TweetEditorModalContainer.propTypes = {
  mediaUrl: PropTypes.string,
  contentSubtype: PropTypes.string,
  initialTweet: PropTypes.object.isRequired,
  onClose: PropTypes.func
};
