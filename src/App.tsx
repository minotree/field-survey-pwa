import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route, Routes } from 'react-router-dom';
import SurveyPage from './pages/SurveyPage';
import Login from './components/Login';
import { isAuthenticated } from './services/authService';

const App: React.FC = () => {
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuthenticatedUser(auth);
    };

    checkAuth();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <IonRouterOutlet id="main">
            <Routes>
              {isAuthenticatedUser ? (
                <>
                  <Route path="/survey" element={<SurveyPage />} />
                  <Route path="/" element={<Navigate to="/survey" />} />
                </>
              ) : (
                <>
                  <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticatedUser(true)} />} />
                  <Route path="/" element={<Navigate to="/login" />} />
                </>
              )}
            </Routes>
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
