import Store from "../utilities/store";
import UserService from '../utilities/apiServices/UserService'

export function auth(){
    const user = Store.getUser();
    return UserService.checkToken(user?.token).then((res) => {
        if(res.result == 'ok'){
            if(!res.data.id != user?.id)
            {  
                Store.removeUser();
                window.location = '/?page=signin';
            }
            else
            {
                return true;
            }
        }
        else{
            Store.removeUser();
            window.location = '/?page=signin';
        }
    }).catch(() => {
        Store.removeUser();
        window.location = '/?page=signin';
    });
}
