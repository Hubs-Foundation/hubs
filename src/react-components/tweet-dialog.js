import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/tweet-dialog.scss";
import Editor from "draft-js-plugins-editor";
import { EditorState } from "draft-js";
import createEmojiPlugin from "draft-js-emoji-plugin";
import "draft-js-undo-plugin/lib/plugin.css";

const emojiPlugin = createEmojiPlugin();
const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

export default class TweetDialog extends Component {
  static propTypes = {
    history: PropTypes.object
  };

  constructor() {
    super();

    this.state = {
      editorState: EditorState.createEmpty()
    };
  }

  render() {
    return (
      <DialogContainer title="" {...this.props}>
        <div>
          Hello
          <div className={styles.editor}>
            <Editor
              editorState={this.state.editorState}
              onChange={editorState => this.setState({ editorState })}
              plugins={[emojiPlugin]}
            />
          </div>
          <EmojiSuggestions />
          <EmojiSelect />
        </div>
      </DialogContainer>
    );
  }
}
