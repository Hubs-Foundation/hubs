/* eslint-disable no-unused-vars */
import Store from "../../../../utilities/store";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function(props) {
  const { t } = useTranslation();
  const user = Store.getUser();

  function checkCredentials() {
    if (window?.APP?.store?.state?.credentials?.email && window?.APP?.store?.state?.credentials?.token) {
      return true;
    }
    return false;
  }

  const handleSignOut = () => {
    Store.removeUser();
    window.location.href = "/";
  };

  if (user) {
    return (
      <span className="display-name">
        <>
          {user?.type == 5 && (
            <>
              <a className="gotospoke" href={"/?page=content"}>
                {t("manager.CONTENT")}
              </a>
              <a className="gotospoke" href={"/?page=manager"}>
                {t("manager.ROOM")}
              </a>
              <a className="gotospoke" href={checkCredentials() ? "/spoke" : "/signin"}>
                {t("manager.SPOKE")}
              </a>
              <a className="gotoadmin" href={checkCredentials() ? "/admin" : "/signin"}>
                {t("manager.ADMIN")}
              </a>
            </>
          )}
        </>
        <span className="nameA">{user.displayName || user.email}</span> |{" "}
        <a className="gotohome" onClick={handleSignOut}>
          {t("manager.SIGN_OUT")}
        </a>
      </span>
    );
  } else {
    return <></>;
  }
}
