import React, { useState, useEffect } from 'react';
import { IonApp, IonLoading } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './components/Login';
import Home from './pages/Home';
import { isAuthenticated } from './services/authService';
import '@ionic/react/css/ionic.bundle.css';
import './theme/variables.css';

const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuthenticatedUser(auth);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  if (!authChecked) {
    return (
      <IonApp>
        <IonLoading isOpen={true} message="인증 확인 중..." />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        {isAuthenticatedUser ? <Home /> : <Login onLoginSuccess={() => setIsAuthenticatedUser(true)} />}
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
