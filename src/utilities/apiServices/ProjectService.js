import {API_ROOT} from '../constants';
import Store from '../store';

class ProjectService {
    getListProject(data){
        return fetch(`${API_ROOT}/v1/auth/projects?page=${data.page?data.page:1}&pageSize=${data.pageSize?data.pageSize:15}&sort=${data.sort?data.sort:''}`, {
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

    getListObject(id){
        return fetch(`${API_ROOT}/v1/auth/projects/${id}/objects?sort=type|desc`, {
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

    getListProjectWithObjects(data){
        return fetch(`${API_ROOT}/v1/auth/projects/objects?page=${data.page?data.page:1}&pageSize=${data.pageSize?data.pageSize:15}&sort=${data.sort?data.sort:''}`, {
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

    updateChangeableObjects(projectId,data){
        return fetch(`${API_ROOT}/v1/auth/projects/${projectId}/objects`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify({
                uuids: data
            })

        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    }

}

export default new ProjectService();