import React from 'react';
import { createRoot } from 'react-dom/client';
import CaffeineHealthApp from './CaffeineHealthApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CaffeineHealthApp />
  </React.StrictMode>
);
