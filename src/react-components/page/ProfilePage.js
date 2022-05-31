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
import AvatarService from "../../utilities/apiServices/AvatarService";
import Popup from "../../react-components/popup/popup";
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
import { AuthContext } from "../auth/AuthContext";
import StoreHub from "../../storage/store";
import hubChannel from '../../utils/hub-channel'
import { left } from "@popperjs/core";
const store = new StoreHub();

export  function ProfilePage({props}) {
    const user = Store.getUser();
    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [nickname, setNickname] = useState(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isOpenPopupChangeAvatar, setIsOpenPopupChangeAvatar] = useState(false);

    useEffect(() => {
        AvatarService.getListAvatar().then(res => {
            if (res.result == "ok") {
                setAvatars(res.data);
                if(res?.data?.length > 0){
                    let store = JSON.parse(localStorage.getItem('___hubs_store'));
                    if(!store.profile.avatarId || store.profile.avatarId == ''){
                        setAvatar({...res.data[0]});
                    }
                    else{
                        let avt = res.data.find((avt) => {
                            return avt.isCustomAvatar ? (avt.url === store.profile.avatarId) : (avt.id === store.profile.avatarId);
                        });
                        setAvatar({...avt});
                    }

                    setNickname(store.profile.displayName); 
                }
            } else {
                alert('Get list avatars fail')
            };
            setIsLoading(false);
        })
        .catch(error => {
            setIsLoading(false);
        });
    },[]);

    const handleChangeAvatar = (avatar)=>{
        let store = JSON.parse(localStorage.getItem('___hubs_store'));
        if(avatar.isCustomAvatar){
            store.profile.avatarId = avatar.url;
        }
        else{
            store.profile.avatarId = avatar.id;
        }
        localStorage.setItem('___hubs_store', JSON.stringify(store));
        setAvatar({...avatar});
    }

    const handleChangeNickname = (nickname)=>{
        let store = JSON.parse(localStorage.getItem('___hubs_store'));
        store.profile.displayName = nickname;
        localStorage.setItem('___hubs_store', JSON.stringify(store));
        setNickname({...nickname});
    }

    return (
        <div className="background-homepage" style={{width: '100%', height: '100%'}}>
             { isLoading ? (
                    <div style={{width: '100%', height: '100%',  display: 'flex', justifyContent: 'center', justifyItems: 'center'}}>
                        <button>Loading</button>
                    </div>
                ):(
                    <>
                        <Header />
                        <div className="row" style={{margin: '10vh 10% 10vh 10%', height: '60vh'}}>
                            <AvatarPreview props={{
                                avatar: avatar, 
                                handleOpenPopupChangeAvatar: ()=>{
                                    setIsOpenPopupChangeAvatar(true);
                                }
                            }}/>
                            <NicknamePreview props={{
                                nickname: nickname,
                                handleChangeNickname: handleChangeNickname
                            }}/>
                        </div>
                        {isOpenPopupChangeAvatar && (
                            <PopupChangeAvatar props={{
                                avatars: avatars, 
                                avatar: avatar,  
                                handleClose: ()=>{
                                    setIsOpenPopupChangeAvatar(false);
                                },
                                handleChangeAvatar: handleChangeAvatar
                            }}/>
                        )}
                    </>
                )}
        </div>
    );
}

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

const AvatarPreview = ({props})=>{
    const user = Store.getUser();
    const avatar = props?.avatar;
    const handleOpenPopupChangeAvatar = props?.handleOpenPopupChangeAvatar;
    
    return (
        <div style={{float:'left', width: '45%', height: '100%', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px'}}>
            <div style={{width: '100%', height: '10%', backgroundColor: '#efefef',  display: 'flex', justifyContent: 'center', justifyItems: 'center'}}>
                <button>Avatar</button>
            </div>
            <div style={{width: '100%', height: '80%'}}>
                <div style={{height: '100%'}}>
                    <model-viewer style={{width:'100%', height: '100%'}} src={avatar?.isCustomAvatar ? avatar?.url : avatar?.gltfs?.avatar} camera-controls></model-viewer>
                </div>
            </div>
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button onClick={handleOpenPopupChangeAvatar} style={{backgroundColor: '#1180ff', padding: '10px 20px', color:'white', height: '40px', borderRadius: '5px'}}>Change Avatar</button>
            </div>
        </div>
    );
}

const NicknamePreview = ({props})=>{
    const user = Store.getUser();
    const [nickname, setNickname] = useState(props?.nickname || 'My nickname');
    const handleChangeNickname = props?.handleChangeNickname;

    return (
        <div style={{float:'right', width: '45%', height: '100%', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px'}}>
            <div style={{width: '100%', height: '10%', backgroundColor: '#efefef', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button>Nickname</button>
            </div>
            <div style={{width: '100%', height: '80%'}}>
                <div style={{height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} style={{height: '40px', width: '80%', border: '2px solid #b1b1ff', padding: '0px 20px', borderRadius: '3px'}}></input>
                </div>
            </div>
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button onClick={()=>{handleChangeNickname(nickname)}} style={{backgroundColor: '#1180ff', padding: '10px 20px', color:'white', height: '40px', borderRadius: '5px'}}>Change Nickname</button>
            </div>
        </div>
    );
}

const PopupChangeAvatar = ({props})=>{
    const user = Store.getUser();
    const [avatars, setAvatars] = useState(props?.avatars);
    const [avatar, setAvatar] = useState(props?.avatar);
    const handleClose = props?.handleClose;
    const handleChangeAvatar = props?.handleChangeAvatar;

    let selectedAvatar = avatar;

    const handleSelectAvatar = (e, avt)=>{
        let elements = document.querySelectorAll('.preview-avatar');
        for (const element of elements) {
            element.style.border = '1px solid gray';
        }
        e.currentTarget.style.border = '2px solid blue';
        selectedAvatar = avt;
    }

    const handleConfirmSelectAvatar = ()=>{
        handleChangeAvatar(selectedAvatar);
        handleClose();
    }

    return (
        <Popup
            size={"lg"}
            title={<>Change Avatar</>}
            content={
                <div style={{width: '100%', overflowY: 'scroll', whiteSpace: 'nowrap', maxHeight: '60vh'}}>
                    <div>
                        {avatars.map((avatar)=>{
                            return(
                                <div className="preview-avatar" onClick={(e)=>{handleSelectAvatar(e, avatar)}} style={{ height: '200px', margin: '2%', float: 'left', width: '21%', border: avatar.selected ? '2px solid blue' : '1px solid gray', backgroundColor: 'whitesmoke'}}>
                                    {avatar.isCustomAvatar ? (
                                        <model-viewer style={{width:'100%', height: '100%'}} src={avatar.url} camera-controls ></model-viewer>
                                    ):(
                                        <img style={{width:'100%', height: '100%'}} src={avatar.images.preview.url} camera-controls></img>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            }
            handleClose={handleClose}
            actions={[
                {
                    text: "Cancle",
                    class: "btn2",
                    callback: () => {
                        handleClose(false);
                    }
                },
                {
                    text: "Choose",
                    class: "btn2",
                    callback: () => {
                        handleConfirmSelectAvatar();
                    }
                },
            ]}
        />
    );
};

