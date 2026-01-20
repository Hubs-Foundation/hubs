import React from "react";
import { Layout, Resource } from "react-admin";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import { AdminMenu } from "../src/react-components/admin-menu";
import { HiddenAppBar, AdminSidebar } from "../src/react-components/admin-chrome";

export default {
  title: "Admin/Layout",
  parameters: {
    layout: "fullscreen",
  },
};


// Sample content component
const SampleContent = () => (
  <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
    <h1 style={{ margin: "0 0 20px 0", color: "#333" }}>Hubs Admin Panel</h1>
    <p style={{ color: "#666", lineHeight: "1.6" }}>
      This is the default admin layout with React Admin v3.19.12 and ResponsiveAppBar integration.
      On mobile devices, you'll see a hamburger menu in the top bar to toggle the sidebar.
    </p>
    
    <div style={{ 
      backgroundColor: "white", 
      padding: "20px", 
      borderRadius: "4px", 
      marginTop: "20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ margin: "0 0 15px 0", color: "#1700c7" }}>Admin Features</h2>
      <ul style={{ color: "#666", lineHeight: "1.8" }}>
        <li>Scene management</li>
        <li>Avatar management</li>
        <li>User accounts</li>
        <li>Server configuration</li>
      </ul>
    </div>
  </div>
);

// Default layout story
export const DefaultLayout = {
  render: () => {
    const history = createMemoryHistory();
    
    const customLayout = props => (
      <Layout
        {...props}
        title="Hubs Admin"
        className="global_background"
        appBar={HiddenAppBar}
        menu={props => <AdminMenu {...props} services={[]} />}
        sidebar={AdminSidebar}
      />
    );

    return (
      <Router history={history}>
        <div style={{ height: "100vh", margin: 0, padding: 0 }}>
          {React.createElement(customLayout, {
            children: <SampleContent />
          })}
        </div>
      </Router>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Default Hubs Admin Panel layout using React Admin v3.19.12 with ResponsiveAppBar. The AppBar (with hamburger menu) is hidden on desktop but visible on mobile for sidebar toggling.'
      }
    }
  }
};

// Mobile responsive story
export const MobileResponsive = {
  render: () => {
    const history = createMemoryHistory();
    
    const customLayout = props => (
      <Layout
        {...props}
        title="Hubs Admin"
        className="global_background"
        appBar={HiddenAppBar}
        menu={props => <AdminMenu {...props} services={[]} />}
        sidebar={AdminSidebar}
      />
    );

    return (
      <Router history={history}>
        <div style={{ 
          height: "600px", 
          width: "375px", 
          margin: "0 auto",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          {React.createElement(customLayout, {
            children: (
              <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100%" }}>
                <h1 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>Mobile View</h1>
                <p style={{ color: "#666", lineHeight: "1.6", fontSize: "14px" }}>
                  This demonstrates the mobile responsive AppBar with hamburger menu. 
                  Click the hamburger (☰) icon in the top bar to toggle the sidebar.
                </p>
                
                <div style={{ 
                  backgroundColor: "white", 
                  padding: "15px", 
                  borderRadius: "4px", 
                  marginTop: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  fontSize: "14px"
                }}>
                  <h2 style={{ margin: "0 0 10px 0", color: "#1700c7", fontSize: "16px" }}>Mobile Features</h2>
                  <ul style={{ color: "#666", lineHeight: "1.6", paddingLeft: "20px" }}>
                    <li>Hamburger menu toggle</li>
                    <li>Collapsible sidebar</li>
                    <li>Touch-friendly interface</li>
                    <li>Responsive navigation</li>
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </Router>
    );
  },

  parameters: {
    docs: {
      description: {
        story: 'Mobile responsive view showing the AppBar with hamburger menu functionality. The sidebar can be toggled by clicking the hamburger icon.'
      }
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '600px',
          },
        },
      }
    },
  },

  globals: {
    viewport: {
      value: "mobile",
      isRotated: false
    }
  }
};

