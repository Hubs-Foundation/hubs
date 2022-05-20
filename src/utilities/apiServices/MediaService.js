import {API_ROOT} from '../constants';
import Store from '../store';

class MediaService {
    getListMedia(id){
        return fetch(`${API_ROOT}/v1/auth/medias?exhibitionId=${id}`, {
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

    proxyMedia(objectId){
        return fetch(`${API_ROOT}/v1/medias/proxy/${objectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                'access_token': ''
            },
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    }

    updateMediaMany(data){
        return fetch(`${API_ROOT}/v1/auth/medias`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify({
                medias: data
            })

        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    }

}

export default new MediaService();