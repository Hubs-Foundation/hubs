import React, { useEffect }  from 'react';
import google from "./../../assets/images/google.png";
import kakaotalk from "./../../assets/images/kakao-talk.png";
import naver from "./../../assets/images/naver.png";
import facebook from "./../../assets/images/facebook.png";

import KakaoLogin from "react-kakao-login";
import NaverLogin from 'react-naver-login';
import GoogleLogin from 'react-google-login';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import UserService from '../../utilities/apiServices/UserService'
import {naverApp,kakaoApp,facebookApp,googleApp, APP_ROOT} from '../../utilities/constants'
import Store from '../../utilities/store';
import { toast } from 'react-toastify';
import { gapi } from 'gapi-script';


function SigninSocial() {

  toast.configure();

  // useEffect(() => {
  //   gapi.load('client:auth2', ()=>{
  //     gapi.client.init({
  //       clientID: googleApp.clientID,
  //       scope: ""
  //     })
  //   })
  // }, []);

  const signupWithGoogle = (response) => {
    console.log("Google Login Success :", response);
    try {
      let data = { ggtoken : response.tokenId };
      UserService.googleLogin(data).then((response) => {
        if(response.result === 'ok'){
          Store.setUser(response.data);
          window.location = '/'
        }
        else{
          toast.error('Login failed !', {autoClose: 5000})
        }
      }).catch((error) => {
        console.error(error);
      });
    }catch(error) {
        console.error(error);
    } 
  }

  const signupWithFacebook = (response) => {
    try {
      const data = { fbtoken: response.accessToken };
      UserService.facebookLogin(data).then((response) =>  {
        if(response.result === 'ok'){
          Store.setUser(response.data);
          window.location = '/'
        }
        else{
          toast.error('Login failed !', {autoClose: 5000})
        }
      }).catch((error) => {
        console.error(error);
      });
    }catch(err) {
        console.log(err);
    } 
  }

  const signupWithKakao = (response) => {
    try {
      const data = { kktoken: response.response.access_token };
      UserService.kakaoLogin(data).then((response) =>  {
        if(response.result === 'ok'){
          Store.setUser(response.data);
          window.location = '/'
        }
        else{
          toast.error('Login failed !', {autoClose: 5000})
        }
      }).catch((error) => {
        console.error(error);
      });
    }catch(err) {
        console.log(err);
    } 
  }

  const signupWithNaver = (response) => {
    debugger
    try {
      const data = { fbtoken: response.accessToken };
      UserService.naverLogin(data).then((response) =>  {
        if(response.result === 'ok'){
          Store.setUser(response.data);
          window.location = '/'
        }
        else{
          toast.error('Login failed !', {autoClose: 5000})
        }
      }).catch((error) => {
        console.error(error);
      });
    }catch(err) {
        console.log(err);
    } 
  }

  return (
    <div id="iconGroup">
      <KakaoLogin
        token={kakaoApp.jsKey}
        onSuccess={signupWithKakao}
        onFailure={(err)=>{console.log("Kakao Login Error: ", err)}}
        render={(props) =><a onClick={props.onClick}><img src={kakaotalk}/></a>}
      />

      <NaverLogin 
        clientId={naverApp.clientID}
        callbackUrl={APP_ROOT + '?page=callback-naver-oauth'}
        onSuccess={signupWithNaver}
        onFailure={(err)=>{console.log("Naver Login Error: ", err)}}
        render={(props) =><a onClick={props.onClick} className='naver-btn'><img src={naver}/></a>}
      />

      <FacebookLogin
        appId={facebookApp.clientID}
        autoLoad={false}
        fields="name,email,picture"
        callback={signupWithFacebook}
        render={(renderProps) =><a onClick={renderProps.onClick}><img src={facebook}/></a>}
      />

      <GoogleLogin
        clientId={googleApp.clientID}
        onSuccess={signupWithGoogle}
        onFailure={(err)=>{console.log("Google Login Error: ", err)}}
        render={(props) =><a onClick={props.onClick}><img src={google}/></a>}
        cookiePolicy={'single_host_origin'}
        //isSignedIn={true}
      />
    </div>
  );
}

export default SigninSocial;
