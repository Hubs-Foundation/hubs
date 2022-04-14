import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import SigninSocial from '../signin/SigninSocial';
import UserService from '../../utilities/apiServices/UserService'
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
registerTelemetry("/signin", "Hubs Sign In Page");

export  function WarningVerifyPage() {
    if(Store.getUser()){
        window.location = '/';
    }
    else{
        return (
            <div>
                <b>
                    <p>You need to verify your account</p>
                    <p>Please go to your email and verify your account</p> 
                </b>
                <a href="/">Back Home</a>
            </div>
        )
    }
}
