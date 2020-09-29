import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ChatMessageGroup, ChatSidebar } from "./ChatSidebar";
import imgSrc from "../../assets/background.jpg";
import mp4VideoSrc from "../../assets/video/home.mp4";
import webmVideoSrc from "../../assets/video/home.webm";

export default {
  title: "ChatSidebar"
};

export const Base = () => (
  <RoomLayout
    sidebar={
      <ChatSidebar>
        <ChatMessageGroup
          sender="Dom"
          timestamp="3m ago"
          messages={[
            "Hello!",
            "This is a really long message that should cause a new line.",
            <img alt="Test image" src={imgSrc} key="image" />
          ]}
        />
        <ChatMessageGroup
          sent
          sender="Robert"
          timestamp="3m ago"
          messages={[
            "Hello!",
            "This is a really long message that should cause a new line.",
            <video controls key="video">
              <source src={webmVideoSrc} type="video/webm" />
              <source src={mp4VideoSrc} type="video/mp4" />
            </video>,
            "Another message",
            "One last message"
          ]}
        />
        <ChatMessageGroup
          sender="John"
          timestamp="1m ago"
          messages={[
            "https://mozilla.org",
            "Test message with url. https://hubs.mozilla.com Best site :point_up:",
            ":thumbsup:"
          ]}
        />
        <ChatMessageGroup sender="Liv" timestamp="30s ago" messages={[":clap:"]} />
        <ChatMessageGroup sender="Robin" timestamp="just now" messages={['`console.log("Hello World")`']} />
      </ChatSidebar>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};
