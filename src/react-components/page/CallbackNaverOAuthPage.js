import React, { useContext, useEffect, useState } from "react";
import { toast } from 'react-toastify';
import UserService from '../../utilities/apiServices/UserService'

export  function CallbackNaverOAuthPage(props) {
    useEffect(() => {
        let hash = location.hash;
        if(hash && hash !== 'error' && hash.length > 0) {
            let search = hash.substring(1); // remove #
            let obj = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
            /**
                access_token: ""
                expires_in: "3600"
                state: ""
                token_type: "bearer"
            */
            const data = { nvtoken: obj.access_token };
            UserService.naverLogin(data).then((response) => {
                Store.setUser(response.data);
                const checkAuth = Store.getUser();
                if(checkAuth)
                {
                  window.location = '/'
                }
                else{
                  toast.error('Login failed !', {autoClose: 5000})
                }
            }).catch((error) => {
                console.log(error);
            });
            
            open(location, '_self').close();
        }
        else {
            console.log("Error");
        }
    },[]);

    return (
        <span>Authenticating...</span>
    )
}
