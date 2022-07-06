import React, {useContext, useEffect, useState} from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import UserService from '../../utilities/apiServices/UserService'
import SigninSocial from '../../react-components/signin/SigninSocial';
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
import Language from './languages/language';
import { useTranslation } from 'react-i18next';

registerTelemetry("/signup", "Hubs Sign Up Page");

export  function SignupPage() {

    return (
        <SignUpForm />
    );
}

const SignUpForm = function () {  
    const user = Store.getUser();
    const { t } = useTranslation();
    
    const [data, setData] = useState({});
    const [submitted, setSubmited] = useState(false);
    const [error, setError] = useState(null);
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

        if(data.password != data.repassword){
            setError(t('signup.SIGN_UP_ERROR__RE_PASSWORD_NOT_MATCH'));
            return;
        }

        UserService.signupWithEmail(data).then((res) => {
            this.setState({ disabled : true });
            if(res.result == 'ok'){
                Store.removeUser();
                window.location = `/?page=warning-verify&email=${res.data.email}`;
            }
            else
            if(res.result == 'fail'){
                setError(t('signup.SIGN_UP_ERROR__' + res.error.toUpperCase()));
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
                            <span> {t('signup.LANGUAGE')} </span>
                            <select value={language} onChange={handleChangeLanguage}>
                                <option value="en">English</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>
                    <form className="login100-form validate-form flex-sb flex-w" name="form" onSubmit={handleSubmit}>
                        <span className="login100-form-title">
                            {t('signup.SIGN_UP')}
                        </span>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('signup.DISPLAY_NAME_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Username is required">
                            <input className="input100" type="text" name="displayName" value={data.displayName || ''} onChange={handleChange} />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('signup.EMAIL_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Email is required">
                            <input className="input100" type="email" name="email" value={data.email || ''} onChange={handleChange}  />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('signup.PASSWORD_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Password is required">
                            <input className="input100" type="password" name="password" value={data.password || ''} onChange={handleChange} />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="p-t-13 p-b-9">
                            <span className="txt1">{t('signup.RE_PASSWORD_LABEL')}</span>
                        </div>
                        <div className="wrap-input100 validate-input" data-validate="Re Password is required">
                            <input className="input100" type="password" name="repassword" value={data.repassword || ''} onChange={handleChange} />
                            <span className="focus-input100"></span>
                        </div>
                        <div className="container-login100-form-btn m-t-27 m-b-30">
                            <button className="login100-form-btn">{t('signup.SIGN_UP_BUTTON')}</button>
                        </div>
                        {error ? (
                            <div className="error-form">{error}</div>
                        ): ''}
                        <div id="alternativeLogin">
                            <label className="txt1">{t('signup.SIGN_IN_LABEL')} <a href='/?page=signin' className='btn_signup'>{t('signup.SIGN_IN_BUTTON')}</a></label>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

