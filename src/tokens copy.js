import React from "react";
import ReactDOM from "react-dom";

// eslint-disable-line no-unused-vars
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { Header } from "./react-components/layout/Header";
import { Footer } from "./react-components/layout/Footer";
import Store from "./storage/store";
import "./utils/theme";
// import "./tokens.css";
import "./react-components/home/HomePage.css";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { Form, Field } from "easy-react-form";
import "./assets/stylesheets/globals.scss";
import "./react-components/styles/global.scss";
// import { TokenPageLayout } from "./react-components/tokens/TokenPageLayout";
import { Container } from "./react-components/layout/Container";
import { ThemeProvider } from "./react-components/styles/theme";
import { Button } from "./react-components/input/Button";

// registerTelemetry("/tokens", "Backend API Tokens Page");
//
const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <AuthContextProvider store={store}>
          <Header />

          <Container>
            <h1> Create Event</h1>
            <br />
            <br />
            <br />
            <br />
          </Container>
          <Container>
            <Form onSubmit={values => console.log(values)}>
              <h2> Room Name</h2>
              <Field name="roomName" component="input" type="text" placeholder="Room Name" />
              <br />
              <br />
              <br />
              <h2> Invitee Email</h2>
              <Field name="email" component="input" type="email" placeholder="Invitee email" />
              <br />
              <br />
              <br />
              <h2> Date </h2>
              <Field name="date" component="input" type="date" placeholder="Date" />
              <br />
              <br />
              <br />
              <h2> Time </h2>
              <Field name="time" component="input" type="time" placeholder="Time" />
              <br />
              <br />
              <br />
              <Button type="submit">Create</Button>
            </Form>
          </Container>
        </AuthContextProvider>
      </ThemeProvider>
      <Footer />

    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
