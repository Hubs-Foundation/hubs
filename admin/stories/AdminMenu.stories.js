import React from "react";
import { AdminMenu } from "../src/react-components/admin-menu";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

export default {
  title: "Admin/Components/AdminMenu",
  component: AdminMenu,
  parameters: {
    layout: "padded",
  },
};

// Simple AdminMenu story without full layout complexity
export const DefaultMenu = {
  render: () => {
    const history = createMemoryHistory();
    return (
      <Router history={history}>
        <div style={{ width: "300px", height: "600px", backgroundColor: "#222222" }}>
          <AdminMenu services={["reticulum", "spoke", "hubs"]} />
        </div>
      </Router>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the AdminMenu component in isolation with mock services.'
      }
    }
  }
};

// Menu with no services (minimal case)
export const EmptyMenu = {
  render: () => {
    const history = createMemoryHistory();
    return (
      <Router history={history}>
        <div style={{ width: "300px", height: "600px", backgroundColor: "#222222" }}>
          <AdminMenu services={[]} />
        </div>
      </Router>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the AdminMenu component with no services configured.'
      }
    }
  }
};