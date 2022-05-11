import Cookies from "js-cookie";
import StoreHub from "../storage/store";
import hubChannel from "../utils/hub-channel";
import { expireCookies } from "./constants";
const store = new StoreHub();

class Store {
  getUser() {
    if (Cookies.get("saveUserInfo") && Cookies.get("saveUserInfo") != "") {
      let str = Cookies.get("saveUserInfo");
      let saveUserInfo = JSON.parse(str || "{}");
      if (saveUserInfo && saveUserInfo.token) {
        return saveUserInfo;
      }
    } else return null;
  }
  setUser(data) {
    if (data != undefined) {
      Cookies.set("saveUserInfo", data, {
        expires: expireCookies,
        path: "/"
      });
    }
  }
  removeUser() {
    let str = Cookies.remove("saveUserInfo");
  }

  remove2Token() {
    this.removeUser();
    store.removeHub();
  }
}

export default new Store();
