
import Cookies from "js-cookie";

class Store {
    getUser(){
        if(Cookies.get('saveUserInfo') && Cookies.get('saveUserInfo') != '')
        {
            let str = Cookies.get('saveUserInfo');
            let saveUserInfo = JSON.parse(str || '{}');
            if(saveUserInfo && saveUserInfo.token){
                return saveUserInfo
            }
        }
        else
            return null
    };
    setUser(data){
        if(data != undefined){
            Cookies.set('saveUserInfo', data);
        }
    };
    removeUser(){
        let str = Cookies.remove('saveUserInfo');
    };
}

export default new Store();