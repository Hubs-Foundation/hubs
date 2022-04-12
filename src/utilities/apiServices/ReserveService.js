
import request from './apiRequest';
import {API_ROOT} from '../constants';
import Store from '../store';

class ReserveService {
    createReservations(id){
        return fetch(`${API_ROOT}/v1/auth/reservations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'access_token': Store.getUser()?.token
            },
            body: JSON.stringify({
                exhibitionId: id
            })
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };
    deleteReservations(data){
        return fetch(`${API_ROOT}/v1/auth/reservations/${data.id}`, {
            method: "DELETE",
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
    


}

export default new ReserveService();