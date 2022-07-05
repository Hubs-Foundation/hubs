import React, {useContext, useEffect, useState} from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import Popup from '../../react-components/popup/popup';
import UserService from '../../utilities/apiServices/UserService'
import SigninSocial from '../../react-components/signin/SigninSocial';
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
import Language from './languages/language';
import { useTranslation } from 'react-i18next';

registerTelemetry("/signup", "Hubs Sign Up Page");

export  function ResetPasswordPage() {
    return (
        <ResetPassword />
    );
}

const ResetPassword = function () {  
    const user = Store.getUser();
    const { t } = useTranslation();

    const [data, setData] = useState({});
    const [submitted, setSubmited] = useState(false);
    const [error, setError] = useState(null);
    const [isOpenPoupNotification, setIsOpenPoupNotification] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(()=>{
        setLanguage(Language.getLanguage());
    },[])

    const handleChange = (e)=>{
        const { name, value } = e.target;
        setData({...data, [name]: value});
    }

    const handleChangeLanguage = (event) => {
        let lang = event.target.value;
        setLanguage(lang);
        Language.setLanguage(lang);
    };

    const handleSubmit = (e)=>{
        
        e.preventDefault();
        setSubmited(true);

        const access_token = (new URL(window.location.href).searchParams.get("token"));
        data.access_token = access_token;

        if (data.password != data.repassword) {
            setError('Re-entered password does not match')
            return false;
        }
        else{
            UserService.resetPassword(data).then((res) => {
                if(res.result == 'ok'){
                    setIsOpenPoupNotification(true);
                }
                else
                if(res.result == 'fail'){
                    setError(res.error);
                }
            })
        }
    }

    return (
        <div className="limiter">
            <div className="container-login100">
                <div className="wrap-login100 p-l-80 p-r-80 p-t-62 p-b-62">
                    <div className="gohome" style={{width: '100%'}}>
                        <div style={{float: 'left'}}>
                            <a href="./"><FaHome size={30}/></a>
                        </div>
                        <div style={{float: 'right'}}>
                            <span> {t('reset_password.LANGUAGE')} </span>
                            <select value={language} onChange={handleChangeLanguage}>
                                <option value="en">English</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>
                    <form className="login100-form validate-form flex-sb flex-w" name="form" onSubmit={handleSubmit}>
                        <span className="login100-form-title">{t('reset_password.RESET_PASSWORD')}</span>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('reset_password.PASSWORD_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Password is required">
                            <input className="input100" type="password" name="password" value={data.password} onChange={handleChange} />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('reset_password.RE_PASSWORD_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Re Password is required">
                            <input className="input100" type="password" name="repassword" value={data.repassword} onChange={handleChange} />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="container-login100-form-btn m-t-27 m-b-30">
                            <button className="login100-form-btn" disabled={false}>{t('reset_password.SAVE_BUTTON')}</button>
                        </div>
                        {error ? (
                            <div className="error-form">{error}</div>
                        ):''}
                        <div id="alternativeLogin">
                            <label className="txt1">{t('reset_password.SIGN_IN_LABEL')} <a href='/?page=signin' className='btn_signup'>{t('reset_password.SIGN_IN_BUTTON')}</a></label>
                            {/* <SigninSocial/> */}
                        </div>
                    </form>
                </div>
            </div>
            {isOpenPoupNotification && (
                <Popup
                    key={'popup-notification'}
                    title={<>{t('reset_password.POPUP_NOTIFICATION__TITLE')}</>}
                    size={'sm'}
                    content={<div style={{textAlign: 'center'}}>{t('reset_password.POPUP_NOTIFICATION__MESSAGE')}</div>}
                    actions={[
                        {
                            text: t('reset_password.POPUP_NOTIFICATION__OKAY'),
                            class: "btn1",
                            callback: ()=>{window.location = '/?page=signin'},
                        }
                    ]}
                />
            )}
        </div>
    )
}
