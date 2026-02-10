import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Grade8StudyHub from './Grade8_StudyHub_Complete';
import { Logger } from './services/Logger';
import './App.css';

function App() {
  useEffect(() => {
    Logger.info('Application Mounted');
    Logger.info('Environment: ' + (process.env.NODE_ENV || 'development'));
  }, []);

  return (
    <div className="App">
      <BrowserRouter basename="/Harshi-App">
        <Grade8StudyHub />
      </BrowserRouter>
    </div>
  );
}

export default App;
