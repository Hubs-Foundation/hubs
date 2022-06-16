import { Mailer } from "nodemailer-react";

const mailerConfig = {
  defaults: {
    from: {
      name: "event-manager",
      address: "events@metaverseplus.xyz"
    }
  }
};

const transport = {
  host: "smtp.example.com",
  secure: false,
  auth: {
    user: "rob@robpatterson.net", // generated ethereal user
    pass: "MYaK7XUZz*bF8zEqurjp"
  }
};

const defaults = {
  from: "events@metaverseplus.xyz"
};
export const WelcomeEmail = ({ firstName }) => ({
    subject: `👋 ${firstName}`,
    body: (
      <div>
        <p>Hello {firstName}!</p>
        <p>Hope you'll enjoy the package!</p>
      </div>
    )
  })
  

export const mailer = Mailer(
    { transport, defaults },
    { WelcomeEmail }
  )
mailer.send(
  "WelcomeEmail",
  { firstName: "Mathieu" },
  {
    to: "robpattersonx@gmail.com"
  }
);
