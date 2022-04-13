import React, { useState, useContext, useEffect } from "react";
import async from "async";
import { AuthContext } from "./AuthContext";
import { VerifyModal, VerificationError, EmailVerified, VerifyingEmail } from "./VerifyModal";
import UserService from "../../utilities/apiServices/UserService";
import Store from '../../utilities/store';

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
          const email = Store.getUser()?.email;
          UserService.verifyUser(email)
            .then((res)=>{
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
            await verify(authParams);
            cb(null, true);
          } catch (error) {
            setHubMessage("Hubs signin error");
            cb(null, true);
          }
        }
      ], (err, [larchiveum, hubs])=>{
        debugger
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
