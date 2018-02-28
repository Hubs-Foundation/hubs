import ReactDOM from "react-dom";
import React from "react";
import { HashRouter as Router, Route, Link } from "react-router-dom";
import styles from "./onboarding.css";

const Onboarding = () => (
  <Router basename="">
    <div className={styles.onboarding}>
      <Link to="/">Start Over</Link>

      <hr />

      <Route exact path="/" component={Landing} />
      <Route path="/step1" component={Step1} />
      <Route path="/step2" component={Step2} />
      <Route path="/step3" component={Step3} />
    </div>
  </Router>
);

const Landing = () => (
  <div>
    <h2>Landing</h2>
    <Link to="/step1">Get Started</Link>
  </div>
);

const Step1 = () => (
  <div>
    <h2>Step 1</h2>
    <Link to="/step2">Next</Link>
  </div>
);

const Step2 = () => (
  <div>
    <h2>Step 2</h2>
    <Link to="/step1">Back</Link>
    <Link to="/step3">Next</Link>
  </div>
);

const Step3 = () => (
  <div>
    <h2>Step 3</h2>
    <Link to="/step2">Back</Link>
    <a href="/room.html?room=1">Create Room</a>
  </div>
);

ReactDOM.render(<Onboarding />, document.getElementById("root"));
