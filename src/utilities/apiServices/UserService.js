
import request from './apiRequest';
import {API_ROOT} from './../constants';


class UserService {

    googleLogin(data){
        return fetch(`${API_ROOT}/v1/gglogin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    facebookLogin(data){
        return fetch(`${API_ROOT}/v1/fblogin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    signupWithEmail(data){
        return fetch(`${API_ROOT}/v1/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    login(data){
        return fetch(`${API_ROOT}/v1/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };


}

export default new UserService();