import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, Switch } from 'react-router-dom';
import Menu from './components/Menu';
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
          <Menu />
          <IonRouterOutlet id="main">
            {isAuthenticatedUser ? (
              <>
                <Route path="/survey" component={SurveyPage} exact />
                <Redirect from="/" to="/survey" />
              </>
            ) : (
              <>
                <Route path="/login" component={Login} exact />
                <Redirect from="/" to="/login" />
              </>
            )}
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
