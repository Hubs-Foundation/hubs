import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import Store from "../../utilities/store";
registerTelemetry("/signin", "Hubs Sign In Page");

export  function WarningVerifyPage() {
    if(Store.getUser()){
        window.location = '/';
    }
    else{
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
                </b>
                
            </div>
          </div>
        )
    }
}
