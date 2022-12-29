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
import QuizComponent from "./components/page/content/quiz/Quiz";
import "reactjs-popup/dist/index.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import LayoutHeader from "./components/layout/Header";
import { Breadcrumb, Layout, Menu, Col, Row, Button, Card } from "antd";
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
            <div className="row_1" style={{ position: "relative" }}>
              <LayoutHeader style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="row_2">
              <Layout style={{ minHeight: "80vh", marginTop: "30px", background: "white" }}>
                <Sider
                  className="fixed-menu"
                  style={{
                    background: "white",
                    borderInlineEnd: "none"
                  }}
                >
                  <Card style={{ height: "80vh" }} bodyStyle={{ padding: "10px" }}>
                    <Menu
                      mode="inline"
                      items={[
                        {
                          className: tab == "quiz" ? "selected" : "",
                          key: "quiz",
                          label: t("content.LEFT_MENU__QUIZ_LABEL"),
                          onClick: () => {
                            switchTab("quiz");
                          }
                        },
                        {
                          className: tab == "document" ? "selected" : "",
                          key: "document",
                          label: t("content.LEFT_MENU__DOCUMENT_LABEL"),
                          onClick: () => {
                            switchTab("document");
                          }
                        },
                        {
                          className: tab == "map" ? "selected" : "",
                          key: "map",
                          label: t("content.LEFT_MENU__DOCUMENT_LABEL"),
                          onClick: () => {
                            switchTab("map");
                          }
                        }
                      ]}
                      style={{ background: "white" }}
                    />
                  </Card>
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
