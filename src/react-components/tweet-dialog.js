import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/tweet-dialog.scss";
import Editor from "draft-js-plugins-editor";
import { EditorState } from "draft-js";
import { fetchReticulum } from "../utils/phoenix-utils";
import createEmojiPlugin from "draft-js-emoji-plugin";
import createHashtagPlugin from "draft-js-hashtag-plugin";
import createLinkifyPlugin from "draft-js-linkify-plugin";
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import "draft-js-emoji-plugin/lib/plugin.css";
import "draft-js-hashtag-plugin/lib/plugin.css";
import "draft-js-mention-plugin/lib/plugin.css";
import "draft-js-linkify-plugin/lib/plugin.css";

const emojiPlugin = createEmojiPlugin();
const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

export default class TweetDialog extends Component {
  static propTypes = {
    history: PropTypes.object
  };

  constructor() {
    super();

    this.state = {
      editorState: EditorState.createEmpty(),
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
            <Editor
              ref={r => (this.editorRef = r)}
              editorState={this.state.editorState}
              onChange={editorState => this.setState({ editorState })}
              plugins={[emojiPlugin, hashtagPlugin, linkifyPlugin]}
            />

            <div className={styles.emojiButton}>
              <EmojiSelect />
            </div>

            <div className={styles.emojiSuggestions}>
              <EmojiSuggestions />
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
