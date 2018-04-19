import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// debugger
ReactDOM.render(<App />, document.getElementById('root'),function(){console.log(this)});
registerServiceWorker();
