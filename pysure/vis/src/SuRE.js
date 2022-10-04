// react
import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextList from './component/TextList/TextList';

// style
import './SuRE.css'
import AlignedTree from "./component/AlignedTree/AlignedTree";
import {bindActionCreators} from "redux";
import * as actions from "./reducer/action";
import {connect} from "react-redux";
import {column_order_by_feat_freq} from "./utils/utils";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const SuRE = ( props ) => {
    const [value, setValue] = React.useState(0);
    const col_order = column_order_by_feat_freq(props.columns, props.rules);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs">
                        <Tab label={<span className='tab-text'>Feature Aligned Tree</span>} {...a11yProps(0)} />
                        <Tab label={<span className='tab-text'>Text List</span>} {...a11yProps(1)}/>
                        <Tab label={<span className='tab-text'>Hierarchical List</span>} {...a11yProps(2)} />
                    </Tabs>
                </Box>
                <TabPanel value={value} index={0}>
                    <AlignedTree attrs={props.columns} lattice={props.lattice}
                                 filter_threshold={props.filter_threshold}
                                 rules = {props.rules}
                                 col_order={col_order}
                                 real_min = {props.real_min}
                                 real_max = {props.real_max}
                                 node_info = {props.node_info}
                                 tot_size = {props.y_gt.length}
                                 target_names = {props.target_names}
                    />
                </TabPanel>
                <TabPanel value={value} index={1}>
                    <TextList textRules={props.text_rules}/>
                </TabPanel>
                <TabPanel value={value} index={2}>
                    Place Holder for Hierarchical List
                </TabPanel>
            </Box>

        </div>
    );
}

export default SuRE;