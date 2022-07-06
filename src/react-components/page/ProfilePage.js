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
import hubChannel from '../../utils/hub-channel'
import { left } from "@popperjs/core";
import async from "async";
import moment from 'moment';
import Language from './languages/language';
import { useTranslation } from 'react-i18next';

export  function ProfilePage({props}) {
    const user = Store.getUser();
    const { t } = useTranslation();

    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [language, setLanguage] = useState('en');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isOpenPopupChangeAvatar, setIsOpenPopupChangeAvatar] = useState(false);
    const [isOpenPopupCreateAvatar, setIsOpenPopupCreateAvatar] = useState(false);
    const [isOpenPopupChangeDisplayName, setIsOpenPopupChangeDisplayName] = useState(false);

    useEffect(() => {
        AvatarService.getListAvatar().then((response)=>{
            if (response.result == "ok") {
                let avatars = response.data;
                loadFromLocalStorage(avatars);
                setLanguage(Language.getLanguage());
                setIsLoading(false);
            } else {
                alert('Get list avatar fail')
            };
        });
    },[]);

    function loadFromLocalStorage(avatars) {
        const store = JSON.parse(localStorage.getItem('___hubs_store'));
        const user = Store.getUser();

        if(user){ 
            // if don't have user
            // + displayName
            //    -> set displayName by displayName of user -> save to local
            // + avatar
            //    -> check user avatar
            //    + if user has avatar -> set avatar by avatar of user
            //    + else -> check user.avatarId
            //        + if user.avatarId not null -> get avatar is avatar in list ( which has avatarId = user.avatarId )  
            //        + else -> set avatar is default (first avatar in list)
            //    -> save to local

            // + displayName
            if(user.displayName){
                //-> set displayName by displayName of user -> save to local
                store.profile.displayName = user.displayName;
                setDisplayName(store.profile.displayName);
            }

            // + avatar
            if(user.avatar){
                //-> if user has avatar -> set avatar by avatar of user
                let avatar = user.avatar;
                setAvatar({...avatar});
            }
            else{
                // check user.avatarId
                let avatar;
                if(user.avatarId){
                    //-> get avatar is avatar in list ( which has avatarId = user.avatarId )
                    avatar = avatars.find(avt => avt.id == user.avatarId);
                }
                else{
                    //-> set avatar is default (first avatar in list)
                    avatar = avatars[0];
                }
                setAvatar({...avatar});
            }
        }
        else 
        {   
            // if don't have user
            // + displayName
            //    -> if have displayName in local -> set displayName by displayName in local
            //    -> else -> set default displayName -> save to local
            // + avatar
            //    -> if have avatar in local -> set avatar by avatar in local
            //    -> else -> set default avatar (first avatar in avatars) -> save to local


            // + displayName
            if(store.profile.displayName){
                //-> if have displayName in local -> set displayName by displayName in local
                setDisplayName(store.profile.displayName);
            }
            else{
                //-> else -> set default displayName -> save to local
                store.profile.displayName = 'Visitor-' + moment().format('YYYYMMDDhhmmss');
                setDisplayName(store.profile.displayName);
            }

            // + avatar
            if(store.profile.avatarId){
                //-> if have avatar in local -> set avatar by avatar in local
                let avatar = avatars.find( avt => avt.id == store.profile.avatarId);
                if(!avatar){
                    avatar = {
                        isCustomAvatar: true,
                        url: store.profile.avatarId
                    }
                }
                setAvatar({...avatar});
            }
            else{
                //-> else -> set default avatar (first avatar in avatars) -> save to local
                let avatar = avatars[0];
                setAvatar({...avatar});
            }
        }

        localStorage.setItem('___hubs_store', JSON.stringify(store));
    }

    const handleResultAvatar = (avatar)=>{
        setAvatar({...avatar});
    }

    const handleResultDisplayName = (displayName)=>{
        setDisplayName(displayName);
    }

    const handleChangeLanguage = (event) => {
        let lang = event.target.value;
        setLanguage(lang);
        Language.setLanguage(lang);
    };

    return (
        <div className="background-homepage" style={{width: '100%', height: '100%'}}>
            { isLoading ? (
                <div className="loader-2">
                    <div className="loader">
                        <svg viewBox="0 0 80 80">
                            <circle id="test" cx="40" cy="40" r="32"></circle>
                        </svg>
                    </div>
                    <div className="loader triangle">
                        <svg viewBox="0 0 86 80">
                            <polygon points="43 8 79 72 7 72"></polygon>
                        </svg>
                    </div>
                    <div className="loader">
                        <svg viewBox="0 0 80 80">
                            <rect x="8" y="8" width="64" height="64"></rect>
                        </svg>
                    </div>
                </div>
            ):(
                <>
                    <Header />
                    <div style={{margin: '5vh 10%'}}>
                        <a href="/">
                            <button style={{fontSize: '17px', color: '#149BF3', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #1cbeff', borderRadius: '5px'}}>{t('profile.BACK')}</button>
                        </a>
                        <div style={{float: 'right'}}>
                            <span> {t('profile.LANGUAGE')} </span>
                            <select value={language} onChange={handleChangeLanguage}>
                                <option value="en">English</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>
                    <div className="row" style={{margin: '5vh 10% 5vh 10%', height: '60vh'}}>
                        <AvatarPreview props={{
                            avatar: avatar, 
                            handleOpenPopupChooseAvatar: ()=>{
                                setIsOpenPopupChangeAvatar(true);
                            },
                            handleOpenPopupCreateAvatar: ()=>{
                                setIsOpenPopupCreateAvatar(true);
                            }
                        }}/>
                        <GeneralPreview props={{
                            displayName: displayName,
                            handleOpenPopupChangeDisplayName: ()=>{
                                setIsOpenPopupChangeDisplayName(true);
                            }
                        }}/>
                    </div>
                    {isOpenPopupChangeAvatar && (
                        <PopupChangeAvatar props={{
                            avatars: avatars, 
                            avatar: avatar,  
                            handleClose: ()=>{
                                setIsOpenPopupChangeAvatar(false);
                            },
                            handleResult: handleResultAvatar
                        }}/>
                    )}
                    {isOpenPopupCreateAvatar && (
                        <PopupCreateAvatar props={{
                            handleClose: ()=>{
                                setIsOpenPopupCreateAvatar(false);
                            },
                            handleResult: (avatar)=>{
                                handleResultAvatar(avatar);
                                setIsOpenPopupCreateAvatar(false);
                            },
                        }}/>
                    )}
                    {isOpenPopupChangeDisplayName && (
                        <PopupChangeDisplayName props={{
                            displayName: displayName,
                            handleClose: ()=>{
                                setIsOpenPopupChangeDisplayName(false);
                            },
                            handleResult: (displayName)=>{
                                handleResultDisplayName(displayName);
                                setIsOpenPopupChangeDisplayName(false);
                            },
                        }}/>
                    )}
                </>
            )}
        </div>
    );
}

const Header = () => {
    const user = Store.getUser();

    const handleLogout = () => {
        Store.removeUser();
        window.location.href = '/';
    };

    return (
        <div className="row_1">
            <a href="/"><span className="text_1">Larchiveum</span></a>
            { user ? (
                <span className="display-name">
                    <span className="nameA"> {user.displayName || user.email} </span> |{" "}
                    <a className="logout_btn" onClick={handleLogout}> Sign out </a>
                </span>
            ):(
                <></>
            )}
        </div>
    );
};

const AvatarPreview = ({props})=>{
    const user = Store.getUser();
    const avatar = props?.avatar;
    const handleOpenPopupChooseAvatar = props?.handleOpenPopupChooseAvatar;
    const handleOpenPopupCreateAvatar = props?.handleOpenPopupCreateAvatar;
    
    return (
        <div style={{float:'left', width: '45%', height: '100%', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px'}}>
            <div style={{width: '100%', height: '10%', backgroundColor: '#efefef',  display: 'flex', justifyContent: 'center', justifyItems: 'center'}}>
                <button>{t('profile.AVATAR_PANEL__TITLE')}</button>
            </div>
            <div style={{width: '100%', height: '80%'}}>
                <div style={{height: '100%'}}>
                    <model-viewer style={{width:'100%', height: '100%'}} src={avatar?.isCustomAvatar ? avatar?.url : avatar?.gltfs?.avatar} camera-controls></model-viewer>
                </div>
            </div>
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                <button onClick={handleOpenPopupChooseAvatar} style={{backgroundColor: '#1180ff', padding: '10px 20px', margin: '10px', color:'white', height: '40px', borderRadius: '5px'}}>{t('profile.AVATAR_PANEL__CHOOSE_AVATAR')}</button>
            </div>
        </div>
    );
}

const GeneralPreview = ({props})=>{
    const user = Store.getUser();
    const displayName = props?.displayName || 'My displayName';
    const handleOpenPopupChangeDisplayName = props?.handleOpenPopupChangeDisplayName;

    return (
        <div style={{float:'right', width: '45%', height: '100%', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px'}}>
            <div style={{width: '100%', height: '10%', backgroundColor: '#efefef', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button>{t('profile.GENERAL_PANEL__TITLE')}</button>
            </div>
            <div style={{width: '100%', height: '80%'}}>
                <div style={{height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <div style={{width: '80%', position: 'relative'}}>
                        <span style={{height: '40px', width: '100%'}}> Display name :</span>
                        <div type="text" style={{display: 'flex', alignItems: 'center', height: '40px', width: '100%', border: '2px solid #b1b1ff', padding: '0px 20px', margin: '10px 0px', borderRadius: '3px'}}>{displayName}</div>
                    </div>
                </div>
            </div>
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button onClick={handleOpenPopupChangeDisplayName} style={{backgroundColor: '#1180ff', padding: '10px 20px', color:'white', height: '40px', borderRadius: '5px'}}>{t('profile.GENERAL_PANEL__CHANGE_DISPLAY_NAME')}</button>
            </div>
        </div>
    );
}

const PopupChangeAvatar = ({props})=>{
    const user = Store.getUser();
    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(props?.avatar);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const handleClose = props?.handleClose;
    const handleResult = props?.handleResult;

    const handleChangeAvatar = (avatar)=>{
        setIsSaving(true);
        const store = JSON.parse(localStorage.getItem('___hubs_store'));
        const user = Store.getUser();
        // -> set avatar -> save to local
        // -> check user
        //      + if have user -> call API change update user
        

        //-> save to local
        if(avatar.isCustomAvatar){
            store.profile.avatarId = avatar.url;
        }
        else{
            store.profile.avatarId = avatar.id;
        }
        localStorage.setItem('___hubs_store', JSON.stringify(store));

        // check user
        if(user){
            // + if have user -> call API change update user
            UserService.update(user.id, {
                avatarId: avatar.id
            }).then((response)=>{
                if(response.result == 'ok'){
                    Store.setUser(response.data);
                    handleResult(avatar);
                    setIsSaving(false);
                }
            }).catch((error)=>{
                console.log(error);
            })
        }
        else{
            handleResult(avatar);
            setIsSaving(false);
        }
    }

    let selectedAvatar = avatar;

    useEffect(()=>{
        loadAvatars();
    }, []);

    function loadAvatars() {  
        AvatarService.getListAvatar().then((response)=>{
            if (response.result == "ok") {
                let avatars = response.data;
                setAvatars(avatars);
            } else {
                alert('Get list avatars fail')
            };
            setIsLoading(false);
        }).catch((error)=>{
            setIsLoading(false);
            alert('Load list avatar fail !');
        });
    }

    const handleSelectAvatar = (e, avt)=>{
        let elements = document.querySelectorAll('.preview-avatar');
        for (const element of elements) {
            element.style.border = '1px solid gray';
        }
        e.currentTarget.style.border = '4px solid blue';
        selectedAvatar = avt;
    }

    const handleConfirmSelectAvatar = ()=>{
        handleChangeAvatar(selectedAvatar);
        handleClose();
    }

    return (
        <Popup
            key={'popup-change-avatar'}
            size={"lg"}
            title={<>{t('profile.POPUP_CHANGE_AVATAR__TITLE')}</>}
            content={
                <div style={{width: '100%', overflowY: 'auto', whiteSpace: 'nowrap', maxHeight: '60vh', height: '60vh'}}>
                { isLoading ? (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'}}>
                        <span>{t('profile.POPUP_CHANGE_AVATAR__LOADING')}</span>
                    </div>
                ) : (
                    <div>
                        {avatars.map((avt)=>{
                            return(
                                <div key={avt.id} className="preview-avatar" onClick={(e)=>{handleSelectAvatar(e, avt)}} style={{ height: '200px', margin: '2%', float: 'left', width: '21%', border: (avt.id == avatar.id ? '4px solid blue' : '1px solid gray'), backgroundColor: 'whitesmoke'}}>
                                    {avt.isCustomAvatar ? (
                                        <model-viewer style={{width:'100%', height: '100%'}} src={avt.url}></model-viewer>
                                    ):(
                                        <img style={{width:'100%', height: '100%'}} src={avt.images.preview.url}></img>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                </div>
            }

            handleClose={handleClose}
            actions={[
                {
                    text: (isSaving ? t('profile.POPUP_CHANGE_AVATAR__SAVING') : t('profile.POPUP_CHANGE_AVATAR__SAVE')),
                    class: "btn2",
                    callback: () => {
                        handleConfirmSelectAvatar();
                    }
                },
                {
                    text: t('profile.POPUP_CHANGE_AVATAR__CANCEL') ,
                    class: "btn2",
                    callback: () => {
                        handleClose(false);
                    }
                },
            ]}
        />
    );
};

const PopupCreateAvatar = ({props})=>{
    const user = Store.getUser();
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isHiddenCreateButton, setIsHiddenCreateButton] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const handleClose = props?.handleClose;
    const handleResult = props?.handleResult;

    const handleCreateAvatar = ()=>{
        setIsSaving(true);
        if(user){
            AvatarService.create({url: avatarUrl}).then((response)=>{
                setIsSaving(false);
                handleResult(response.data);
            }).catch((error)=>{
                setIsSaving(false);
                console.log(error);
            });
        }
        else{
            setIsSaving(false);
            handleResult({
                isCustomAvatar: true,
                url: avatarUrl
            });
        }
    }

    useEffect(()=>{
        window.addEventListener('message', (event)=>{
            if (event.origin.startsWith('https://larchiveum.ready') && event.data.toString().includes('.glb')) {
               setAvatarUrl(event.data);
               setIsHiddenCreateButton(false);
            }
        });
    },[]);

    return (
        <Popup
            size={"lg"}
            title={<>Change Avatar</>}
            content={
                <div style={{position: 'relative', width: '100%', height: '60vh'}}>
                    <iframe src="https://larchiveum.readyplayer.me/avatar?frameApi" width="100%" height="100%"></iframe>
                    { avatarUrl && (
                        <div style={{position: 'absolute',  width: '100%', height: '100%', top: '0px', backgroundColor: 'white'}}>
                            <model-viewer style={{width:'100%', height: '100%'}} src={avatarUrl} camera-controls></model-viewer>
                        </div>
                    )}
                </div>
            }
            actions={[
                {
                    text: (isSaving ? 'Saving...' : 'Choose'),
                    class: "btn2",
                    hidden: isHiddenCreateButton,
                    callback: handleCreateAvatar
                }
            ]}
            handleClose={handleClose}
        />
    );
};

const PopupChangeDisplayName = ({props})=>{
    const user = Store.getUser();
    const [displayName, setDisplayName] = useState(props?.displayName);
    const [isSaving, setIsSaving] = useState(false);
    const handleClose = props?.handleClose;
    const handleResult = props?.handleResult;

    const handleInputChange = (e)=>{
        let value = e.target.value;
        setDisplayName(value);
    }

    const handleChangeDisplayName = ()=>{
        setIsSaving(true);
        const store = JSON.parse(localStorage.getItem('___hubs_store'));
        const user = Store.getUser();

        // -> save to local
        // -> check user
        //      + if have user -> call API change update user
        // -> set displayName 

        //-> save to local
        store.profile.displayName = displayName;
        localStorage.setItem('___hubs_store', JSON.stringify(store));

        // check user
        if(user){
            // + if have user -> call API change update user
            UserService.update(user.id, {
                displayName: displayName
            }).then((response)=>{
                if(response.result == 'ok'){
                    Store.setUser(response.data);
                    handleResult(displayName);
                    setIsSaving(false);
                }
            }).catch((error)=>{
                console.log(error);
            })
        }
        else{
            handleResult(displayName);
            setIsSaving(false);
        }
    }


    return (
        <Popup
            size={"lg"}
            title={<>{t('profile.POPUP_CHANGE_DISPLAY_NAME__TITLE')}</>}
            content={
                <div style={{width: '100%', maxHeight: '60vh', height: '60vh'}}>
                    <div style={{width: '100%', height: '80%'}}>
                        <div style={{height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <div style={{width: '80%', position: 'relative'}}>
                                <span style={{height: '40px', width: '100%'}}> {t('profile.POPUP_CHANGE_DISPLAY_NAME__DISPLAY_NAME_LABEL')}</span>
                                <input type="text" value={displayName} onChange={handleInputChange} style={{display: 'flex', alignItems: 'center', height: '40px', width: '100%', border: '2px solid #b1b1ff', padding: '0px 20px', margin: '10px 0px', borderRadius: '3px'}}></input>
                                <div style={{color: '#9d9d9d'}}>{t('profile.POPUP_CHANGE_DISPLAY_NAME__DISPLAY_NAME_NOTE')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            }

            handleClose={handleClose}
            actions={[
                {
                    text: (isSaving ? t('profile.POPUP_CHANGE_DISPLAY_NAME__SAVING') : t('profile.POPUP_CHANGE_DISPLAY_NAME__SAVE')),
                    class: "btn2",
                    callback: () => {
                        handleChangeDisplayName();
                    }
                },
                {
                    text: t('profile.POPUP_CHANGE_DISPLAY_NAME__CANCEL'),
                    class: "btn2",
                    callback: () => {
                        handleClose(false);
                    }
                },
            ]}
        />
    );
};



