import React from "react";
import { IntlProvider } from "react-intl";
import { ThemeProvider } from "@material-ui/core/styles";
import { Provider } from "react-redux";
import mockStore from "./mocks/store.js";
import "../src/styles/globals.scss";
import { adminTheme } from "../src/admin-theme";

// Simple messages for preview
const messages = {
  "ra.page.dashboard": "Dashboard",
  "ra.navigation.page_rows_per_page": "Rows per page:",
  "ra.navigation.page_range_info": "%{offsetBegin}-%{offsetEnd} of %{total}",
  "ra.navigation.no_results": "No results found",
  "ra.action.save": "Save",
  "ra.action.cancel": "Cancel"
};

const AdminLayout = ({ children }) => {
  return (
    <Provider store={mockStore}>
      <IntlProvider locale="en" messages={messages}>
        <ThemeProvider theme={adminTheme}>
          <div className="global_background" style={{ fontFamily: "Inter,Arial", margin: 0, padding: 0 }}>
            <main style={{ minHeight: "100vh" }}>{children}</main>
          </div>
        </ThemeProvider>
      </IntlProvider>
    </Provider>
  );
};

export const decorators = [
  (Story) => (
    <AdminLayout>
      <Story />
    </AdminLayout>
  )
];

export const parameters = {
  react: {
    strictMode: true
  },
  viewport: {
    viewports: {
      desktop: {
        name: "Desktop",
        styles: {
          width: "1200px",
          height: "800px"
        }
      },
      tablet: {
        name: "Tablet",
        styles: {
          width: "768px",
          height: "1024px"
        }
      },
      mobile: {
        name: "Mobile",
        styles: {
          width: "375px",
          height: "667px"
        }
      }
    },
    defaultViewport: "desktop"
  },
  layout: "fullscreen" // Remove default Storybook padding for layout stories
};
