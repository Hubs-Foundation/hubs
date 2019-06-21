import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/tweet-dialog.scss";
import Editor, { createEditorStateWithText } from "draft-js-plugins-editor";
import { FormattedMessage } from "react-intl";
import { fetchReticulum } from "../utils/phoenix-utils";
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
    history: PropTypes.object
  };

  constructor(props) {
    super();

    this.state = {
      editorState: createEditorStateWithText(props.history.location.state.detail.text || ""),
      suggestions: []
    };
  }

  onSearchChange = async ({ value }) => {
    this.lastSearch = value;
    const res = await fetchReticulum(`/api/v1/twitter/users?q=${encodeURIComponent(value)}`);
    if (this.lastSearch !== value) return;

    const suggestions = [];

    for (let i = 0; i < res.length; i++) {
      suggestions.push({
        name: "@" + res[i].screen_name,
        avatar: scaledThumbnailUrlFor(res[i].profile_image_url, 128, 128)
      });
    }

    this.setState({ suggestions });
  };

  render() {
    const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

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

          <div className={styles.buttons}>
            <button className={styles.tweetButton}>
              <FormattedMessage id="tweet-dialog.tweet" />
            </button>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
