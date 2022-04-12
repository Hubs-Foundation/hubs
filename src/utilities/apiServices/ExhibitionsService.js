import {API_ROOT} from '../constants';
import Store from '../store';

class ExhibitionsService {
    getAllExhibitions(data){
        return fetch(`${API_ROOT}/v1/exhibitions?page=${data.page?data.page:1}&pageSize=${data.pageSize?data.pageSize:15}&sort=${data.sort?data.sort:''}`, {
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
    };

    getAllWithAuthExhibitions(data){
        return fetch(`${API_ROOT}/v1/auth/exhibitions?page=${data.page?data.page:1}&pageSize=${data.pageSize?data.pageSize:15}&sort=${data.sort?data.sort:''}`, {
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
    };

    getAllScenes(){
        return fetch(`${API_ROOT}/v1/auth/exhibitions/getAllScenes`, {
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
    };

    postCreateOne(data){
        return fetch(`${API_ROOT}/v1/auth/exhibitions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };
    
    putUpdateOne(data){
        return fetch(`${API_ROOT}/v1/auth/exhibitions/${data.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    patchTogglePublic(id){
        return fetch(`${API_ROOT}/v1/auth/exhibitions/${id}/togglePublic`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify({
                id: id
            })
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    }

}

export default new ExhibitionsService();