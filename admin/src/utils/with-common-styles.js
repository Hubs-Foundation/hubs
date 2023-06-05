import { blue, green, amber } from "@material-ui/core/colors";

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
    width: "100%"
  },

  infoIcon: {
    color: blue[200]
  },

  warningIcon: {
    color: amber[700]
  },

  successIcon: {
    color: green[700]
  },

  button: {
    margin: "10px 10px 0 0",
    width: "max-content"
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
  },
  command: {
    fontFamily: "monospace",
    padding: "12px",
    margin: "12px",
    borderRadius: "4px",
    backgroundColor: "whitesmoke"
  },
  steps: {
    "& li": {
      margin: "6px 0px"
    }
  },
  section: {
    "&:not(:first-child)": {
      marginTop: "12px"
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
