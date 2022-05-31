import React, {useContext, useEffect, useState} from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import { APP_ROOT } from "../../utilities/constants";
import SigninSocial from '../signin/SigninSocial';
import UserService from '../../utilities/apiServices/UserService'
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
import { AuthContext } from "../auth/AuthContext";
import StoreHub from "../../storage/store";
import hubChannel from '../../utils/hub-channel'
const store = new StoreHub();
registerTelemetry("/profile", "Profile Page");

export  function ProfilePage({props}) {
    return <Profile/>
}

const Profile = ()=>{
    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [name, setName] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const Header = () => {
        const userInfo = Store.getUser();
        const handleRemoveCookie = () => {
            store.removeHub();
            Store.removeUser();
            window.location.reload();
        };

        return (
            <div className="row_1">
                <span className="text_1"> Larchiveum</span>
                { userInfo ? (
                    <span className="display-name">
                        {userInfo.type >= 3 && (
                        <a className="manager" href={APP_ROOT + "/?page=manager"}>Manager</a>   
                        )}
                        <span className="nameA"> {userInfo.displayName || userInfo.email} </span> |{" "}
                        <a className="logout_btn" onClick={handleRemoveCookie}> Logout </a>
                    </span>
                ):(
                    <a href={APP_ROOT + "/?page=signin"} className="signin-up">
                        SignIn/SignUp
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="background-homepage">
           <Header />
            <div className="row_2">
                <div>Content</div>
            </div>
        </div>
    );
}

   


