/* eslint-disable no-unused-vars */
import Store from "../../../../utilities/store";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Button, Space, Select } from "antd";
import { useTranslation } from "react-i18next";
import "./Header.scss";
import logo from "./../../../../assets/images/larchiveum_logo.png";
import Language from "../../languages/language";

export default function(props) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState("en");
  const user = Store.getUser();
  const [page, setPage] = useState(null);

  useEffect(() => {
    const page = new URL(location.href).searchParams.get("page");
    setPage(page);
  }, []);

  useLayoutEffect(
    () => {
      Language.setLanguage(language);
    },
    [language]
  );

  function checkCredentials() {
    if (window?.APP?.store?.state?.credentials?.email && window?.APP?.store?.state?.credentials?.token) {
      return true;
    }
    return false;
  }

  function handleChangeLanguage(language) {
    setLanguage(language);
  }

  const handleSignOut = () => {
    Store.removeUser();
    window.location.href = "/";
  };

  if (user) {
    return (
      <Space
        wrap
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <a href="/" style={{ float: "left", height: "100%" }}>
          <img src={logo} style={{ height: "60px" }} />
        </a>
        <Space
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Button
            type="default"
            className={"page-btn " + (page == "content" ? "active" : "")}
            shape="round"
            href="/?page=content"
          >
            {t("_header.TAB_CONTENT_LABEL")}
          </Button>
          <Button
            type="default"
            className={"page-btn " + (page == "manager" ? "active" : "")}
            shape="round"
            href="/?page=manager"
          >
            {t("_header.TAB_ROOM_LABEL")}
          </Button>
          <Button type="default" className="page-btn" shape="round" href={checkCredentials() ? "/spoke" : "/signin"}>
            {t("_header.TAB_SPOKE_LABEL")}
          </Button>
          <Button type="default" className="page-btn" shape="round" href={checkCredentials() ? "/admin" : "/signin"}>
            {t("_header.TAB_ADMIN_LABEL")}
          </Button>
        </Space>
        <Space
          wrap
          style={{
            height: "100%"
          }}
        >
          <Select
            defaultValue={language}
            style={{ width: 120 }}
            onChange={handleChangeLanguage}
            options={[
              {
                value: "en",
                label: "English"
              },
              {
                value: "ko",
                label: "Korea"
              }
            ]}
          />
          <span style={{ marginLeft: "30px" }}>
            {user.displayName || user.email} {" |"}
          </span>
          <Button type="link" onClick={handleSignOut}>
            {"Logout"}
          </Button>
        </Space>
      </Space>
      // <span className="display-name">
      //   <>
      //     {user?.type == 5 && (
      //       <>
      //         <a className="gotospoke" href={"/?page=content"}>
      //           {t("manager.CONTENT")}
      //         </a>
      //         <a className="gotospoke" href={"/?page=manager"}>
      //           {t("manager.ROOM")}
      //         </a>
      //         <a className="gotospoke" href={checkCredentials() ? "/spoke" : "/signin"}>
      //           {t("manager.SPOKE")}
      //         </a>
      //         <a className="gotoadmin" href={checkCredentials() ? "/admin" : "/signin"}>
      //           {t("manager.ADMIN")}
      //         </a>
      //       </>
      //     )}
      //   </>
      //   <span className="nameA">{user.displayName || user.email}</span> |{" "}
      //   <a className="gotohome" onClick={handleSignOut}>
      //     {t("manager.SIGN_OUT")}
      //   </a>
      // </span>
    );
  } else {
    return <></>;
  }
}
