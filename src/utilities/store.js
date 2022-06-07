import Cookies from "js-cookie";
import StoreHub from "../storage/store";
import hubChannel from "../utils/hub-channel";
import { expireCookies } from "./constants";
const store = new StoreHub();

class Store {
  getUser() {
    if (Cookies.get("_larchiveum_user") && Cookies.get("_larchiveum_user") != "") {
      let str = Cookies.get("_larchiveum_user");
      let user = JSON.parse(str || "{}");
      if (user && user.token) {
        return user;
      }
    } 
    return null;
  }
  
  setUser(data) {
    if (data != undefined) {
      Cookies.set("_larchiveum_user", data, {
        expires: expireCookies,
        path: "/"
      });
    }
  }

  removeUser() {
    let str = Cookies.remove("_larchiveum_user");
  }
}

export default new Store();
