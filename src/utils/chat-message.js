import React from "react";
import Linkify from "react-linkify";
import { toArray as toEmojis } from "react-emoji-render";

const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;

// Hacky word wrapping, needed because the SVG conversion doesn't properly deal
// with wrapping in Firefox for some reason. (The CSS white-space is set to pre)
const wordWrap = body => {
  const maxCharsPerLine = 40;
  const words = body.split(" ");
  const outWords = [];
  let c = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (word.startsWith(":") && word.endsWith(":")) {
      c++;
    } else {
      c += word.length;
    }

    outWords.push(word);

    if (c >= maxCharsPerLine) {
      c = 0;
      outWords.push("\n");
    }
  }

  return outWords.join(" ");
};

export function formatMessageBody(body, useWorldWrap = false) {
  // Support wrapping text in ` to get monospace, and multiline.
  const multiline = useWorldWrap && body.split("\n").length > 1;
  const monospace = body.startsWith("`") && body.endsWith("`");

  if (useWorldWrap && !multiline) {
    body = wordWrap(body);
  }

  const cleanedBody = (monospace ? body.substring(1, body.length - 1) : body).trim();

  const bodyWithEmojis = toEmojis(cleanedBody);

  const formattedBody = <Linkify properties={{ target: "_blank", rel: "noopener referrer" }}>{bodyWithEmojis}</Linkify>;

  const emoji =
    bodyWithEmojis.length === 1 &&
    bodyWithEmojis[0].props &&
    bodyWithEmojis[0].props.children.match &&
    bodyWithEmojis[0].props.children.match(emojiRegex);

  return {
    formattedBody,
    multiline,
    monospace,
    emoji
  };
}
