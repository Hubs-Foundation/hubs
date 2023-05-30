import React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

export const UnauthorizedPage = () => (
  <div
    style={{
      marginLeft: "auto",
      marginRight: "auto",
      padding: "20px",
      maxWidth: "700px"
    }}
  >
    <Card>
      <CardContent
        style={{
          padding: "40px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {/* eslint-disable-next-line @calm/react-intl/missing-formatted-message */}
        <Typography variant="title">Sorry! Your account is not an admin.</Typography>
        {/* eslint-disable-next-line @calm/react-intl/missing-formatted-message */}
        <Button variant="contained" style={{ marginTop: "40px" }} color="secondary" href="/">
          Return Home
        </Button>
      </CardContent>
    </Card>
  </div>
);
