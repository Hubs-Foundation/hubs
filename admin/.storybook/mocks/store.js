import { createStore, combineReducers } from 'redux';

// Create mock resources that getResources selector expects (keep minimal realistic set)
const mockResourcesData = {
  scenes: {
    name: 'scenes',
    hasList: true,
    hasShow: true,
    hasCreate: true,
    hasEdit: true,
    options: { label: 'Scenes' }
  },
  avatars: {
    name: 'avatars', 
    hasList: true,
    hasShow: true,
    hasCreate: true,
    hasEdit: true,
    options: { label: 'Avatars' }
  },
  accounts: {
    name: 'accounts',
    hasList: true,
    hasShow: true,
    hasCreate: false,
    hasEdit: true,
    options: { label: 'Accounts' }
  }
};

// Mock reducers for react-admin
const mockReducers = {
  // React Admin core reducers - getResources expects admin.resources as an object where values contain props
  admin: (state = {
    ui: {
      sidebarOpen: true,
      viewVersion: 0
    },
    resources: {
      scenes: {
        props: mockResourcesData.scenes
      },
      avatars: {
        props: mockResourcesData.avatars
      },
      accounts: {
        props: mockResourcesData.accounts
      }
    },
    customQueries: {},
    loading: 0,
    notifications: []
  }) => state,
  
  // Router state
  router: (state = { 
    location: { pathname: '/', search: '', hash: '' } 
  }) => state,
  
  // Form state (if needed)
  form: (state = {}) => state,
  
  // i18n state
  i18n: (state = {
    locale: 'en',
    messages: {}
  }) => state
};

// Create mock store
const mockStore = createStore(
  combineReducers(mockReducers),
  // Initial state
  {},
  // DevTools extension if available
  typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ 
    ? window.__REDUX_DEVTOOLS_EXTENSION__()
    : f => f
);

export default mockStore;
