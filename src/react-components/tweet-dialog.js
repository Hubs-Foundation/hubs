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
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import "draft-js-emoji-plugin/lib/plugin.css";
import "draft-js-hashtag-plugin/lib/plugin.css";
import "draft-js-linkify-plugin/lib/plugin.css";

const emojiPlugin = createEmojiPlugin();
const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

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

  async sendTweet() {
    // For now assume url is a owned file media url
    const media_owned_file_url = this.props.history.location.state.detail.url;
    const body = this.state.editorState.getCurrentContent().getPlainText();

    const payload = { media_owned_file_url, body };
    this.setState({ posting: true });
    await fetchReticulumAuthenticated("/api/v1/twitter/tweets", "POST", payload);
    this.setState({ posting: false, posted: true });
  }

  render() {
    const { EmojiSuggestions, EmojiSelect } = emojiPlugin;
    if (this.state.posted) {
      return (
        <DialogContainer wide={true} allowOverflow={true} closeable={false} title="" {...this.props}>
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

    return (
      <DialogContainer wide={true} allowOverflow={true} title="" {...this.props}>
        <div className={styles.tweet}>
          <div className={styles.editor} onClick={() => this.editorRef.focus()}>
            <div className={styles.editorInner}>
              <Editor
                ref={r => (this.editorRef = r)}
                editorState={this.state.editorState}
                onChange={editorState => this.setState({ editorState })}
                plugins={[emojiPlugin, hashtagPlugin, linkifyPlugin]}
              />
            </div>

            <div className={styles.emojiButton}>
              <EmojiSelect />
            </div>

            <div className={styles.emojiSuggestions}>
              <EmojiSuggestions />
            </div>

            <div className={styles.media}>
              <img src={scaledThumbnailUrlFor(this.props.history.location.state.detail.url, 450, 255)} />
            </div>
          </div>

          {!this.state.posting ? (
            <div className={styles.buttons}>
              <button className={styles.tweetButton} onClick={() => this.sendTweet()}>
                <FormattedMessage id="tweet-dialog.tweet" />
              </button>
            </div>
          ) : (
            <div className="loader-wrap loader-mid">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          )}
        </div>
      </DialogContainer>
    );
  }
}
