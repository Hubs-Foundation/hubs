import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import {
  ChatMessageGroup,
  ChatSidebar,
  SystemMessage,
  ChatMessageList,
  ChatInput,
  SpawnMessageButton,
  MessageAttachmentButton,
  EmojiPickerPopoverButton,
  PermissionMessageGroup,
  SendMessageButton
} from "./ChatSidebar";
import imgSrc from "../../assets/background.jpg";
import videoSrc from "../../assets/video/home.mp4";
import { PermissionNotification } from "./PermissionNotifications";

export default {
  title: "Room/ChatSidebar",
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    textChatEnabled: {
      control: "boolean",
      defaultValue: true
    }
  }
};

const nextTimestamp = (function () {
  const now = Date.now();
  let time = now - 8 * 60 * 60 * 1000;
  return function nextTimeStamp() {
    time = time + (now - time) / 2.0;
    return time;
  };
})();

export const Base = args => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <ChatSidebar>
        <ChatMessageList>
          <SystemMessage type="join" presence="room" name="Robert" timestamp={nextTimestamp()} />
          <SystemMessage type="join" presence="room" name="Dom" timestamp={nextTimestamp()} />
          <ChatMessageGroup
            sender="Dom"
            timestamp={nextTimestamp()}
            messages={[
              { id: "1", key: "1", type: "chat", body: "Hello!" },
              { id: "2", key: "2", type: "chat", body: "This is a really long message that should cause a new line, so it needs to contain a lot of verbiage." },
              { id: "3", key: "3", type: "image", body: { src: imgSrc } }
            ]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={nextTimestamp()}
            messages={[
              { id: "4", key: "4", type: "chat", body: "Hello!" },
              { id: "5", key: "5", type: "chat", body: "This is a really long message that should cause a new line, so it needs to contain a lot of verbiage." },
              { id: "6", key: "6", type: "video", body: { src: videoSrc } },
              { id: "7", key: "7", type: "chat", body: "Another message" },
              { id: "8", key: "8", type: "chat", body: "One last message" }
            ]}
          />
          <SystemMessage type="join" presence="room" name="John" timestamp={nextTimestamp()} />
          <ChatMessageGroup
            sender="John"
            timestamp={nextTimestamp()}
            messages={[
              {
                id: "9",
                key: "9",
                type: "chat",
                body: "https://hubsfoundation.org"
              },
              {
                id: "10",
                key: "10",
                type: "chat",
                body: "Test message with url. https://demo.hubsfoundation.org Best site :point_up:"
              },
              {
                id: "11",
                key: "11",
                type: "chat",
                body: ":thumbsup:"
              },
              {
                id: "10",
                key: "10",
                type: "chat",
                body: "Really long test message with url, to test line breaking. https://demo.hubsfoundation.org Woo!"
              },
            ]}
          />
          <SystemMessage type="join" presence="room" name="Liv" timestamp={nextTimestamp()} />
          <SystemMessage type="join" presence="room" name="Robin" timestamp={nextTimestamp()} />
          <ChatMessageGroup
            sender="Liv"
            timestamp={nextTimestamp()}
            messages={[{ id: "12", key: "12", type: "chat", body: ":clap:" }]}
          />
          <ChatMessageGroup
            sender="Robin"
            timestamp={nextTimestamp()}
            messages={[{ id: "13", key: "13", type: "chat", body: '`console.log("Hello World")`' }]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={nextTimestamp()}
            messages={[
              { id: "14", key: "14", type: "chat", body: "https://hubsfoundation.org" },
              {
                id: "21",
                key: "21",
                type: "chat",
                body: "Another really long test message with url. https://hubsfoundation.org So where does the line break?"
              }
            ]}
          />
          <PermissionMessageGroup
            sent
            timestamp={nextTimestamp()}
            messages={[
              { key: "16", id: "16", type: "permission", body: { permission: "voice_chat", status: false } },
              { key: "17", id: "17", type: "permission", body: { permission: "text_chat", status: true } }
            ]}
            permissionMessage
          />
        </ChatMessageList>
        {!!args.textChatEnabled && <PermissionNotification permission={"text_chat"} isMod={false} />}
        <ChatInput
          id="chat-input"
          afterInput={
            <>
              <EmojiPickerPopoverButton onSelectEmoji={emoji => console.log(emoji)} />
              <MessageAttachmentButton />
              <SendMessageButton
                disabled={!args.textChatEnabled}
                title={!args.textChatEnabled ? "Text Chat Off" : undefined}
              />
              <SpawnMessageButton
                disabled={!args.textChatEnabled}
                title={!args.textChatEnabled ? "Text Chat Off" : undefined}
              />
            </>
          }
          disabled={!args.textChatEnabled}
        />
      </ChatSidebar>
    }
  />
);

Base.args = {
  textChatEnabled: false
};
