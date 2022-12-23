/* eslint-disable @calm/react-intl/missing-formatted-message */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/larchiveum/manager.scss";
import "../../assets/larchiveum/loading.scss";
import "react-datetime/css/react-datetime.css";
import QuizComponent from "./components/page/content/Quiz";
import "reactjs-popup/dist/index.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import LayoutHeader from "./components/layout/Header";
import { Breadcrumb, Layout, Menu, Col, Row, Button } from "antd";
import logo from "./../../assets/images/larchiveum_logo.png";
import "./ContentPage.scss";

const { Header, Content, Footer, Sider } = Layout;

registerTelemetry("/content", "Content Page");

export function ContentPage() {
  toast.configure();
  const { t } = useTranslation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState();

  function switchTab(tab) {
    window.location.href = "/?page=content&tab=" + tab;
  }

  useEffect(() => {
    const paramTab = new URL(location.href).searchParams.get("tab") || "quiz";
    setTab(paramTab);
  }, []);

  if (isPageLoading) {
    return (
      <div className="loader-2">
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <circle id="test" cx="40" cy="40" r="32" />
          </svg>
        </div>
        <div className="loader triangle">
          <svg viewBox="0 0 86 80">
            <polygon points="43 8 79 72 7 72" />
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect x="8" y="8" width="64" height="64" />
          </svg>
        </div>
      </div>
    );
  } else {
    if (isLoading) {
      return (
        <div className="loader-1">
          <div className="loader triangle">
            <svg viewBox="0 0 86 80">
              <polygon points="43 8 79 72 7 72" />
            </svg>
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div className="manager-page">
            <div className="row_1">
              <a href="/" style={{ float: "left", height: "100%" }}>
                <img src={logo} style={{ height: "100%" }} />
              </a>
              <LayoutHeader style={{ float: "right" }} />
            </div>
            <div className="row_2">
              <Layout style={{ minHeight: "80vh", marginTop: "30px", background: "white" }}>
                <Sider style={{ background: "white", border: "1px solid gray", borderRadius: "3px" }}>
                  <Menu
                    mode="inline"
                    items={[
                      {
                        className: tab == "quiz" ? "selected" : "",
                        key: "quiz",
                        label: "Quiz",
                        onClick: () => {
                          switchTab("quiz");
                        }
                      },
                      {
                        className: tab == "document" ? "selected" : "",
                        key: "document",
                        label: "Document",
                        onClick: () => {
                          switchTab("document");
                        }
                      },
                      {
                        className: tab == "map" ? "selected" : "",
                        key: "map",
                        label: "Map",
                        onClick: () => {
                          switchTab("map");
                        }
                      }
                    ]}
                    style={{ background: "white" }}
                  />
                </Sider>
                <Layout className="site-layout" style={{ marginLeft: "30px", background: "white" }}>
                  {tab == "quiz" && <QuizComponent />}
                  {tab == "document" && (
                    <Content style={{ margin: "0 16px" }}>
                      <div style={{ padding: 24, minHeight: 360 }}>Documnet</div>
                    </Content>
                  )}
                  {tab == "map" && (
                    <Content style={{ margin: "0 16px" }}>
                      <div style={{ padding: 24, minHeight: 360 }}>Map</div>
                    </Content>
                  )}
                </Layout>
              </Layout>
            </div>
          </div>
        </>
      );
    }
  }
}