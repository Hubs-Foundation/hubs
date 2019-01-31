import { queryParameters, fetchJson } from "ra-core/lib/util/fetch";
import { GET_LIST, GET_ONE, GET_MANY, GET_MANY_REFERENCE, CREATE, UPDATE, DELETE, DELETE_MANY } from "react-admin";
import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR } from "react-admin";
import { fork, cancel, cancelled, takeEvery } from "redux-saga/effects";
import { delay } from "redux-saga";
import jwt_decode from "jwt-decode";
import { USER_LOGIN_SUCCESS, USER_LOGOUT } from "ra-core/esm/actions";

/**
 * Maps admin-on-rest queries to a postgrest API
 *
 * The REST dialect is similar to the one of FakeRest
 * @see https://github.com/marmelab/FakeRest
 * @example
 * GET_MANY_REFERENCE
 *              => GET http://my.api.url/posts/2
 * GET_LIST     => GET http://my.api.url/posts?order=title.asc
 * GET_ONE      => GET http://my.api.url/posts?id=eq.123
 * GET_MANY     => GET http://my.api.url/posts?id=in.( 123,456,789 )
 * UPDATE       => PATCH http://my.api.url/posts?id=eq.123
 * CREATE       => POST http://my.api.url/posts
 * DELETE       => DELETE http://my.api.url/posts?id=eq.123
 */
const postgrestClient = (apiUrl, httpClient = fetchJson) => {
  const convertFilters = filters => {
    const rest = {};

    Object.keys(filters).map(function(key) {
      switch (typeof filters[key]) {
        case "string":
          rest[key] = "ilike.*" + filters[key].replace(/:/, "") + "*";
          break;

        case "boolean":
          rest[key] = "is." + filters[key];
          break;

        case "undefined":
          rest[key] = "is.null";
          break;

        case "number":
          rest[key] = "eq." + filters[key];
          break;

        case "object":
          if (filters[key].constructor === Array) {
            rest[key] = "cs.{" + filters[key].toString().replace(/:/, "") + "}";
          } else {
            Object.keys(filters[key]).map(val => (rest[`${key}->>${val}`] = `ilike.*${filters[key][val]}*`));
          }
          break;

        default:
          rest[key] = "ilike.*" + filters[key].toString().replace(/:/, "") + "*";
          break;
      }
    });
    return rest;
  };

  /**
   * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
   * @param {String} resource Name of the resource to fetch, e.g. 'posts'
   * @param {Object} params The REST request params, depending on the type
   * @returns {Object} { url, options } The HTTP request parameters
   */
  const convertRESTRequestToHTTP = (type, resource, params) => {
    let url = "";
    const options = {};
    options.headers = new Headers();

    switch (type) {
      case GET_LIST: {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        options.headers.set("Range-Unit", "items");
        options.headers.set("Range", (page - 1) * perPage + "-" + (page * perPage - 1));
        options.headers.set("Prefer", "count=exact");
        const query = {
          order: field + "." + order.toLowerCase()
        };
        Object.assign(query, convertFilters(params.filter));
        url = `${apiUrl}/${resource}?${queryParameters(query)}`;
        break;
      }

      case GET_ONE: {
        options.headers.set("Accept", "application/vnd.pgrst.object+json");
        url = `${apiUrl}/${resource}?id=eq.${params.id}`;
        break;
      }

      case GET_MANY: {
        url = `${apiUrl}/${resource}?id=in.( ${params.ids.join(",")} )`;
        break;
      }

      case GET_MANY_REFERENCE: {
        const filters = {};
        const { field, order } = params.sort;
        filters[params.target] = params.id;
        const query = {
          order: field + "." + order.toLowerCase()
        };
        Object.assign(query, convertFilters(filters));
        url = `${apiUrl}/${resource}?${queryParameters(query)}`;
        break;
      }

      case UPDATE: {
        url = `${apiUrl}/${resource}?id=eq.${params.id}`;
        options.method = "PATCH";
        options.headers.set("Accept", "application/vnd.pgrst.object+json");
        options.body = JSON.stringify(params.data);
        break;
      }

      case CREATE: {
        url = `${apiUrl}/${resource}`;
        options.headers.set("Accept", "application/vnd.pgrst.object+json");
        options.headers.set("Prefer", "return=representation");
        options.method = "POST";
        options.body = JSON.stringify(params.data);
        break;
      }

      case DELETE: {
        url = `${apiUrl}/${resource}?id=eq.${params.id}`;
        options.method = "DELETE";
        break;
      }

      case DELETE_MANY: {
        url = `${apiUrl}/${resource}?id=in.( ${params.ids.join(",")} )`;
        options.method = "DELETE";
        break;
      }

      default: {
        throw new Error(`Unsupported fetch action type ${type}`);
      }
    }

    return { url, options };
  };

  /**
   * @param {Object} response HTTP response from fetch()
   * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
   * @param {String} resource Name of the resource to fetch, e.g. 'posts'
   * @param {Object} params The REST request params, depending on the type
   * @returns {Object} REST response
   */
  const convertHTTPResponseToREST = (response, type, resource, params) => {
    const { headers, json } = response;
    const maxInPage =
      parseInt(
        headers
          .get("content-range")
          .split("/")[0]
          .split("-")
          .pop(),
        10
      ) + 1;

    switch (type) {
      case GET_LIST:
      case GET_MANY_REFERENCE:
        if (!headers.has("content-range")) {
          throw new Error(
            "The Content-Range header is missing in the HTTP Response. The simple REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?"
          );
        }
        return {
          data: json.map(x => x),
          total:
            parseInt(
              headers
                .get("content-range")
                .split("/")
                .pop(),
              10
            ) || maxInPage
        };

      case CREATE:
        return { data: json };

      case UPDATE:
        return { data: json };

      case DELETE:
        return { data: params.previousData };

      case DELETE_MANY:
        return { data: params.ids };

      case GET_ONE:
        return { data: json };

      default:
        return { data: json };
    }
  };

  /**
   * @param {string} type Request type, e.g GET_LIST
   * @param {string} resource Resource name, e.g. "posts"
   * @param {Object} payload Request parameters. Depends on the request type
   * @returns {Promise} the Promise for a REST response
   */
  return (type, resource, params) => {
    const { url, options } = convertRESTRequestToHTTP(type, resource, params);
    return httpClient(url, options).then(response => convertHTTPResponseToREST(response, type, resource, params));
  };
};

let moduleLoginUrl;
let moduleRefreshUrl;
let moduleSecondsBeforeExpiry;
let moduleRefreshTask;

const createAuthProvider = loginUrl => {
  moduleLoginUrl = loginUrl;

  return (type, params) => {
    if (type === AUTH_LOGIN) {
      const { username, password } = params;
      const request = new Request(moduleLoginUrl, {
        method: "POST",
        body: JSON.stringify({ email: username, password }),
        headers: new Headers({
          "Content-Type": "application/json",
          Accept: "application/vnd.pgrst.object+json"
        })
      });
      return fetch(request)
        .then(response => {
          if (response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then(({ token }) => {
          localStorage.setItem("token", token);
        });
    }

    if (type === AUTH_LOGOUT) {
      localStorage.removeItem("token");
      return Promise.resolve();
    }

    if (type === AUTH_ERROR) {
      const status = params.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        return Promise.reject();
      }
      return Promise.resolve();
    }

    return Promise.resolve();
  };
};

const refreshToken = function(token) {
  const request = new Request(moduleRefreshUrl, {
    method: "GET",
    headers: new Headers({
      Authorization: `Bearer ${token}`
    })
  });

  return fetch(request)
    .then(response => {
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(token => {
      // comes back as JSON-encoded plain string
      localStorage.setItem("token", token);
      return token;
    });
};

const refreshTokenFunction = function*(delayInMs, previousToken) {
  let tokenToRefresh = previousToken;

  try {
    while (true) {
      yield delay(delayInMs);
      const newToken = yield Promise.resolve(refreshToken(tokenToRefresh));
      yield localStorage.setItem("token", newToken);
      tokenToRefresh = newToken;
    }
  } finally {
    if (yield cancelled()) {
      // fade away
    }
  }
};

/*
 * TODO work out how to kick off a refresh timer after a
 * hard reload when user is already logged in
 */
const handleLoginSuccess = function*() {
  const token = yield localStorage.getItem("token");
  const decodedToken = jwt_decode(token);
  const expirySeconds = Math.round((decodedToken.exp * 1000 - Date.now()) / 1000);
  const refreshDelayInMs = (expirySeconds - moduleSecondsBeforeExpiry) * 1000;
  moduleRefreshTask = yield fork(refreshTokenFunction, refreshDelayInMs, token);
};

const handleLogout = function*() {
  yield cancel(moduleRefreshTask);
};

const createAuthRefreshSaga = (refreshUrl, secondsBeforeExpiry) => {
  moduleRefreshUrl = refreshUrl;
  moduleSecondsBeforeExpiry = secondsBeforeExpiry;

  return function*() {
    yield takeEvery(USER_LOGIN_SUCCESS, handleLoginSuccess);

    yield takeEvery(USER_LOGOUT, handleLogout);
  };
};

const postgrestAuthenticatior = {
  createAuthProvider,
  createAuthRefreshSaga
};

export { postgrestClient, postgrestAuthenticatior };
