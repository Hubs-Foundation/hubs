import { createTheme } from "@material-ui/core/styles";
import { defaultTheme } from "react-admin";

export const adminTheme = createTheme({
  ...defaultTheme,
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#222222",
          minHeight: "100vh"
        }
      }
    }
  },
  palette: {
    primary: {
      main: "#1700c7"
    },
    secondary: {
      main: "#000000"
    }
  },
  typography: {
    fontFamily: "Inter,Arial"
  }
});
