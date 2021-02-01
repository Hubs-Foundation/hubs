import React from "react";

export function ChatSidebarVideoStreams() {
    
  return (
    <div id="video-grid">
      <style>
        {`
      #video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 300px);
        grid-auto-rows: 300px;
      }
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `}
      </style>
    </div>
  );
}
