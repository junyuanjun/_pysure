// style
import './SuRE.css'

// react
import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextList from './component/TextList/TextList';
import AlignedTree from "./component/AlignedTree/AlignedTree";
import {bindActionCreators} from "redux";
import * as actions from "./reducer/action";
import {connect} from "react-redux";
import {column_order_by_feat_freq} from "./utils/utils";
import RuleEditor from "./component/RuleEditor/RuleEditor";
import HierarchicalList from "./component/HierarchicalList/HierarchicalList";
import {colorCate} from "./utils/const";
import {renderD3} from "./hooks/render.hook";

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
    const canvas = document.getElementsByClassName('canvas4text'),
        ctx = canvas[0].getContext('2d');
    ctx.font = '14px sans-serif';

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const clear_plot = (svgref) => {
        svgref.selectAll('*').remove();
    }

    const render_legend = (headerGroup) => {
        props.target_names.forEach((d, i) => {
            // create new false patterns
            let pattern = headerGroup.append("pattern")
                .attr("id", `false-class-${i}`)
                .attr("class", 'false_class')
                .attr("patternUnits", "userSpaceOnUse")
                .attr("width", "4")
                .attr("height", "4");

            pattern.append('rect')
                .attr('width', 4)
                .attr('height', 4)
                .attr('fill', colorCate[i]);

            pattern.append('path')
                .attr('d', "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2");

            // add pattern id to conf_fill
            // conf_fill.push(`url(#false-class-${i})`);
            // conf_fill.push(colorCate[i]);
        })
    }

    const ref = renderD3(
        (svgref) => {

            // clearing
            clear_plot(svgref);

            const headerGroup = svgref
                .append("g");

            render_legend(headerGroup);
        })

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
                    <HierarchicalList ctx={ctx}
                        attrs={props.columns} lattice={props.lattice}
                        filter_threshold={props.filter_threshold}
                        rules = {props.rules}
                        col_order={col_order}
                        tot_size = {props.y_gt.length}
                        preIndex = {props.preIndex}
                        target_names = {props.target_names}
                    />
                </TabPanel>
            </Box>
            <svg ref={ref} width={0} height={0}></svg>
            <RuleEditor />
        </div>
    );
}

export default SuRE;