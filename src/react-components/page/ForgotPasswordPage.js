import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import UserService from '../../utilities/apiServices/UserService'
import SigninSocial from '../signin/SigninSocial';
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
import Popup from '../../react-components/popup/popup';
import 'reactjs-popup/dist/index.css';
import Language from './languages/language';
import { useTranslation } from 'react-i18next';

registerTelemetry("/signup", "Hubs Sign Up Page");

export  function ForgotPasswordPage() {
    return (
        <ForgotPassword />
    );
}

const ForgotPassword = function () {  
    const user = Store.getUser();
    const { t } = useTranslation();

    const [email, setEmail] = useState(null);
    const [submitted, setSubmited] = useState(false);
    const [isOpenPoupEmailSentNotification, setIsOpenPoupEmailSentNotification] = useState(false);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('en');

    useEffect(()=>{
        setLanguage(Language.getLanguage());
    },[])

    const handleChangeEmail = (e)=>{
        const { name, value } = e.target;
        setEmail(value);
    }

    const handleChangeLanguage = (event) => {
        let lang = event.target.value;
        setLanguage(lang);
        Language.setLanguage(lang);
    };

    const handleSubmit = (e)=>{  
        e.preventDefault();
        setSubmited(true);
        let data = { email: email};
        UserService.requestResetPassword(data).then((res) => {
            if(res.result == 'ok'){
                setIsOpenPoupEmailSentNotification(true);
            }
            else
            if(res.result == 'fail'){
                setError(t('signup.SIGN_UP_ERROR__' + res.error.toUpperCase()));
                setError(res.error);
            }
        })
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
                            <span> {t('forgot_password.LANGUAGE')} </span>
                            <select value={language} onChange={handleChangeLanguage}>
                                <option value="en">English</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>
                    <form className="login100-form validate-form flex-sb flex-w" name="form" onSubmit={handleSubmit}>
                        <span className="login100-form-title">
                            {t('forgot_password.FORGOT_PASSWORD')}
                        </span>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">
                                {t('forgot_password.EMAIL_LABEL')}
                            </span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Email is required">
                            <input className="input100" type="email" name="email" value={email || ''} onChange={handleChangeEmail}  />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="container-login100-form-btn m-t-27 m-b-30">
                            <button className="login100-form-btn">
                                {t('forgot_password.SEND_BUTTON')}
                            </button>
                        </div>
                        {error ? (
                            <div className="error-form">{error}</div>
                        ):''}
                        <div id="alternativeLogin">
                            <label className="txt1">{t('forgot_password.SIGN_IN_LABEL')} <a href='/?page=signin' className='btn_signup'>{t('forgot_password.SIGN_IN_BUTTON')}</a></label>
                        </div>
                    </form>
                </div>
            </div>
            {isOpenPoupEmailSentNotification && (
                <Popup
                    title={<>{t('forgot_password.POPUP_NOTIFICATION__TITLE')}</>}
                    size={'sm'}
                    content={<div style={{textAlign: 'center'}}>{t('forgot_password.POPUP_NOTIFICATION__MESSAGE')}</div>}
                    actions={[
                        {
                            text: t('forgot_password.POPUP_NOTIFICATION__OKAY'),
                            class: "btn1",
                            callback: ()=>{setIsOpenPoupEmailSentNotification(false)},
                        }
                    ]}
                    handleClose={()=>{setIsOpenPoupEmailSentNotification(false)}}
                />
            )}
        </div>
    )
}
