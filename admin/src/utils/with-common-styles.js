import { green, amber } from "@material-ui/core/colors";

const getCommon = theme => ({
  container: {
    ...theme.mixins.gutters(),
    ...theme.typography,
    display: "flex",
    flexWrap: "wrap",
    padding: "36px",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    margin: "12px"
  },
  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start"
  },

  warningIcon: {
    color: amber[700]
  },

  button: {
    margin: "10px 10px 0 0"
  },
  success: {
    backgroundColor: green[600]
  },
  warning: {
    backgroundColor: amber[700]
  },
  icon: {
    fontSize: 20
  },
  message: {
    display: "flex",
    alignItems: "center"
  },
  snackContents: {
    "& a": {
      color: "white"
    }
  }
});

export default function withCommonStyles(f) {
  return theme => {
    const computed = f(theme);
    const common = getCommon(theme);
    return { ...computed, ...common };
  };
}
