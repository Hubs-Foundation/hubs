import {API_ROOT} from '../constants';
import Store from '../store';

class AvatarService {
    getListAvatar(){
        return fetch(`${API_ROOT}/v1/avatars`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    }
}

export default new AvatarService();