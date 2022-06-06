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

export  function ProfilePage({props}) {
    const user = Store.getUser();
    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isOpenPopupChangeAvatar, setIsOpenPopupChangeAvatar] = useState(false);
    const [isOpenPopupCreateAvatar, setIsOpenPopupCreateAvatar] = useState(false);

    useEffect(() => {
        AvatarService.getListAvatar().then((response)=>{
            if (response.result == "ok") {
                let avatars = response.data;
                loadFromLocalStorage(avatars);
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

    const handleChangeAvatar = (avatar)=>{
        const store = JSON.parse(localStorage.getItem('___hubs_store'));
        const user = Store.getUser();

        // -> check user
        //      + if have user -> call API change update user
        // -> set avatar -> save to local

        // check user
        if(user){
            // + if have user -> call API change update user
            UserService.update(user.id, {
                avatarId: avatar.id
            }).then((response)=>{
                if(response.result == 'ok'){
                    Store.setUser(response.data);
                }
            }).catch((error)=>{
                console.log(error);
            })
        }
       
        //-> save to local
        if(avatar.isCustomAvatar){
            store.profile.avatarId = avatar.url;
        }
        else{
            store.profile.avatarId = avatar.id;
        }
        localStorage.setItem('___hubs_store', JSON.stringify(store));

        //-> set avatar
        setAvatar({...avatar});
    }

    const handleChangeDisplayName = (displayName)=>{
        const store = JSON.parse(localStorage.getItem('___hubs_store'));
        const user = Store.getUser();

        // -> check user
        //      + if have user -> call API change update user
        // -> set displayName -> save to local

        // check user
        if(user){
            // + if have user -> call API change update user
            UserService.update(user.id, {
                displayName: displayName
            }).then((response)=>{
                if(response.result == 'ok'){
                    Store.setUser(response.data);
                }
            }).catch((error)=>{
                console.log(error);
            })
        }
       
        //-> save to local
        store.profile.displayName = displayName;
        localStorage.setItem('___hubs_store', JSON.stringify(store));

        //-> set displayName
        setDisplayName(displayName);

    }

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
                    <div className="row" style={{margin: '5vh 10%'}}>
                        <a href="/">
                            <button style={{fontSize: '17px', color: '#149BF3', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #1cbeff', borderRadius: '5px'}}>Back</button>
                        </a>
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
                            handleChangeDisplayName: handleChangeDisplayName
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
                    {isOpenPopupCreateAvatar && (
                        <PopupCreateAvatar props={{
                            handleClose: ()=>{
                                setIsOpenPopupCreateAvatar(false);
                            },
                            handleResult: (avatar)=>{
                                handleChangeAvatar(avatar);
                                setIsOpenPopupCreateAvatar(false);
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
        window.location.reload();
    };

    return (
        <div className="row_1">
            <span className="text_1"> Larchiveum</span>
            { user ? (
                <span className="display-name">
                    {user.type >= 3 && (
                    <a className="manager" href={APP_ROOT + "/?page=manager"}>Manager</a>   
                    )}
                    <span className="nameA"> {user.displayName || user.email} </span> |{" "}
                    <a className="logout_btn" onClick={handleLogout}> Logout </a>
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
    const handleOpenPopupChooseAvatar = props?.handleOpenPopupChooseAvatar;
    const handleOpenPopupCreateAvatar = props?.handleOpenPopupCreateAvatar;
    
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
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                <button onClick={handleOpenPopupChooseAvatar} style={{backgroundColor: '#1180ff', padding: '10px 20px', margin: '10px', color:'white', height: '40px', borderRadius: '5px'}}>Choose Avatar</button>
                <button onClick={handleOpenPopupCreateAvatar} style={{backgroundColor: 'rgb(0 163 10)', padding: '10px 20px', margin: '10px', color:'white', height: '40px', borderRadius: '5px'}}>Create Avatar</button>
            </div>
        </div>
    );
}

const GeneralPreview = ({props})=>{
    const user = Store.getUser();
    const [displayName, setDisplayName] = useState(props?.displayName || 'My displayName');
    const [isSaving, setIsSaving] = useState(false);
    const handleChangeDisplayName = props?.handleChangeDisplayName;

    return (
        <div style={{float:'right', width: '45%', height: '100%', boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 4px'}}>
            <div style={{width: '100%', height: '10%', backgroundColor: '#efefef', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button>General Infomation</button>
            </div>
            <div style={{width: '100%', height: '80%'}}>
                <div style={{height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <div style={{width: '80%', position: 'relative'}}>
                        <span style={{height: '40px', width: '100%'}}> Display name</span>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{height: '40px', width: '100%', border: '2px solid #b1b1ff', padding: '0px 20px', margin: '10px 0px', borderRadius: '3px'}}></input>
                        <span style={{height: '40px', width: '100%', color: 'red'}}>* Only text, number</span>
                    </div>
                </div>
            </div>
            <div style={{width: '100%', height: '10%', borderTop: '2px solid rgb(239, 239, 239)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <button onClick={()=>{handleChangeDisplayName(displayName)}} style={{backgroundColor: '#1180ff', padding: '10px 20px', color:'white', height: '40px', borderRadius: '5px'}}>
                    {(isSaving ? 'Saving ...' : 'Save')}
                </button>
            </div>
        </div>
    );
}

const PopupChangeAvatar = ({props})=>{
    const user = Store.getUser();
    const [avatars, setAvatars] = useState([]);
    const [avatar, setAvatar] = useState(props?.avatar);
    const [isLoading, setIsLoading] = useState(true);
    const handleClose = props?.handleClose;
    const handleChangeAvatar = props?.handleChangeAvatar;

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
            title={<>Choose Avatar</>}
            content={
                <div style={{width: '100%', overflowY: 'auto', whiteSpace: 'nowrap', maxHeight: '60vh', height: '60vh'}}>
                { isLoading ? (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'}}>
                        <span> Loading ...</span>
                    </div>
                ) : (
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
                )}
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
            title={<>Choose Avatar</>}
            content={
                <div style={{width: '100%', overflowY: 'auto', whiteSpace: 'nowrap', maxHeight: '60vh', height: '60vh'}}>
                { isLoading ? (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'}}>
                        <span> Loading ...</span>
                    </div>
                ) : (
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
                )}
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



