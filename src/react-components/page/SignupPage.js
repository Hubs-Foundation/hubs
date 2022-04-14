import React from "react";
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
registerTelemetry("/signup", "Hubs Sign Up Page");

export  function SignupPage() {
    if(Store.getUser()){
        window.location = '/';
    }
    return (
        <SignUpForm />
    );
}

class SignUpForm extends React.Component{
    constructor(props) {
      super(props);
      this.state = {
        displayName: '',
        email: '',
        password: '',
        submitted: false
      };

      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
      const { name, value } = e.target;
      this.setState({ [name]: value });
  }

    handleSubmit(e) {
        e.preventDefault();
        this.setState({ submitted: true });
        const { displayName,email,password,repassword } = this.state;
        const data = { displayName,email,password };

        if (validateLength(displayName, 4, 50) === "incorrect") {
            this.setState({ error : 'Display name must be between 4 ~ 50 characters' });
            return false;
        }
        else if (validateEmail(email) === 'incorrect-email') {
            this.setState({ error : 'Invalid email!' });
            return false;
        }
        else if (validateLengthSpace(password, 4, 64) === 'incorrect') {
            this.setState({ error : 'Password does not contain space and must be between 6 ~ 64 characters' });
            return false;
        }
        else if (password != repassword) {
            this.setState({ error : 'Re-entered password does not match' });
            return false;
        }
        else{
            UserService.signupWithEmail(data).then((res) => {
                if(res.result == 'ok'){
                    window.location = '/?page=warning-verify';
                }
                else
                if(res.result == 'fail'){// && result.error == 'duplicated_email'
                    if(res.error == 'duplicated_email'){
                        this.setState({ error : 'Your email already exists in the system' });
                    }
                }
            })
        }
    }

  render(){
    const { displayName,email, password,repassword, submitted ,error} = this.state;
    const MesageError=()=> {  
        if(error){
          return(
            <div className="error-form">{error}</div>
          ) 
        }
        else{
          return(
            <></>
          ) 
        }
    }
    return(
      <div className="limiter">
        <div className="container-login100">
            <div className="wrap-login100 p-l-80 p-r-80 p-t-62 p-b-62">
                <div className="gohome">
                    <a href="./"><FaHome size={30}/></a>
                </div>
                <form className="login100-form validate-form flex-sb flex-w" name="form" onSubmit={this.handleSubmit}>
                    <span className="login100-form-title">
                        Sign Up
                    </span>
                    <div className="p-t-13 p-b-9">
                        <span className="txt1">
                        Display Name
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Username is required">
                        <input className="input100" type="text" name="displayName" value={displayName} onChange={this.handleChange} />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="p-t-13 p-b-9">
                        <span className="txt1">
                            Email
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Email is required">
                        <input className="input100" type="email" name="email" value={email} onChange={this.handleChange}  />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="p-t-13 p-b-9">
                        <span className="txt1">
                            Password
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Password is required">
                        <input className="input100" type="password" name="password" value={password} onChange={this.handleChange} />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="p-t-13 p-b-9">
                        <span className="txt1">
                            Re Password
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Re Password is required">
                        <input className="input100" type="password" name="repassword" value={repassword} onChange={this.handleChange} />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="container-login100-form-btn m-t-27 m-b-30">
                        <button className="login100-form-btn">
                            Sign Up
                        </button>
                    </div>
                    <MesageError/>
                    <div id="alternativeLogin">
                        <label className="txt1">Or sign in with: <a href='/?page=signin' className='btn_signup'>Sign In?</a></label>
                        <SigninSocial/>
                    </div>
                </form>
            </div>
        </div>
    </div>
    )
  }
}
