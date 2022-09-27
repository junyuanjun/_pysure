// react
import React, { useState } from 'react';

// styles
import './TextList.css'
import SuRE from "../SuRE";

const TextList = ( {textRules} ) => {
    return <div>
        {textRules.map((r,i) => <p>R{i+1}. {r}</p>)}
    </div>
}

export default TextList;