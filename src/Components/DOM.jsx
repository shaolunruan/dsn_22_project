// eslint-disable-next-line
import React, {Component} from "react";
import * as d3 from "d3";
import "guans-style";
import axios from 'axios';
import * as dat from 'dat.gui';
import {select} from 'd3-selection'
import "../style.css";



class DOM extends Component {

    constructor(props) {
        super(props);
        this.state = {
            goldenByKey_1 : {},
            clusterByKey: [],
            force:-10, /*You can change the layout here (e.g. -XX)*/

            model:"trident"

        };

        this.initTxt_parseDiff_1 = this.initTxt_parseDiff_1.bind(this);
        this.initJson_parseLayout_1 = this.initJson_parseLayout_1.bind(this);
        this.drawOvVw1 = this.drawOvVw1.bind(this);
        this.drawRv1 = this.drawRv1.bind(this);
        this.click_model_button = this.click_model_button.bind(this);



    }


    initTxt_parseDiff_1(model='trident'){

        let linkKey, linkSeprt = "to", goldenByKey_1 = {}, errByKey_1 = {};

        axios.get(`data/${model}.txt`)
            .then(txt=>{
                txt = txt.data

                let links = txt.split(/[\n]+/).map((d, i) => {
                    let tem = d.split(/[\s->:?\s]+/);
                    return {
                        source: tem[0] || '',
                        target: tem[1] || '',
                        value: Number(tem[2]) || 0,
                    };
                });

                for (let i = 0; i < links.length; i++) {
                    linkKey = links[i].source + linkSeprt + links[i].target;
                    goldenByKey_1[linkKey] = links[i]
                }

                this.setState({
                    goldenByKey_1: goldenByKey_1
                })
            })
    }


    initJson_parseLayout_1(){

        axios.get('data/CoMD.json')
            .then(json=>{
                json = json.data
                let clusterArr = [], nodesByKey = {}, edgesByKey = {}
                let clusterByKey = [], prefix = "$", clusterKey;
                let goldenByKey_1 = this.state.goldenByKey_1


                json.objects.map((d, i) => {
                    if (d.name.match(/^cluster/)) {
                        clusterArr.push(
                            {
                                '_gvid': d._gvid,
                                'id': d.name || '',
                                'nodes': d.nodes || [],
                                'edges': d.edges || [],
                                'color': d.color || '',
                                'label': d.label || ''
                            }
                        )
                    } else {
                        if(!isNaN(d._gvid)){
                            nodesByKey[d._gvid] = {
                                '_gvid': d._gvid,
                                'id': d.name || '',
                                'label': d.label || '',
                                'shape': d.shape|| ''
                            }
                        }
                    }
                })


                json.edges.map((d, i) => {
                    if(!isNaN(d._gvid)){
                        edgesByKey[d._gvid] = {
                            "_gvid": d._gvid,
                            "source": d.tail || 0,
                            "target": d.head || 0,
                            'color': d.color || '',
                            "index": d.index || 0
                        }
                    }
                })

/*                this.setState({
                    clusterArr: clusterArr,
                    nodesByKey: nodesByKey,
                    edgesByKey: edgesByKey,
                })*/


                /*构造最终数组clusterByKey*/
                for (let i = 0; i < clusterArr.length; i++){
                    clusterKey = clusterArr[i].id

                    clusterByKey[clusterKey] = {};
                    clusterByKey[clusterKey].nodes = [];
                    clusterByKey[clusterKey].links = [];

                    clusterArr[i].nodes.forEach((d, j) => {
                        let position;
                        if (j == 0) {
                            position = 'head'
                        } else if (j == clusterArr[i].nodes.length - 1) {
                            position = 'tail'
                        } else {
                            position = 'body'
                        }
                        clusterByKey[clusterKey].nodes.push({
                            _gvid: nodesByKey[d]._gvid,
                            id: nodesByKey[d].id || '',
                            label: nodesByKey[d].label || '',
                            shape: nodesByKey[d].shape || '',
                            position: position || 'body'
                        })
                    })


                    if (clusterArr[i].edges) {
                        clusterArr[i].edges.forEach(d => {
                            clusterByKey[clusterKey].links.push({
                                /* edgesByKey[d].target是“43” */
                                /* nodesByKey[edgesByKey[d].target].id是400472 */
                                'id': clusterKey || 'cluster_1',
                                'source': nodesByKey[edgesByKey[d].source].id || '',
                                "target": nodesByKey[edgesByKey[d].target].id || '',
                                "color": edgesByKey[d].color || '',
                                "index": edgesByKey[d].index || '',
                                "goldenValue":
                                    `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey_1 ?
                                        goldenByKey_1[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : 0,
                                "_gvid": edgesByKey[d]._gvid
                            })
                        })
                    }
                    clusterByKey[clusterKey].id = clusterArr[i].id;
                    clusterByKey[clusterKey].label = clusterArr[i].label;
                    clusterByKey[clusterKey].color = clusterArr[i].color;

                }


                this.setState({
                    clusterByKey: clusterByKey
                }, this.drawOvVw1)

                // console.log(this.state.clusterByKey)

            })
    }

    drawOvVw1(num){
        let keys = Object.keys(this.state.clusterByKey),
            values = Object.values(this.state.clusterByKey),
            entries = Object.entries(this.state.clusterByKey),
            _this = this

        let width = 900,
            height = 80,
            paddingLeft = 40,
            paddingRight = 40,
            paddingTop = 30,
            paddingBottom = 30,
            innerRadius = 4,
            radius = 5,
            intervel = (width - paddingLeft - paddingRight - 2 * radius) / (entries.length - 1)

        let svg = d3.select('#canvas_0').attr('width',width).attr('height',height)

        svg.selectAll("*").remove();

        /* 计算overview的clusterNode的坐标 */
        function clusterNodePos(i, entries) {
            let x = paddingLeft + radius + i * intervel
            let y = height / 2;
            return {
                "x": x,
                "y": y
            }
        }

        let goldenByKey_1 = this.state.goldenByKey_1

        let node = svg
            .selectAll('g')
            .data(entries)
            .join('g')
            .attr('class', 'overview')
            .attr('transform', function (d, i) {
                return `translate(${clusterNodePos(i, entries).x},${clusterNodePos(i, entries).y})`
            })

        /*设置rect高度的比例尺*/
        let scale_height = d3.scaleLinear()
            .domain(d3.extent(values.map(d=>d.links.length)))
            .range([0,60])


        /*设置rect高度的比例尺*/
        let scale_color = d3.scaleLinear()
            .domain(d3.extent(values.map(d=>d.nodes.length)))
            .range(["rgba(105,163,178,0.63)","rgba(178,134,133,0.71)"])


        node.append('rect')
            .attr('x', -radius/2)
            .attr('y',d=>{
                return d[1].links.length<5?-2.5:-scale_height(d[1].links.length/2)
            })
            .attr('width', radius)
            .attr('height', d=>{
                return d[1].links.length<5?5:scale_height(d[1].links.length)
            })
            .attr('fill', d=>scale_color(d[1].nodes.length))
            .on('click', function (_,d) {
                _this.drawRv1(d[0])
            })
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('height', d=>+this.getAttribute('height')+16)
                    .attr('y', d=> this.getAttribute('y')-8)
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('height', d=>d[1].links.length<5?5:scale_height(d[1].links.length))
                    .attr('y', d=>d[1].links.length<5?-2.5:-scale_height(d[1].links.length/2))
            })
            .append('title')
            .text(function (d) {
                return d[1].label || 'unknown'
            })


        this.drawRv1()

    }

    drawRv1(cluster_id='cluster_1'){
        let clusterByKey = this.state.clusterByKey

        const width = 900,
            height = 500;

        const radius = 6,
            rectWidth = 12,
            rectHeight = 12,
            rectWidthHover = 72,
            rectHeightHover = 24,
            rx = rectWidth / 2,
            ry = rectHeight / 2,
            lightRadius = 3,
            paddingLeft = 60,
            paddingRight = 60,
            paddingTop = 20,
            paddingBottom = 20,
            overviewHieght = 130,
            radius_local = 20,

            _this = this




        let nodes = [], links = []

        nodes = clusterByKey[cluster_id].nodes
        links = clusterByKey[cluster_id].links

        let svg = d3.select('#canvas').attr('width',width).attr('height',height)

        svg.selectAll("*").remove();

        // this.init_legend(svg)

        // let div = d3.select('body')
        //     .append('div')
        //     .attr('id', 'tooltip')
        //     .style('opacity', 0)

        let simulation = d3
            .forceSimulation()
            .force(
                "link",
                d3.forceLink().id(function (d) {
                    return d.id;
                })
            )
            .force("charge", d3.forceManyBody().strength(this.state.force))
            .force("center", d3.forceCenter(width / 2, height / 2))
/*            .force(
                "r",
                d3
                    .forceRadial()
                    .radius(width / 2, height / 2)
                    .strength(0.01)
            )*/

        let link_g = svg
            .append('g')
            .attr("class", "links")
            .selectAll('g')
            .data(links)
            .join('g')

        let link, node, link_text


        /* 开始画点和线 */
        link = link_g
            .append("line")
            .style('stroke', '#c5c5c5')
            .style('stroke-width', 2)


        node = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll('g')
            .data(nodes)
            .join('g')
            // .on('click', click_circle_local)
            // .on('dblclick', dblclick_circle_local)
            .call(
                d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            )

        let circle = node
            .append("circle")
            .attr('class', 'circle_local')
            .attr("r", 6)
            .attr('fill', function (d) {
                return d.position == 'head' ? 'rgb(250,195,198)' :
                    (d.position == 'tail' ? '#cedafc' :
                        '#c5c5c5')
            })
            .attr("stroke", '#9c9c9c')
            .attr("stroke-width", 1)

        let text = node
            .append('text')
            .attr('class', 'text_local')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dx', 0)
            .attr('dy', 5)
            .text(function (d) {
                return `0x${d.id}`
            })

        let scale_textColor = d3.scaleLinear()
            .domain(links.map(d=>d.goldenValue))
            .range(["rgba(227,130,120,0.76)","#e38278"])


        svg
            .append("defs")
            .append("marker")
            .attr("id", "marker")
            .attr("viewBox", "0 -5 10 5")
            .attr("refX", radius_local * 2)
            .attr("markerWidth", 3)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")


        link_text = link_g
            .append('text')
            .attr('class', 'link_text')
            .text(function (d) {
                return d.goldenValue
            })
            .attr('dy', '-3px')
            .style('fill',d=>{
                return scale_textColor(d.goldenValue)
            })


        simulation.nodes(nodes).on("tick", function () {
            link
                .attr("x1", function (d) {
                    return Math.max(radius, Math.min(width - rectWidth, d.source.x));
                })
                .attr("y1", function (d) {
                    return Math.max(radius, Math.min(height - rectWidth, d.source.y));
                })
                .attr("x2", function (d) {
                    return Math.max(radius, Math.min(width - rectWidth, d.target.x));
                })
                .attr("y2", function (d) {
                    return Math.max(radius, Math.min(height - rectHeight, d.target.y));
                })
                .attr("marker-end", "url(#marker)");

            link_text
                .attr('x', function (d) {
                    return (d.source.x + d.target.x) / 2
                })
                .attr('y', function (d) {
                    return (d.source.y + d.target.y) / 2
                })

            node
                //   .attr("cx", function (d) {
                //     return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
                //   })
                //   .attr("cy", function (d) {
                //     return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
                //   });
                .attr('transform', function (d) {
                    return `translate(${Math.max(radius, Math.min(width - rectWidth, d.x))},${Math.max(radius, Math.min(height - rectHeight, d.y))})`
                })
            // .attr("x", function(d) { return d.x = Math.max(radius, Math.min(width - rectWidth, d.x)) })
            // .attr("y", function(d) { return d.y = Math.max(radius, Math.min(height - rectHeight, d.y)) });
        });

        simulation.force("link").links(links);



        /* 开始定义一些函数 */
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x
            event.subject.fy = event.subject.y
        }

        function dragged(event) {
            event.subject.fx = event.x
            event.subject.fy = event.y
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        d3.select('canvas')
            .append('text')
            .datum(123)
            .join('text')


    }


    click_model_button(value){

        let _this = this

        let model = value.currentTarget.value


        if(model!=this.state.model){
            this.setState({
                model:model
            },()=>{
                if(['trident','IPAS'].includes(this.state.model)){
                    _this.initTxt_parseDiff_1(_this.state.model)
                    _this.initJson_parseLayout_1()
                }else{
                    console.log(123)/***********************************/
                }
            })
        }
    }


    componentDidMount() {

        this.initTxt_parseDiff_1()
        this.initJson_parseLayout_1()
    }

    render() {

        // let itemCardColor = ["#d54062", "#ffa36c", "#ebdc87", "#799351", "#557571", "#d49a89", "#a3d2ca", "#5eaaa8", "#056676", "#d8d3cd"]


        return (
            <div id="root">

                <div className='overview-container'>
                    <svg id="canvas_0"></svg>
                </div>

                <div className="svg-container">
                    <svg id="canvas"></svg>
                    {/*<h3>{this.state.cluster_1}</h3>*/}
                    <div className="btns btn-group-vertical" role="group" aria-label="Basic example">
                        <button type="button" value={'trident'} className="btn btn-outline-dark" onClick={this.click_model_button}>Trident</button>
                        <button type="button" value={'IPAS'} className="btn btn-outline-dark" onClick={this.click_model_button}>IPAS</button>
                        <button type="button" value={'Y_branch'} className="btn btn-outline-dark" onClick={this.click_model_button}>Y-Branch</button>
                    </div>
                </div>







                {/*<button type="button" onClick={this.globalHandle} className="btn btn-outline-primary">Global View*/}
                {/*</button>*/}
                {/*<button type="button" onClick={this.filterHandle} className="btn btn-outline-primary">Filter</button>*/}
                {/*先禁用show connection，之后有需求再加上*/}
                {/*<button type="button"*/}
                {/*        onClick={this.show_connection.bind(this, this.state.nodesByKey, this.state.edgesByKey, this.state.global_setting)}*/}
                {/*        className="btn btn-outline-primary">Show Connection*/}
                {/*</button>*/}



                {/*渲染侧面item-coat的代码段*/}
                {/*<div id='item-coat'>*/}
                {/*    <div id="item" className='d-flex flex-column justify-content-between'>*/}
                {/*        <div id="item-filtered" className="flex-grow-1">*/}
                {/*            <span className="title">Cluster: Number {this.state.clusterArr.length}</span>*/}
                {/*            {this.state.clusterArr.map((d, i) => {*/}
                {/*                return <div style={{backgroundColor: itemCardColor[i % 10]}}*/}
                {/*                            className="item-card rounded alert-info"*/}
                {/*                            key={i}*/}
                {/*                            onClick={this.clickLabel.bind(this, d)}*/}
                {/*                >{d.label}</div>*/}
                {/*            })}*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}


            </div>
        );
    }
}

export default DOM;
