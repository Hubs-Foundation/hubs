
import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import Store from "../../utilities/store";
import UserService from "../../utilities/apiServices/UserService";


export function WarningVerifyPage() {
    return (
      <WarningVerify/>
    );
}
  
function WarningVerify() {

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
          <span className="text_1">Larchiveum</span>
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


