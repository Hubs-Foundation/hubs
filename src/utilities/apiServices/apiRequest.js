import axios from 'axios';
import Cookies from "js-cookie";
import {API_ROOT} from './../constants';

const service = axios.create({
    baseURL: API_ROOT,
    timeout: 15000
})

service.interceptors.request.use(
    (config) => {
        var v = Cookies.get('access_token');
        // if(Cookies.get('access_token')) config.headers['access_token'] = Cookies.get('access_token');
        return config;
    },
    (error) => {
        Promise.reject(error);
    }
)

service.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default service;