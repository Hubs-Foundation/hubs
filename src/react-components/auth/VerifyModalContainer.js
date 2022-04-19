import React, { useState, useContext, useEffect } from "react";
import async from "async";
import { AuthContext } from "./AuthContext";
import { VerifyModal, VerificationError, EmailVerified, VerifyingEmail } from "./VerifyModal";
import UserService from "../../utilities/apiServices/UserService";
import Store from '../../utilities/store';
import StoreHub from "../../storage/store";
import hubChannel from './../../utils/hub-channel'

const store = new StoreHub();
const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

function useVerify() {
  const [step, setStep] = useState(VerificationStep.verifying);
  const [larchiveumMessage, setLarchiveumMessage] = useState('');
  const [hubMessage, setHubMessage] = useState('');
  const { verify } = useContext(AuthContext);

  useEffect(
    
    () => {

      async.parallel([
        (cb) => {
          const param = (new URLSearchParams(location.href)).get('auth_topic') || '';
          const token = param.replace('auth:', '');

          UserService.verifyUser(token)
            .then((res)=>{
              Store.setUser(res.data.data);
              cb(null, res);
            })
            .catch((error)=>{
              setLarchiveumMessage("Larchiveum singin error");
              cb(null, null);
            });
        },
        async (cb) => {
          try {
            const qs = new URLSearchParams(location.search);
            const authParams = {
              topic: qs.get("auth_topic"),
              token: qs.get("auth_token"),
              origin: qs.get("auth_origin"),
              payload: qs.get("auth_payload")
            };
            store.removeHub();
            await verify(authParams);
            cb(null, true);
          } catch (error) {
            setHubMessage("Hubs signin error");
            cb(null, true);
          }
        }
      ], (err, [larchiveum, hubs])=>{
        if(larchiveum && hubs){
          setStep(VerificationStep.complete);
        }
        else{
          setStep(VerificationStep.error);
        }
      })
    },
    [verify]
  );

  return { step, larchiveumMessage, hubMessage };
}

export function VerifyModalContainer() {
  const { step, larchiveumMessage, hubMessage } = useVerify();

  let content;

  if (step === VerificationStep.complete) {
    content = <center>
      <br></br><br></br><br></br><br></br>
      <b>Verifying Email Complete</b>
      <div className="d-flex center-flex"><a className="btn btn-backhome" href="/">Back Home</a></div>
    </center>
  }
  else 
  if (step === VerificationStep.error) {
    content = <center>
      <br></br><br></br>
      <b>Verifying Email Error</b>
      <br></br><br></br><br></br><br></br>
      <p>{larchiveumMessage}</p>
      <br></br>
      <p>{hubMessage}</p>
      <div className="d-flex center-flex margin-bottom20px"><a className="btn btn-backhome" href="/">Back Home</a></div>
    </center>
  } else {
    content = <VerifyingEmail/>;
  }

  return (
    <VerifyModal>
      {content}
    </VerifyModal>
  );
}
