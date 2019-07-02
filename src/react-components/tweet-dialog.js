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
import "draft-js-emoji-plugin/lib/plugin.css";
import "draft-js-hashtag-plugin/lib/plugin.css";
import "draft-js-linkify-plugin/lib/plugin.css";
import "draft-js-counter-plugin/lib/plugin.css";

const emojiPlugin = createEmojiPlugin();
const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();
const counterPlugin = createCounterPlugin();

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
    setTimeout(() => this.editorRef.focus());
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
              <img src={scaledThumbnailUrlFor(this.props.history.location.state.detail.url, 450, 255)} />
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
