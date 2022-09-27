import React from 'react';
import ReactDOM from 'react-dom';
import { select } from 'd3-selection'
import './index.css';
import SuRE from './SuRE';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <SuRE />
//   </React.StrictMode>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();


export function renderSuRE(divName, data){

  ReactDOM.render( 
    <SuRE
        textRules={data.textRules}
    />,
    select(divName).node() );

}