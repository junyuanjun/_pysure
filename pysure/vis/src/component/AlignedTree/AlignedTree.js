// react
import React, { useState } from 'react';

// styles
import './AlignedTree.css'

// hooks
import { renderD3 } from '../../hooks/render.hook';

// const
import { MAXINT, colorCate, conf_fill } from "../../utils/const";
import { readable_text } from "../../utils/utils";

// third-party
import * as d3 from 'd3';


const AlignedTree = ( props ) => {
    const {attrs, lattice, filter_threshold, col_order, rules,
        real_min, real_max, tot_size, target_names,
        } = props;

    const unit_width =25, unit_height = 20,
        margin_h = 10, margin_v = 80,
        font_size = 14,
        max_r = 15,
        glyphCellHeight = 10,
        legend_height = 20,
        sqWidth = glyphCellHeight,
        feat_name_height = 80;

    const apply_lattice_scale = true;

    const clear_plot = (svgref) => {
        svgref.selectAll('*').remove();
    }

    const render_legend = (headerGroup) => {

    }

    const construct_lattice = () => {
        // initialize
        let pos2r = {}, r2pos = {}, r2lattice={}, lattice2r={};
        for (let i = 0; i<attrs.length; i++) {
            pos2r[i] = {};
            for (let j=0; j<filter_threshold['num_feat']; j++) {
                pos2r[i][j] = [];
            }
        }
        // set position
        rules.forEach((conds, rid) => {
            let rule = conds['rules'].slice();
            // rule = rule.sort((a, b) => col_order[a['feature']] - col_order[b['feature']]);
            r2lattice[rid] = {};
            let parent = 0;
            rule.forEach((cond, cid) => {
                let lattice_node_id = find_lattice_node(parent, cond);
                r2lattice[rid][cid] = lattice_node_id;
                lattice2r[lattice_node_id] = [rid, cid]
                parent = lattice_node_id;
                if (!pos2r[col_order[cond['feature']]][cid].includes(lattice_node_id )) {
                    pos2r[col_order[cond['feature']]][cid].push(lattice_node_id);
                }
            });
        });

        // predicate ordering in each layer
        for (let ii = 0; ii < attrs.length; ii++) {
            let i = col_order[ii];
            for (let j = 0; j < Object.keys(pos2r[i]).length; j++) {
                let lat_node_order = generate_node_order_by_feature(ii, j, pos2r, true),
                    original_pos2r = pos2r[i][j].slice();

                for (let k = 0; k <  pos2r[i][j].length; k++) {
                    r2pos[original_pos2r[k]] = lat_node_order[k];
                    pos2r[i][j][lat_node_order[k]] = original_pos2r[k];
                }
            }
        }

        // width setting
        let max_num = 0;
        for (let j = 0; j<filter_threshold['num_feat']; j++) {
            let layer_w = 0;
            for (let i = 0; i<attrs.length; i++) {
                layer_w += pos2r[col_order[i]][j].length;
            }
            if (layer_w>max_num)
                max_num = layer_w;
        }
        let feat_max_num = {};
        for (let i = 0; i<attrs.length; i++) {
            feat_max_num[col_order[i]] = -1;
            for (let j = 0; j<filter_threshold['num_feat'];j++) {
                if (pos2r[col_order[i]][j].length > feat_max_num[col_order[i]])
                    feat_max_num[col_order[i]] = pos2r[col_order[i]][j].length;
            }
        }
        let feat_start_pos = [];
        let pre_sum = 0;
        for (let i = 0; i<=attrs.length; i++) {
            feat_start_pos.push(pre_sum * (unit_width+margin_h));
            pre_sum += feat_max_num[i];
        }
        return [feat_max_num, feat_start_pos, r2pos, lattice2r];
    }

    const find_lattice_node = (parent, condition) => {
        let node_id = -1;
        lattice[parent]['children_id'].forEach((idx) => {
            let node = lattice[idx];
            if (condition['feature']==node['feature'] && condition['sign']==node['sign']) {
                if (condition['sign'] == 'range') {
                    if (condition['threshold0']==node['threshold0'] && condition['threshold1']==node['threshold1']){
                        node_id = node['node_id'];
                        return null;
                    }
                } else if (condition['threshold']==node['threshold']){
                    node_id = node['node_id'];
                    return null;
                }
            }
        })
        return node_id;
    }

    const generate_node_order_by_feature = (feat_idx, cid, pos2r, ascending) => {
        let node_info = [], node_order = {}, th0, th1;

        for (let k = 0; k < pos2r[col_order[feat_idx]][cid].length; k++) {
            let node = lattice[pos2r[col_order[feat_idx]][cid][k]]
            if (ascending) {
                th0 = MAXINT;
                th1 = MAXINT;
            } else {
                th0 = -MAXINT;
                th1 = -MAXINT;
            }
            if (node['sign'] == 'range') {
                th0 = node['threshold0'];
                th1 = node['threshold1'];
            } else if (node['sign'] == '<=') {
                th1 = node['threshold'];
                th0 = real_min[feat_idx];
            } else if (node['sign'] == '>') {
                th0 = node['threshold'];
                th1 = real_max[feat_idx];
            }
            node_info.push({
                'idx': k,
                'th0': th0,
                'th1': th1,
            })
        }

        node_info.sort((a, b) => {
            if (a.th0 !== b.th0)
                return ascending ? a.th0 - b.th0 : b.th0 - a.th0;
            else if (a.th1 !== b.th1)
                return ascending ? a.th1 - b.th1 : b.th1 - a.th1;
            // else
            //   return pre_order[a.node_id].order - pre_order[b.node_id].order;
        });
        node_info.forEach((d, i) => node_order[d.idx] = i);

        return node_order;
    }

    const render_feature_aligned_tree = (lattice_chart, chartGroup, yScale, summary_size_, rectXst) => {
        const [feat_max_num, feat_start_pos, r2pos, lattice2r] = construct_lattice();

        // render feature names
        let column = chartGroup.append('g')
            .attr('class', 'attr_name')
            .selectAll(".column").data(attrs)
            .enter().append("g")
            .attr("class", `column`)
            .attr('id', (d,i)=>`col-${i}`)
            .attr("transform", function(d, i) {
                return `translate(${feat_start_pos[col_order[i]]+10}, 
            ${feat_name_height+yScale(0)-font_size})rotate(330)`; });

        let col_count = 0;
        column.append("text")
            .attr("y", yScale.bandwidth() / 1.5 - 5)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text((d,i) => {
                if (feat_max_num[col_order[i]]<=0) return "";
                col_count+=feat_max_num[col_order[i]];
                let text = d;
                if (d.length > 10) {
                    text = text.slice(0, 10)+'...';
                }
                return text;
            })
            .append('title')
            .text(d => d);

        lattice_chart.attr('width', col_count * (unit_width+margin_h)+feat_name_height*1.41)
            .attr('height', (filter_threshold['num_feat']+1.5) * (unit_height+margin_v))

        // render divider line
        let view = chartGroup.append('g')
            .attr('class', 'lattice_graph')
            .attr('transform', `translate(10, ${feat_name_height})`)

        let divider = view.append('g')
            .attr('class', 'divider'),
            to_sep = [];
        attrs.forEach((d,i) => {
            if (feat_max_num[col_order[i]]>0) {
                to_sep.push(i);
            }
        })
        divider.selectAll('feat_divider')
            .data(to_sep)
            .enter()
            .append('line')
            .attr('class', 'feat_divider')
            .attr('x1', (idx) => feat_start_pos[col_order[idx]+1] - margin_h/2)
            .attr('x2', (idx) => feat_start_pos[col_order[idx]+1] - margin_h/2)
            .attr('y1', 0)
            .attr('y2', (filter_threshold['num_feat']+1.5) * (unit_height+margin_v))
            .style("stroke-dasharray", ("3, 3"))
            .style('stroke', 'darkgrey')

        // render links
        let links = [];
        for (let i = 1; i < Object.keys(lattice).length; i++) {
            if (lattice[i]['children_id'].length > 0) {
                for (let j = 0; j < lattice[i]['children_id'].length; j++){
                    links.push({
                        'source': i,
                        'target': lattice[i]['children_id'][j]
                    })
                }
            }
        }
        let lattice_links = view.append('g')
            .attr('class', '.lattice_links')

        let link_lines = lattice_links.selectAll('.lattice_link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'lattice_link')
            .attr('id', d => `lattice-link-${d['source']}-${d['target']}`)
            .attr('x1', d=>{
                let col = lattice[d['source']]['feature']
                return feat_start_pos[col_order[col]] + (unit_width+margin_h)*r2pos[d['source']]+ unit_width/2;
            })
            .attr('x2', d=>{
                let col = lattice[d['target']]['feature']
                return feat_start_pos[col_order[col]] + (unit_width+margin_h)*r2pos[d['target']]+ unit_width/2;
            })
            .attr('y1', d=>lattice[d['source']]['depth']*(unit_height+margin_v)+ unit_height/2)
            .attr('y2', d=>lattice[d['target']]['depth']*(unit_height+margin_v)+ unit_height/2)
            .attr('stroke', 'darkgrey')

        // render nodes
        let conf_mat_nodes = view.selectAll(".lattice_node")
            .data(d3.range(1, Object.keys(lattice).length).map(function(k) {
                return lattice[k];
            }))
            .enter().append("g")
            .attr('class', 'lattice_node')
            .attr('id', (d) => `latnode-${d['node_id']}`)
            .attr('transform', (d) => {
                // let node_id = r2lattice[d['rid']][cid];
                let node_id = d['node_id'];

                let x_offset = feat_start_pos[col_order[d['feature']]] + (unit_width+margin_h)*r2pos[node_id] + unit_width/2,
                    y_offset = d['depth'] * (unit_height+margin_v) + unit_height/2;
                return `translate(${x_offset}, ${y_offset})`
            })

        conf_mat_nodes.selectAll('.lattice_conf_mat')
            .data((d) => {
                // let cid=d['cid'],
                // node_id = r2lattice[d['rid']][cid];
                let node_id = d['node_id'];

                let size = summary_size_.range()[1],
                    support = lattice[node_id]['support'] > 1 ?
                        lattice[node_id]['support'] / tot_size : lattice[node_id]['support'],
                    scale = apply_lattice_scale ?  summary_size_(support)/ size : .9,
                    tot = lattice[node_id]['support'],
                    conf_mat = [],
                    x_offset = -size/2;

                for (let i = 0; i < lattice[node_id]['conf_mat'].length; i++) {
                    let v = d3.sum(lattice[node_id]['conf_mat'][i]);
                    conf_mat.push({
                        'id': node_id,
                        'scale': scale,
                        'x': x_offset,
                        'width': size * v / tot,
                        'y': -size/2,
                        'height': v > 0 ? size * lattice[node_id]['conf_mat'][i][1]/v : 0,
                    });

                    conf_mat.push({
                        'id': node_id,
                        'scale': scale,
                        'x': x_offset,
                        'width': size * v / tot,
                        'y': v > 0 ? -size/2 + size*lattice[node_id]['conf_mat'][i][1]/v : 0,
                        'height': v > 0 ? size * lattice[node_id]['conf_mat'][i][0]/v : 0,
                    });

                    x_offset += size*v/tot;
                }

                return conf_mat;
            }).enter()
            .append('g')
            .attr('class', 'lattice_conf_mat')
            .attr('transform', d => `scale(${d.scale})`)
            .append('rect')
            .attr('x', d => d.x)
            .attr('y', d=>d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('fill', (d, i) => conf_fill[i]);

        // condition metaphor
        conf_mat_nodes.selectAll(".rule-fill")
            .data(function(d) {
                let node_id = d['node_id']
                let feat = d['feature'],
                    // size = summary_size_(lattice[r2lattice[d['rid']][d['cid']]]['support'])/2,
                    support = lattice[node_id]['support'] > 1 ?
                        lattice[node_id]['support'] / tot_size : lattice[node_id]['support'],
                    size = apply_lattice_scale ? summary_size_(support)/2 : summary_size_.range()[1]/2,
                    to_render = [];

                let cond = rules[lattice2r[node_id][0]]['rules'][lattice2r[node_id][1]];
                d3.range(filter_threshold['num_bin']).forEach(pdc => {
                    to_render.push({'feature': feat,
                        'value': pdc,
                        'show': cond['range'].indexOf(pdc)>=0,
                        'x_offset': - sqWidth * filter_threshold['num_bin'] / 4,
                        'y_offset': size+2,
                    })
                })

                return to_render;
            })
            .enter().append("rect")
            .attr("x", function(d) {
                return rectXst[d['value']]/2 + d.x_offset;
            })
            .attr("width", sqWidth/2)
            .attr("y", d=>d.y_offset )
            .attr("height", glyphCellHeight/2)
            .attr("fill", d => d['show'] ? "#484848": 'white')
            .attr("stroke", "black");

        // node clickevent
        conf_mat_nodes
            .append('rect')
            .attr('class', 'node_mask')
            .attr('id', (d, node_id) =>`nodemask-${d['node_id']}`)
            .attr('x', d => {
                return apply_lattice_scale ? -summary_size_(d.support/tot_size)/2: -summary_size_.range()[1]/2
            })
            .attr('y', d => apply_lattice_scale ? -summary_size_(d.support/tot_size)/2: -summary_size_.range()[1]/2)
            .attr('width', d => apply_lattice_scale ? summary_size_(d.support/tot_size): summary_size_.range()[1])
            .attr('height', d => apply_lattice_scale ? summary_size_(d.support/tot_size): summary_size_.range()[1])
            .on('click', (d) => {
                // node_click(lattice2r[d['node_id']][0], lattice2r[d['node_id']][1]);
            })
            // .on('mouseover', d=>{
            //     node_hover(d['node_id']);
            // })
            // .on('mouseout', d=>{
            //     node_unhover(d['node_id']);
            // })

        conf_mat_nodes.append('text')
            .attr('class', 'lattice_cond')
            .attr('y', d=> apply_lattice_scale ? summary_size_(d.support/tot_size)/2 + sqWidth/2 + 15
                    : summary_size_.range()[1]/2 + sqWidth/2 + 15)
            .text(d => {
                if (d['sign']=='range') {
                    let str = `[${readable_text(d['threshold0'])}, ${readable_text(d['threshold1'])}`;
                    if (d['threshold1'] == real_max[d["feature"]]) {
                        str += ']';
                    } else {
                        str += ')';
                    }
                    return str;
                } else {
                    let sign = d['sign'][0];
                    if (sign == '>') {
                        sign = '>='
                    }
                    return `${sign}${readable_text(d['threshold'])}`;
                }
            })
    }

    const ref = renderD3(
        (svgref) => {

            // clearing
            clear_plot(svgref);

            // constants
            const margin = {
                top: 5,
                left: 20,
                right: 20,
                bottom: 20
            };

            const headerGroup = svgref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            const chartGroup = svgref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top+legend_height})`);

            // svg size
            const svgWidthRange = [0, svgref.node().getBoundingClientRect().width - margin.left - margin.right];
            const svgHeightRange = [0, svgref.node().getBoundingClientRect().height - margin.top - margin.bottom];
            const width = 900;
            const height = 600;
            const min_support = filter_threshold['support'] / tot_size;

            svgref.attr('width', width)
                .attr('height', height);

            // creating scales
            const yScale = d3.scaleBand().domain(d3.range(rules.length+1))
                .range(svgHeightRange);
            const sizeScale = d3.scaleLinear()
                .domain([min_support, 1])
                .range([2*3, max_r*2]);
            let rectXst = [];
            d3.range(filter_threshold['num_bin']).forEach(d => {
                rectXst.push(d * sqWidth)
            });

            // creating legend
            // TODO: to add size legend
            render_legend(headerGroup);

            // creating feature aligned tree
            render_feature_aligned_tree(svgref, chartGroup, yScale, sizeScale, rectXst);
        }
    )
    return   <div className='aligned-tree-wrapper'>
        <div className='aligned-tree-container'>
            <svg ref={ref}></svg>
        </div>
    </div>;
}

export default AlignedTree;