import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './utils/LanguageContext'
import { ConfigProvider } from 'antd'
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

const antdTheme = {
  token: {
    colorPrimary: '#ea4c89', // Heo Hồng primary pink
    colorInfo: '#ea4c89',
    colorSuccess: '#5bb849', // 365scores success green
    colorWarning: '#ffb800',
    colorError: '#ff495c',
    borderRadius: 6, // Sharper corners for standard components
    wireframe: false,
    fontFamily: '"365 Sans", -apple-system, sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 8, // Standard card border radius
      paddingLG: 16,
    },
    Button: {
      borderRadius: 6,
      fontWeight: 600,
      controlHeight: 36,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Tabs: {
      titleFontSize: 14,
      fontWeightStrong: 700,
    }
  }
}

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <LanguageProvider>
        <BrowserRouter>
          <GoogleOAuthProvider clientId={clientId}>
            <App />
          </GoogleOAuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ConfigProvider>
  </StrictMode>,
)
