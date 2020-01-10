import React, { Component } from "react";
import ReactDOM from "react-dom";
import InfiniteScroll from "react-infinite-scroller";
import markdownit from "markdown-it";

import configs from "./utils/configs";
import registerTelemetry from "./telemetry";
import "./assets/stylesheets/whats-new.scss";

registerTelemetry("/whats-new", "Hubs What's New");

function formatDate(value) {
  return value && new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const md = markdownit();
function formatBody(pull) {
  const paragraphs = pull.body.split("\r\n\r\n").filter(l => l.trim());
  const paraAndImage = [paragraphs[0]];
  if (paragraphs[1] && paragraphs[1].includes("![")) {
    paraAndImage.push(paragraphs[1]);
  }
  pull.body = md.render(paraAndImage.join("\r\n\r\n"));
}

class WhatsNew extends Component {
  state = {
    notes: [],
    hasMore: true,
    currentDate: null
  };
  async getNotes(page) {
    const endpoint = "https://api.github.com/repos/mozilla/hubs/pulls";
    // Read-only, public access token.
    const token = "de8cbfb4cc0281c7b731c891df431016c29b0ace";
    const params = [
      "sort=created",
      "direction=desc",
      "state=closed",
      "base=master",
      "per_page=30",
      `page=${page}`
    ].join("&");
    const resp = await fetch(`${endpoint}?${params}`, {
      headers: { authorization: `token ${token}` }
    });
    const pulls = await resp.json();

    if (!pulls.length) {
      this.setState({ hasMore: false });
      return;
    }

    const merged = pulls.filter(x => x.merged_at && !!x.labels.find(l => l.name === "whats new"));

    if (!merged.length) {
      // Just trigger a render again so that InfiniteScroll will load the next page.
      this.setState({});
      return;
    }

    merged.sort((a, b) => a.merged_at < b.merged_at);

    let currentDate = this.state.currentDate;

    for (let i = 0; i < merged.length; i++) {
      const pull = merged[i];
      if (formatDate(pull.merged_at) === currentDate) {
        pull.merged_at = null;
      } else {
        currentDate = formatDate(pull.merged_at);
      }
      formatBody(pull);
    }

    this.setState({ currentDate, notes: [...this.state.notes, ...merged] });
  }
  render() {
    const loader = (
      <div className="loader-wrap" key="0">
        <div className="loader">
          <div className="loader-center" />
        </div>
      </div>
    );
    return (
      <InfiniteScroll pageStart={0} loadMore={this.getNotes.bind(this)} hasMore={this.state.hasMore} loader={loader}>
        <div className="container">
          <div className="header">
            <a href="/">
              <img className="logo" src={configs.image("logo")} />
            </a>
          </div>
          <div className="main">
            <div className="content">
              <h1>What&apos;s New</h1>
              {this.state.notes.map((note, i) => {
                return (
                  <div key={i} className="note">
                    <div className="note-header">
                      <h2 className={note.merged_at ? "date" : "date-blank"}>{formatDate(note.merged_at)}</h2>
                      <h2 className="title">
                        <a href={note.html_url}>{note.title}</a>
                      </h2>
                    </div>
                    {/* Setting HTML generated directly by markdownit, which is safe by default:
                      https://github.com/markdown-it/markdown-it/blob/master/docs/security.md */}
                    <p className="body" dangerouslySetInnerHTML={{ __html: note.body }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </InfiniteScroll>
    );
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  ReactDOM.render(<WhatsNew />, document.getElementById("ui-root"));
});
