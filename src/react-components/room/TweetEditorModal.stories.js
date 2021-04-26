import React, { useRef, useState } from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { TweetEditorModal } from "./TweetEditorModal";
import { createEditorStateWithText } from "draft-js-plugins-editor";
import imgSrc from "../../assets/background.jpg";
import videoSrc from "../../assets/video/home.mp4";

export default {
  title: "Room/TweetEditorModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Image = () => {
  const editorRef = useRef();
  const [editorState, setEditorState] = useState(() => createEditorStateWithText("Example tweet"));

  return (
    <RoomLayout
      modal={
        <TweetEditorModal
          editorRef={editorRef}
          editorState={editorState}
          mediaThumbnailUrl={imgSrc}
          contentSubtype="image/jpeg"
          onClickEditor={() => editorRef.current.focus()}
          onChange={setEditorState}
        />
      }
    />
  );
};

export const Video = () => {
  const editorRef = useRef();
  const [editorState, setEditorState] = useState(() => createEditorStateWithText("Example tweet"));

  return (
    <RoomLayout
      modal={
        <TweetEditorModal
          editorRef={editorRef}
          editorState={editorState}
          mediaThumbnailUrl={videoSrc}
          contentSubtype="video/mp4"
          onClickEditor={() => editorRef.current.focus()}
          onChange={setEditorState}
        />
      }
    />
  );
};
