import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/tweet-dialog.scss";
import Editor, { createEditorStateWithText } from "draft-js-plugins-editor";
import { FormattedMessage } from "react-intl";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";
import createEmojiPlugin from "draft-js-emoji-plugin";
import createHashtagPlugin from "draft-js-hashtag-plugin";
import createLinkifyPlugin from "draft-js-linkify-plugin";
import createCounterPlugin from "draft-js-counter-plugin";
import classNames from "classnames";
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import { Modifier, EditorState } from "draft-js";
import "draft-js-emoji-plugin/lib/plugin.css";
import "draft-js-hashtag-plugin/lib/plugin.css";
import "draft-js-linkify-plugin/lib/plugin.css";
import "draft-js-counter-plugin/lib/plugin.css";

const emojiPlugin = createEmojiPlugin();
const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();
const counterPlugin = createCounterPlugin();

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

export default class TweetDialog extends Component {
  static propTypes = {
    history: PropTypes.object,
    onClose: PropTypes.func
  };

  constructor(props) {
    super();

    this.state = {
      editorState: createEditorStateWithText(props.history.location.state.detail.text || ""),
      suggestions: []
    };
  }

  componentDidMount() {
    // Calling this immediately seems to break editor initialization
    setTimeout(() => {
      this.editorRef.focus();

      // Other attempts at doing this resulted in no visible cursor or weird editor behavior:
      this.setState({ editorState: addEmoji("🐤", this.state.editorState) });
    });
  }

  async sendTweet() {
    // For now assume url is a stored file media url
    const media_stored_file_url = this.props.history.location.state.detail.url;
    const body = this.state.editorState.getCurrentContent().getPlainText();

    const payload = { media_stored_file_url, body };
    this.setState({ posting: true });
    await fetchReticulumAuthenticated("/api/v1/twitter/tweets", "POST", payload);
    this.setState({ posting: false, posted: true });
  }

  renderPostedDialog() {
    return (
      <DialogContainer wide={true} allowOverflow={true} closable={false} title="" {...this.props}>
        <div className={styles.posted}>
          <div className={styles.message}>
            <FormattedMessage id="tweet-dialog.posted" />
          </div>

          <div className={styles.buttons}>
            <button className={styles.tweetButton} onClick={() => this.props.onClose()}>
              <FormattedMessage id="tweet-dialog.close" />
            </button>
          </div>
        </div>
      </DialogContainer>
    );
  }

  renderTweetDialog() {
    const { EmojiSuggestions, EmojiSelect } = emojiPlugin;
    const { CharCounter } = counterPlugin;
    const { url, contentSubtype } = this.props.history.location.state.detail;

    return (
      <DialogContainer
        wide={true}
        allowOverflow={true}
        title=""
        additionalClass={styles.dialogBackground}
        {...this.props}
      >
        <div className={styles.tweet}>
          <div className={styles.editor} onClick={() => this.editorRef.focus()}>
            <div className={styles.editorInner}>
              <Editor
                ref={r => (this.editorRef = r)}
                editorState={this.state.editorState}
                onChange={editorState => this.setState({ editorState })}
                plugins={[emojiPlugin, hashtagPlugin, linkifyPlugin, counterPlugin]}
              />
            </div>

            <div className={styles.emojiButton}>
              <EmojiSelect />
            </div>

            <div className={styles.emojiSuggestions}>
              <EmojiSuggestions />
            </div>

            {this.state.editorState.getCurrentContent().getPlainText().length > 200 && (
              <div className={styles.counter}>
                <CharCounter editorState={this.state.editorState} limit={280} /> / 280
              </div>
            )}

            <div className={styles.media}>
              {contentSubtype && contentSubtype.startsWith("video") ? (
                <video src={url} width={450} height={255} controls />
              ) : (
                <img src={scaledThumbnailUrlFor(url, 450, 255)} />
              )}
            </div>
          </div>

          {!this.state.posting ? (
            <div className={styles.buttons}>
              <button
                className={styles.tweetButton}
                onClick={() => this.sendTweet()}
                disabled={this.state.editorState.getCurrentContent().getPlainText().length > 280}
              >
                <FormattedMessage id="tweet-dialog.tweet" />
              </button>
            </div>
          ) : (
            <div className={classNames(["loader-wrap", "loader-mid", styles.tweetLoader])}>
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          )}
        </div>
      </DialogContainer>
    );
  }

  render() {
    if (this.state.posted) {
      return this.renderPostedDialog();
    } else {
      return this.renderTweetDialog();
    }
  }
}
