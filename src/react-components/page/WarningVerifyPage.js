
import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import Store from "../../utilities/store";
import StoreHub from "../../storage/store";
import UserService from "../../utilities/apiServices/UserService";
import logo from "./../../assets/images/larchiveum_logo.png";

const store = new StoreHub();
window.APP = { store };

function auth(){
  const removeToken = ()=>{
    Store.removeUser();
  }

  const token = Store.getUser()?.token;
  return UserService.checkToken(token).then((res) => {
    if(res.result == 'ok'){
      window.location = '/';
    }
    else{
      removeToken();
    }
  }).catch((error) => {
    console.log('catch');
  });
}

export function WarningVerifyPage() {
    return (
      <WarningVerify/>
    );
}
  
function WarningVerify() {
    auth();
    const [sending, setSending] = useState(false);
    const [sendingMessage, setSendingMessage] = useState('');

    const email = (new URLSearchParams(location.href)).get('email') || Store.getUser()?.email ;
    const sendEmail = ()=>{
        setSending(true);
        UserService.reSendVerifyMail(email)
            .then((response)=>{
                if(response.data.result == 'ok'){
                    setSending(false);
                    sendingMessage("Send email success")
                }
                else{
                    setSending(false);
                    sendingMessage("Send email fail!")
                }
            })
            .catch((error)=>{
                setSending(false);
                sendingMessage("Send email fail!")
            });
    } 

    const ResendButton = ()=>{
        if(!sending){
            return (
                <div className="d-flex center-flex">
                    <a className="btn btn-backhome" onClick={sendEmail}>Re-send Email</a>
                </div>
            )
        }
        else {
            return (
                <div className="d-flex center-flex">
                    <a className="btn btn-backhome">Sending</a>
                </div>
            )
        }
        
    }

    return (
        <div className='manager-page height-100vh'>
          <div className="row_1">
            <a href="/" style={{float: 'left', height: '100%'}}>
              <img src={logo} style={{height: '100%'}}/>
            </a>
          </div>
        <div className="row_2">
            <b className="warning-content">
                <p className="margintop30vh"> You need to verify your account</p>
                <p>Please go to your email and verify your account</p> 
                <div className="d-flex center-flex"><a className="btn btn-backhome" href="/">Back Home</a></div>
                <ResendButton/>
            </b>
        </div>
      </div>
    );
}


