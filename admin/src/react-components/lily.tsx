import React, { Component, useEffect, useState } from 'react';
import { sleep } from '../../../src/utils/async-utils';
import styles from './lily.module.scss';

export function hasReticulumServer() {
  return false;
}

// export function getReticulumFetchUrl(path, absolute = false, host = null, port = null) {
//   if (host || hasReticulumServer()) {
//     return `https://${host || configs.RETICULUM_SERVER}${port ? `:${port}` : ""}${path}`;
//   } else if (absolute) {
//     resolverLink.href = path;
//     return resolverLink.href;
//   } else {
//     return path;
//   }
// }

// export function fetchReticulumAuthenticatedWithToken(token, url, method = "GET", payload) {
//   const retUrl = getReticulumFetchUrl(url);
//   const params = {
//     headers: { "content-type": "application/json" },
//     method
//   };
//   if (token) {
//     params.headers.authorization = `bearer ${token}`;
//   }
//   if (payload) {
//     params.body = JSON.stringify(payload);
//   }
//   return fetch(retUrl, params).then(async r => {
//     const result = await r.text();
//     try {
//       return JSON.parse(result);
//     } catch (e) {
//       // Some reticulum responses, particularly DELETE requests, don't return json.
//       return result;
//     }
//   });
// }

export function Lily() {
  const [avatar, setAvatar] = useState();

  // useEffect(async () => {
  //   const response = await fetchReticulumAuthenticatedWithToken(
  //     APP.store.state.credentials.token,
  //     `/api/v1/hub_storage`
  //   );
  //   console.log(response);
  //   console.log("styles", styles);
  // }, []);

  return <div className={styles.lily_test}>helooooo</div>;
}
