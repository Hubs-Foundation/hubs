import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/stylesheets/globals.scss";
import "../../assets/login/signin.scss";
import "../../assets/login/utils.scss";
import SigninSocial from '../../react-components/signin/SigninSocial';
import UserService from '../../utilities/apiServices/UserService'
import { validateEmail ,validateLength,validateLengthSpace} from '../../utils/commonFunc';
import Store from "../../utilities/store";
import { FaHome } from "react-icons/fa";
registerTelemetry("/signin", "Hubs Sign In Page");

export  function SigninPage() {
    // if(Store.getUser()){
    //     window.location = '/';
    // }
    return (
        <LoginForm />
    );
}

class LoginForm extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            submitted: false,
            error:'',
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name]: value});
    }

    handleSubmit(e) {
        e.preventDefault();
        this.setState({ submitted: true });
        const { email, password } = this.state;
        const data = { email,password };
        if (validateEmail(email) === 'incorrect-email') {
            this.setState({ error : 'Invalid email!' });
            return false;
        }
        else if (validateLengthSpace(password, 4, 64) === 'incorrect') {
            this.setState({ error : 'Password does not contain space and must be between 6 ~ 64 characters' });
            return false;
        }
        else{
            UserService.login(data).then((res) => {
                if(res.result == 'ok'){
                    Store.setUser(res.data);
                    window.location = '/';
                }
                else
                if(res.result == 'fail'){
                    if(res.error == 'unverified'){
                        window.location = '/?page=warning-verify';
                    }
                    else
                    {
                        this.setState({ error : 'Username or Password is incorrect' });
                    }
                }
                
            })
        }
    }

  render(){
      
    const { email, password, submitted,error } = this.state;

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
                        Sign In With
                    </span>
                    <div className="p-t-31 p-b-9">
                        <span className="txt1">
                            Username
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Username is required" >
                        <input className="input100" type="text"  name="email" value={email} onChange={this.handleChange} />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="p-t-13 p-b-9">
                        <span className="txt1">
                            Password
                        </span>
                    </div>
                    <div className="wrap-input100 validate-input" data-validate="Password is required" >
                        <input className="input100" type="password" name="password" value={password} onChange={this.handleChange} />
                        <span className="focus-input100"></span>
                    </div>
                    <div className="container-login100-form-btn m-t-27 m-b-20">
                        <button className="login100-form-btn">
                            Sign In
                        </button>
                    </div>
                    <MesageError/>
                    <div id="alternativeLogin">
                    <label className="txt1">Or sign in with: <a href='/?page=signup' className='btn_signup'>Sign Up?</a></label>
                        <SigninSocial/>
                    </div>
                </form>
            </div>
        </div>
        </div>
    )
  }
}

