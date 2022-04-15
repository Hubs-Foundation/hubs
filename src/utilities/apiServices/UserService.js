
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

    check2Token(larchiveumToken,hubsToken){
        return fetch(`${API_ROOT}/v1/users/check2Token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                larchiveumToken: larchiveumToken,
                hubsToken: hubsToken
            })
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

    checkToken(token){
        return apiRequest.post('/v1/auth/users/checkToken', {access_token: token});
    }
}

export default new UserService();