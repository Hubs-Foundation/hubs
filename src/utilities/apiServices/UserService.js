
import apiRequest from './apiRequest';
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

    naverLogin(data){
        return fetch(`${API_ROOT}/v1/nvlogin`, {
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

    kakaoLogin(data){
        return fetch(`${API_ROOT}/v1/kklogin`, {
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

    checkToken(token){
        return fetch(`${API_ROOT}/v1/users/checkToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token
            })
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    requestResetPassword(email){
        
        return fetch(`${API_ROOT}/v1/users/requestResetPassword`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(email)
        })
        .then((res) => res.json())
        .catch((error) => {
            console.log(error)
        });
    };

    resetPassword(data){
        return fetch(`${API_ROOT}/v1/users/resetPassword`, {
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

    verifyUser(token){
       return apiRequest.post('/v1/auth/users/verifyUser', {access_token: token});
    }

    reSendVerifyMail(email){
        return apiRequest.post('v1/users/reSendVerifyMail', {email: email});
    }

    update(id, data){
        return apiRequest.patch(`v1/auth/users/${id}`, data).then(response => response.data);
    }
}

export default new UserService();