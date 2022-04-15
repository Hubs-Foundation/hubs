import Store from "../utilities/store";
import StoreHub from "../storage/store";
import UserService from '../utilities/apiServices/UserService'
const store = new StoreHub();
export function auth(){
    const hubsToken = store.state?.credentials?.token;
    const larchiveumToken = Store.getUser()?.token;
    return UserService.check2Token(larchiveumToken, hubsToken).then((res) => {
        if(res.result == 'ok'){
        const email = Store.getUser()?.email;
        if(!res.data.larchiveum || res.data.larchiveum.email != email)
        {
            window.location = '/?page=signin';
        }
        else if(!res.data.hubs){
            window.location = '/?page=warning-verify';
        }
        else
        {
            //loading false
            return true;
        }
        }
        else{
            window.location = '/?page=signin';
        }
    }).catch(() => {
        window.location = '/?page=signin';
    });
    
}
