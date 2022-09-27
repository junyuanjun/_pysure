// react
import React, { useState } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import TextList from './component/TextList';

// styles
import './SuRE.css'

const SuRE = ( props ) => {
    const [key, setKey] = useState('2');

    return (
        <div className='tab'>
            <Tabs defaultActiveKey={2}
                  transition={false}
                  onSelect={(k) => setKey(k)}>
                <Tab eventKey={1} title="Feature-Aligned Tree">
                    placeholder for feature aligned tree
                </Tab>
                <Tab eventKey={2} title="Text List">
                    <TextList textRules={props.textRules}/>
                </Tab>
                <Tab eventKey={3} title="Hierarchical List">
                    placeholder for hierarchical rule list
                </Tab>
            </Tabs>
        </div>

    );
}

export default SuRE;