import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import InfiniteScroll from "react-infinite-scroller";
import markdownit from "markdown-it";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { store } from "./utils/store-instance";

window.APP = { store };

import registerTelemetry from "./telemetry";
import "./react-components/styles/global.scss";
import "./assets/stylesheets/whats-new.scss";
import { PageContainer } from "./react-components/layout/PageContainer";
import { Spinner } from "./react-components/misc/Spinner";
import { ThemeProvider } from "./react-components/styles/theme";

registerTelemetry("/whats-new", "Hubs What's New");

function formatDate(value) {
  return value && new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const md = markdownit();

class WhatsNew extends Component {
  state = {
    pullRequests: [],
    moreCursor: null,
    hasMore: true,
    currentDate: null
  };
  async getWhatsNew() {
    const endpoint = "/api/v1/whats-new";
    const params = ["source=hubs", this.state.moreCursor ? `cursor=${this.state.moreCursor}` : ""].join("&");

    let moreCursor = null;
    let pullRequests = [];
    try {
      const respJson = await fetch(`${endpoint}?${params}`).then(r => r.json());
      moreCursor = respJson.moreCursor;
      pullRequests = respJson.pullRequests;
    } catch (e) {
      console.error("Error fetching whats-new", e);
    }

    let currentDate = this.state.currentDate;

    for (let i = 0; i < pullRequests.length; i++) {
      const pullRequest = pullRequests[i];
      if (formatDate(pullRequest.mergedAt) === currentDate) {
        pullRequest.mergedAt = null;
      } else {
        currentDate = formatDate(pullRequest.mergedAt);
      }
      pullRequest.body = md.render(pullRequest.body);
    }

    this.setState({
      hasMore: !!moreCursor,
      moreCursor,
      currentDate,
      pullRequests: [...this.state.pullRequests, ...pullRequests]
    });
  }
  render() {
    return (
      <PageContainer>
        <InfiniteScroll
          loadMore={this.getWhatsNew.bind(this)}
          hasMore={this.state.hasMore}
          loader={
            <div key="loader" className="loader">
              <Spinner />
            </div>
          }
          useWindow={false}
          getScrollParent={() => document.body}
        >
          <div className="container">
            <div className="main">
              <div className="content">
                <h1>
                  <FormattedMessage id="whats-new-page.title" defaultMessage="What's New" />
                </h1>
                {this.state.pullRequests.map((pullRequest, i) => {
                  return (
                    <div key={i} className="note">
                      <div className="note-header">
                        <h2 className={pullRequest.mergedAt ? "date" : "date-blank"}>
                          {formatDate(pullRequest.mergedAt)}
                        </h2>
                        <h2 className="title">
                          <a href={pullRequest.url}>{pullRequest.title}</a>
                        </h2>
                      </div>
                      {/* Setting HTML generated directly by markdownit, which is safe by default:
                      https://github.com/markdown-it/markdown-it/blob/master/docs/security.md */}
                      <p className="body" dangerouslySetInnerHTML={{ __html: pullRequest.body }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </InfiniteScroll>
      </PageContainer>
    );
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("ui-root");

  const root = createRoot(container);
  root.render(
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <AuthContextProvider store={store}>
          <WhatsNew />
        </AuthContextProvider>
      </ThemeProvider>
    </WrappedIntlProvider>
  );
});
