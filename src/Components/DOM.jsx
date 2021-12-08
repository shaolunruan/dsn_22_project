import React, {Component} from "react";
import * as d3 from "d3";
import "guans-style";
import "../style/style.css";
import axios from 'axios';
import * as dat from 'dat.gui';
import classPrivateFieldGet from "@babel/runtime/helpers/esm/classPrivateFieldGet";


class DOM extends Component {
    constructor(props) {
        super(props);
        this.state = {
            item: "react component",
            clusterByKey: {},
            clusterByKey_2: {},
            goldenByKey_1: {},
            errByKey_1: {},
            diffList_union: {},
            clusterArr: [],
            nodesByKey: {},
            edgesByKey: {},


            cluster_1: '',
            cluster_2: '',
            click_flag: false,
            threshold: 0,
            clusterId: '',

            /* 两种setting，分别是全局模式和local模式 */
            global_setting: {
                if_global: true,
                force: -5,
                only_filter: false,
            },

            local_setting: {
                if_global: false,
                force: -400,
            },

            /* injection node */
            /* 在这里修改注入错误的节点 */
            injectNode: {
                _gvid: undefined,
                id: '0x4005f8',
                cluster: 'cluster_1'
            }
        };

        this.heightHandle = this.heightHandle.bind(this);
        this.initTxt_parseDiff_1 = this.initTxt_parseDiff_1.bind(this);
        this.initJson_parseLayout_1 = this.initJson_parseLayout_1.bind(this);
        this.initTxt_parseDiff_2 = this.initTxt_parseDiff_2.bind(this);
        this.initJson_parseLayout_2 = this.initJson_parseLayout_2.bind(this);
        this.drawOvVw1 = this.drawOvVw1.bind(this)
        this.drawOvVw2 = this.drawOvVw2.bind(this)
        this.drawRv1 = this.drawRv1.bind(this)
        this.drawRv2 = this.drawRv2.bind(this)
        this.globalHandle = this.globalHandle.bind(this)
        this.filterHandle = this.filterHandle.bind(this)
        this.init_legend = this.init_legend.bind(this)
        this.clickLabel = this.clickLabel.bind(this)
        this.initGUI = this.initGUI.bind(this)
        this.show_connection = this.show_connection.bind(this)
        this.render_loop = this.render_loop.bind(this)



    }

    /* height: 图的高度 */
    /* d: 需要计算的节点 */

    /* stratify: 原数组 */
    heightHandle(height, d, stratify) {
        let maxDepth = d3.max(
            stratify.descendants().reduce(function (prev, cur) {
                prev.push(cur.depth);
                return prev;
            }, [])
        );

        return ((height - 100) / (maxDepth + 2)) * (d.depth + 1);
    }

    show_connection(nodesByKey, edgesByKey, setting) {

        // console.log(nodesByKey);
        // console.log(edgesByKey);

        let force = setting.force,
            mode = setting.if_global

        const width = 900,
            height = 840;

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

        let nodes = [], links = [];

        for (let key in nodesByKey) {
            nodes.push(
                {
                    id: key,
                    name: nodesByKey[key].id,
                    label: nodesByKey[key].label,
                    shape: nodesByKey[key].shape
                }
            )
        }

        for (let key in edgesByKey) {
            links.push(
                {
                    gvid: key,
                    source: edgesByKey[key].source,
                    target: edgesByKey[key].target,
                    color: edgesByKey[key].color,
                    index: edgesByKey[key].index,
                    diff: 0
                }
            )
        }

        links[20].diff = 1;
        links[25].diff = 1;
        links[26].diff = 1;
        links[27].diff = 1;


        var svg = d3.select("#svg-rv").attr("width", width).attr("height", height);

        svg.selectAll("*").remove();

        this.init_legend(svg)


        let div = d3.select('body')
            .append('div')
            .attr('id', 'tooltip')
            .style('opacity', 0)

        /* start to build graph */
        /* +引力  -斥力 */
        let simulation = d3
            .forceSimulation()
            .force(
                "link",
                d3.forceLink().id(function (d) {
                    return d.id;
                })
            )
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "r",
                d3
                    .forceRadial()
                    .radius(width / 2, height / 2)
                    .strength(0.01)
            );
        // .force("y", d3.forceY())

        /* 结束构造simulation*/


        /* 映射线条粗细的比例尺 */
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => {
            return d.goldenValue
        }))).range([1.5, 3])


        let link_g = svg
            .append('g')
            .attr("class", "links")
            .selectAll('g')
            .data(links)
            .enter()
            .append('g')


        let link, node, link_text


        /* 开始画点和线 */
        link = link_g
            .append("line")
            .style('stroke', function (d) {
                return d.diff == 1 ? 'red' : 'rgb(123,120,120)'
            })

            .style('stroke-dasharray', function (d) {
                return (d.color == 'green') || (d.color == 'blue') ?
                    '5,5' : 'none'
            })

        link_text = link_g
            .append('text')
            .attr('style', 'link_text')
            .text(function (d) {
                return d.diff;
            })
        // .attr('dx','-10px')

        node = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .on('mouseover', mouseover_circle)
            .on('mouseout', mouseout_circle)
            .on('click', click_circle)
            .on('dblclick', dblclick_circle)
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );


        let circle = node
            .append("rect")
            .attr("width", rectWidth)
            .attr('height', rectHeight)
            .attr('rx', rx)
            .attr('ry', ry)
            .attr('transform', function () {
                return `translate(${-rectWidth / 2},${-rectHeight / 2})`
            })
            .attr('fill', function (d) {
                return d.position == 'head' ? 'orange' : (d.position == 'tail' ? 'pink' : '#d4dbff')
            })


        let hoverTrigger = node
            .append('circle')
            .attr('class', 'circle')
            .attr('r', lightRadius)

        let text = node
            .append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dx', lightRadius * 2)
            .attr('dy', rectHeightHover / 2)
            .text(function (d) {
                return d.name
            })
            .style('display', 'none')


        /* arrow line */
        svg
            .append("defs")
            .append("marker")
            .attr("id", "marker")
            .attr('width', 100)
            .attr('height', 100)
            .attr("viewBox", "0 -5 10 5")
            .attr("refX", 15)
            .attr("markerWidth", 4)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");


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
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        global.d3 = d3

        //交互：tooltip  mouseover
        function mouseover_circle(d, i) {
            let _this = this.parentNode;

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)


        }

        function mouseout_circle(d, i) {


            if (!_this.state.click_flag) {
                d3.select(this)
                    .select('text')
                    .transition()
                    .duration(50)
                    .style('display', 'none')

                d3.select(this)
                    .select('rect')
                    .transition()
                    .duration(100)
                    .attr('width', rectWidth)
                    .attr('height', rectHeight)

            }


        }

        function click_circle(d) {
            _this.setState({click_flag: true})

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle(d) {

            _this.setState({click_flag: false})


            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'none')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidth)
                .attr('height', rectHeight)

            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }

        function click_circle_local(d) {

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle_local(d) {
            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }

    }

    init_legend(svg) {

        let lengendArr = {
            group: [
                'head', 'tail', 'body'
            ],
            style: [
                '#ffc107', '#e83e8c', '#d4dbff'
            ]
        }


        let legend = svg
            .append('g')
            .attr('transform', function () {
                return `translate(60,90)`
            })
            .attr('class', 'lengend')
            .selectAll('g')
            .data(lengendArr.style.map((d, i) => {
                return {
                    style: d,
                    name: lengendArr.group[i]
                }
            }))
            .enter()
            .append('g')
            .attr('transform', function (d, i) {
                return `translate(0,${30 * i})`
            })

        legend
            .append('circle')
            .attr('r', 10)
            .attr('fill', function (d) {
                return d.style
            })

        legend
            .append('text')
            .text(function (d) {
                return d.name
            })
            .attr('dx', 30)
            .attr('dy', 5)

    }


    drawOvVw1(clusterByKey) {

        /* 切换global和local模式靠的是数据改变 ，样式渲染变化靠的是内部的一个判断if(mode){}*/
        /* 切换global和filter模式靠的是数据的改变 */

        // console.log(clusterByKey);

        let keys = Object.keys(clusterByKey),
            values = Object.values(clusterByKey),
            entries = Object.entries(clusterByKey),
            _this = this

        var svg = d3.select("#svg-overview").attr("width", 1200).attr("height", 130);

        let width = 1200,
            height = 80,
            paddingLeft = 40,
            paddingRight = 40,
            paddingTop = 30,
            paddingBottom = 30,
            innerRadius = 4,
            radius = 15,
            intervel = (width - paddingLeft - paddingRight - 2 * radius) / (entries.length - 1)

        /* 计算overview的clusterNode的坐标 */
        function clusterNodePos(i, entries) {
            let x = paddingLeft + radius + i * intervel
            let y = height / 3;
            return {
                "x": x,
                "y": y
            }
        }

        /* 这之间的算法是计算cluster连接处的状态的 */
        let goldenByKey_1 = this.state.goldenByKey_1,
            errByKey_1 = this.state.errByKey_1,

            /* diffList_union是全部的diff数组，不看是哪个cluster的，因为有连接处的diff */
            diffList_union = {}

        for (let key in goldenByKey_1) {
            diffList_union[key] = Math.abs(errByKey_1[key].value - goldenByKey_1[key].value)
        }
        this.setState({
            "diffList_union": diffList_union
        })

        for (let key in diffList_union) {
            if (diffList_union[key] != 0) {
                let [source, target] = key.split('to')
                for (let key_cluster in clusterByKey) {
                    let idArr = [];
                    clusterByKey[key_cluster].nodes.forEach(d => {
                        idArr.push(d.id)
                    })
                    // if(idArr.includes(source) && idArr.includes(target)){
                    //     let temObj = {}
                    //     temObj.diff = diffList_union[key];
                    //     temObj.distribution = [].push(key_cluster);
                    //     diffList_union[key] = temObj;
                    // }else  if(idArr.includes(source) && !idArr.includes(target)){
                    //     let temObj = {}
                    //     temObj.diff = diffList_union[key];
                    //     temObj.distribution = [].push(key_cluster);
                    //     diffList_union[key] = temObj;
                    // }else if(!idArr.includes(source) && idArr.includes(target)){

                    // }

                    if (idArr.includes(source) || idArr.includes(target)) {
                        if (!diffList_union[key].distribution) {
                            let temObj = {}
                            temObj.diff = diffList_union[key];
                            temObj.distribution = [key_cluster];
                            diffList_union[key] = temObj;
                        } else {
                            diffList_union[key].distribution.push(key_cluster)
                        }
                    }
                }
            } else {
                diffList_union[key] = {
                    'diff': 0,
                    'distribution': undefined
                }
            }
        }
        /* 这之间的算法是计算cluster连接处的状态的 */

        global.data = {
            "diffList_union": diffList_union
        }


        let node = svg
            .selectAll('g')
            .data(entries)
            .enter()
            .append('g')
            .attr('class', 'overview')
            .attr('transform', function (d, i) {
                return `translate(${clusterNodePos(i, entries).x},${clusterNodePos(i, entries).y})`
            })


        node.append('line')
            .attr('x1', 0)
            /* 如果是最后一个line，就不画；否则画 */
            .attr('x2', function (d, i) {
                return i == entries.length - 1 ? 0 : intervel
            })
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', function (item, i) {
                let color = 'green';
                Object.values(diffList_union).forEach((d, i) => {
                    if (d.distribution && d.distribution.length == 2) {
                        let clusterNum = item[0].split('_')[1]
                        let diffNum = [d.distribution[0].split('_')[1], d.distribution[1].split('_')[1]]
                        if (diffNum.includes(clusterNum) && diffNum.includes(String(Number(clusterNum) + 1))) {
                            color = "#dc3545"
                        }
                    }
                })
                return color
            })

        // let outer = node.append('circle')
        // .attr('class','outer')
        // .attr('r',radius)
        // .attr('fill',function(d){
        //     /* 根据cluster中是否包含diff不为0来确定node的颜色 */
        //     return d[1].links.some(value=>{return value.diff != 0})?'#dc3545':'green'
        // })
        // .on('click',function(d){
        //   _this.drawRv1(clusterByKey[d[0]],_this.state.local_setting)
        //   _this.setState({
        //     cluster: d[1].label
        //   })
        // })


        node.append('circle')
            .attr('class', 'inner')
            .attr('r', innerRadius)
            .attr('fill', function (d) {
                /* 根据cluster中是否包含diff不为0来确定node的颜色 */
                return d[1].links.some(value => {
                    return value.diff != 0
                }) ? '#dc3545' : 'green'
            })
            .on('click', function (d) {
                _this.drawRv1(clusterByKey[d[0]], _this.state.local_setting)
                _this.setState({
                    cluster_1: d[1].label,
                    clusterId:d[0]
                })
            })
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', innerRadius + 1.5)
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', innerRadius)
            })

        node
            .append('path')
            .attr('d', function (d) {
                return (
                    `M 0 -10  L 5 -20 L -5 -20 Z`
                )
            })
            .attr('stroke', 'purple')
            .attr('fill', 'purple')
            // .text(function(d){return 'inject'})
            // .attr('dx', -intervel/2)
            .attr('dy', function (d, i) {
                return i % 2 == 0 ? radius + 3 * innerRadius : -radius - innerRadius
            })
            .style('display', function (d) {
                return d[0] == _this.state.injectNode.cluster ? 'display' : 'none'
            })

        //因为要显示drawOvVw2，所以OvVw1只显示上半部
        // node
        //     .append('path')
        //     .attr('d', function (d) {
        //         return (
        //             `M 0 10  L 5 20 L -5 20 Z`
        //         )
        //     })
        //     .attr('stroke', 'purple')
        //     .attr('fill', 'purple')
        //     // .text(function(d){return 'inject'})
        //     // .attr('dx', -intervel/2)
        //     .attr('dy', function (d, i) {
        //         return i % 2 == 0 ? radius + 3 * innerRadius : -radius - innerRadius
        //     })
        //     .style('display', function (d) {
        //         return d[0] == _this.state.injectNode.cluster ? 'display' : 'none'
        //     })

        node.append('title')
            .text(function (d) {
                return d[1].label
            })


        // this.init_legend(svg)


    }

    drawOvVw2(clusterByKey) {

        /* 切换global和local模式靠的是数据改变 ，样式渲染变化靠的是内部的一个判断if(mode){}*/
        /* 切换global和filter模式靠的是数据的改变 */

        // console.log(clusterByKey);

        let keys = Object.keys(clusterByKey),
            values = Object.values(clusterByKey),
            entries = Object.entries(clusterByKey),
            _this = this

        var svg = d3.select("#svg-overview").attr("width", 1200).attr("height", 130);

        let width = 1200,
            height = 80,
            paddingLeft = 40,
            paddingRight = 40,
            paddingTop = 30,
            paddingBottom = 30,
            innerRadius = 4,
            radius = 15,
            intervel = (width - paddingLeft - paddingRight - 2 * radius) / (entries.length - 1)

        /* 计算overview的clusterNode的坐标 */
        function clusterNodePos(i, entries) {
            let x = paddingLeft + radius + i * intervel
            let y = 2 * height / 3;
            return {
                "x": x,
                "y": y
            }
        }

        /* 这之间的算法是计算cluster连接处的状态的 */
        let goldenByKey_1 = this.state.goldenByKey_1,
            errByKey_1 = this.state.errByKey_1,

            /* diffList_union是全部的diff数组，不看是哪个cluster的，因为有连接处的diff */
            diffList_union = {}

        for (let key in goldenByKey_1) {
            diffList_union[key] = Math.abs(errByKey_1[key].value - goldenByKey_1[key].value)
        }
        this.setState({
            "diffList_union": diffList_union
        })

        for (let key in diffList_union) {
            if (diffList_union[key] != 0) {
                let [source, target] = key.split('to')
                for (let key_cluster in clusterByKey) {
                    let idArr = [];
                    clusterByKey[key_cluster].nodes.forEach(d => {
                        idArr.push(d.id)
                    })
                    // if(idArr.includes(source) && idArr.includes(target)){
                    //     let temObj = {}
                    //     temObj.diff = diffList_union[key];
                    //     temObj.distribution = [].push(key_cluster);
                    //     diffList_union[key] = temObj;
                    // }else  if(idArr.includes(source) && !idArr.includes(target)){
                    //     let temObj = {}
                    //     temObj.diff = diffList_union[key];
                    //     temObj.distribution = [].push(key_cluster);
                    //     diffList_union[key] = temObj;
                    // }else if(!idArr.includes(source) && idArr.includes(target)){

                    // }

                    if (idArr.includes(source) || idArr.includes(target)) {
                        if (!diffList_union[key].distribution) {
                            let temObj = {}
                            temObj.diff = diffList_union[key];
                            temObj.distribution = [key_cluster];
                            diffList_union[key] = temObj;
                        } else {
                            diffList_union[key].distribution.push(key_cluster)
                        }
                    }
                }
            } else {
                diffList_union[key] = {
                    'diff': 0,
                    'distribution': undefined
                }
            }
        }
        /* 这之间的算法是计算cluster连接处的状态的 */

        global.data = {
            "diffList_union": diffList_union
        }


        let node = svg
            .append('g') //增加了这一行，不然不能显示drawOvVw2
            .selectAll('g')
            .data(entries)
            .enter()
            .append('g')
            .attr('class', 'overview')
            .attr('transform', function (d, i) {
                return `translate(${clusterNodePos(i, entries).x},${clusterNodePos(i, entries).y})`
            })


        node.append('line')
            .attr('x1', 0)
            /* 如果是最后一个line，就不画；否则画 */
            .attr('x2', function (d, i) {
                return i == entries.length - 1 ? 0 : intervel
            })
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', function (item, i) {
                let color = 'green';
                Object.values(diffList_union).forEach((d, i) => {
                    if (d.distribution && d.distribution.length == 2) {
                        let clusterNum = item[0].split('_')[1]
                        let diffNum = [d.distribution[0].split('_')[1], d.distribution[1].split('_')[1]]
                        if (diffNum.includes(clusterNum) && diffNum.includes(String(Number(clusterNum) + 1))) {
                            color = "#dc3545"
                        }
                    }
                })
                return color
            })

        // let outer = node.append('circle')
        // .attr('class','outer')
        // .attr('r',radius)
        // .attr('fill',function(d){
        //     /* 根据cluster中是否包含diff不为0来确定node的颜色 */
        //     return d[1].links.some(value=>{return value.diff != 0})?'#dc3545':'green'
        // })
        // .on('click',function(d){
        //   _this.drawRv1(clusterByKey[d[0]],_this.state.local_setting)
        //   _this.setState({
        //     cluster: d[1].label
        //   })
        // })


        node.append('circle')
            .attr('class', 'inner')
            .attr('r', innerRadius)
            .attr('fill', function (d) {
                /* 根据cluster中是否包含diff不为0来确定node的颜色 */
                return d[1].links.some(value => {
                    return value.diff != 0
                }) ? '#dc3545' : 'green'
            })
            .on('click', function (d) {
                _this.drawRv2(clusterByKey[d[0]], _this.state.local_setting)
                _this.setState({
                    cluster_2: d[1].label,
                    clusterId:d[0]
                })
            })
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', innerRadius + 1.5)
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', innerRadius)
            })

        //因为要显示drawOvVw2，所以OvVw2只显示下半部
        // node
        //     .append('path')
        //     .attr('d', function (d) {
        //         return (
        //             `M 0 -10  L 5 -20 L -5 -20 Z`
        //         )
        //     })
        //     .attr('stroke', 'purple')
        //     .attr('fill', 'purple')
        //     // .text(function(d){return 'inject'})
        //     // .attr('dx', -intervel/2)
        //     .attr('dy', function (d, i) {
        //         return i % 2 == 0 ? radius + 3 * innerRadius : -radius - innerRadius
        //     })
        //     .style('display', function (d) {
        //         return d[0] == _this.state.injectNode.cluster ? 'display' : 'none'
        //     })

        node
            .append('path')
            .attr('d', function (d) {
                return (
                    `M 0 10  L 5 20 L -5 20 Z`
                )
            })
            .attr('stroke', 'purple')
            .attr('fill', 'purple')
            // .text(function(d){return 'inject'})
            // .attr('dx', -intervel/2)
            .attr('dy', function (d, i) {
                return i % 2 == 0 ? radius + 3 * innerRadius : -radius - innerRadius
            })
            .style('display', function (d) {
                return d[0] == _this.state.injectNode.cluster ? 'display' : 'none'
            })

        node.append('title')
            .text(function (d) {
                return d[1].label
            })


        // this.init_legend(svg)


    }

    globalHandle() {
        /* 点击再渲染，这样可以不用牵扯到js的异步读取 */
        /* 下面的clg可行 */
        // console.log(this.state.clusterByKey);

        /* 更新filter的状态，然后传入渲染函数 */
        let update_onlyFilter = false
        this.setState({
            global_setting: {
                force: -20,
                if_global: true,
                only_filter: update_onlyFilter
            },
        })
        this.drawRv1(this.state.clusterByKey, this.state.global_setting)

        this.setState({
            cluster: ''
        })
    }

    filterHandle() {
        /* 更新filter的状态，然后传入渲染函数 */
        let update_onlyFilter = true
        this.setState({
            global_setting: {
                force: -20,
                if_global: true,
                only_filter: update_onlyFilter
            },
        })
        this.drawRv1(this.state.clusterByKey, this.state.global_setting)

        this.setState({
            cluster: ''
        })
    }


    drawRv1(clusterByKey, setting) {
        global.data.clusterByKey = clusterByKey

        /* parse setting */
        let force = setting.force,
            mode = setting.if_global

        const width = 585,
            height = 600;

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


        /* 根据only_filter的值来决定数组nodes和links */
        let nodes = [], links = []

        if (!this.state.global_setting.only_filter) {
            if (!('id' in clusterByKey)) {
                Object.values(clusterByKey).forEach(d => {
                    nodes = [...nodes, ...d.nodes]
                })

                Object.values(clusterByKey).forEach(d => {
                    links = [...links, ...d.links]
                })
            } else {
                nodes = clusterByKey.nodes
                links = clusterByKey.links
            }
        } else {
            /* 下面构造filter下的数组 */
            if (!('id' in clusterByKey)) {
                Object.values(clusterByKey).forEach(d => {
                    let res = d.links.some((val, index) => {
                        return val.diff != 0
                    })
                    if (res) {
                        nodes = [...nodes, ...d.nodes]
                    }
                })

                Object.values(clusterByKey).forEach(d => {
                    let res = d.links.some((val, index) => {
                        return val.diff != 0
                    })
                    if (res) {
                        links = [...links, ...d.links]
                    }
                })
            } else {
                nodes = clusterByKey.nodes
                links = clusterByKey.links
            }
        }


        /* HEREEEEEEEEEEEEEEEEEEEEEEEEEEE */


        // for(let key in this.state.diffList_union){
        //     let [source, target] = key.split('to')
        //     if(links.every(d=>{
        //         return (source != d.source.id) && (target !=d.target.id)
        //     })){
        //         links.push({
        //             "diff": this.state.diffList_union[key].diff,
        //             "source": {"id":source},
        //             "target": {"id":target}
        //         })
        //     }
        // }

        var svg = d3.select("#svg-rv-1").attr("width", width).attr("height", height);

        svg.selectAll("*").remove();

        this.init_legend(svg)


        let div = d3.select('body')
            .append('div')
            .attr('id', 'tooltip')
            .style('opacity', 0)

        /* start to build graph */
        /* +引力  -斥力 */
        let simulation = d3
            .forceSimulation()
            .force(
                "link",
                d3.forceLink().id(function (d) {
                    return d.id;
                })
            )
            .force("charge", d3.forceManyBody().strength(force))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "r",
                d3
                    .forceRadial()
                    .radius(width / 2, height / 2)
                    .strength(0.01)
            );
        // .force("y", d3.forceY())

        /* 结束构造simulation*/


        /* 映射线条粗细的比例尺 */
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => {
            return d.goldenValue
        }))).range([1.5, 3])


        let link_g = svg
            .append('g')
            .attr("class", "links")
            .selectAll('g')
            .data(links)
            .enter()
            .append('g')


        let link, node, link_text

        /* 全局模式下隐藏id */
        if (mode) {

            /* 开始画点和线 */
            link = link_g
                .append("line")
                .style('stroke', function (d) {
                    return d.diff <= _this.state.threshold ? "rgb(136,133,133)" : 'red'
                })
                .style('stroke-width', function (d) {
                    return scale(d.goldenValue)
                })

            link_text = link_g
                .append('text')
                .attr('style', 'link_text')
                .text(function (d) {
                    return d.diff;
                })
            // .attr('dx','-10px')

            node = svg
                .append("g")
                .attr("class", "nodes")
                .selectAll('g')
                .data(nodes)
                .enter()
                .append('g')
                .on('mouseover', mouseover_circle)
                .on('mouseout', mouseout_circle)
                .on('click', click_circle)
                .on('dblclick', dblclick_circle)
                .call(
                    d3
                        .drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                );


            let circle = node
                .append("rect")
                .attr("width", rectWidth)
                .attr('height', rectHeight)
                .attr('rx', rx)
                .attr('ry', ry)
                .attr('transform', function () {
                    return `translate(${-rectWidth / 2},${-rectHeight / 2})`
                })
                .attr('fill', function (d) {
                    return d.position == 'head' ? 'orange' : (d.position == 'tail' ? 'pink' : '#d4dbff')
                })


            let hoverTrigger = node
                .append('circle')
                .attr('class', 'circle')
                .attr('r', lightRadius)

            let text = node
                .append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('dx', lightRadius * 2)
                .attr('dy', rectHeightHover / 2)
                .text(function (d) {
                    return d.id
                })
                .style('display', 'none')


            /* arrow line */
            svg
                .append("defs")
                .append("marker")
                .attr("id", "marker")
                .attr('width', 100)
                .attr('height', 100)
                .attr("viewBox", "0 -5 10 5")
                .attr("refX", 15)
                .attr("markerWidth", 4)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");
        }
        /* 局部模式下显示id */
        else {

            /* 开始画点和线 */
            link = link_g
                .append("line")
                .style('stroke', function (d) {
                    return d.diff <= _this.state.threshold ? "rgb(146,143,143)" : 'red'
                })
                .style('stroke-width', function (d) {
                    return scale(d.goldenValue)
                })


            node = svg
                .append("g")
                .attr("class", "nodes")
                .selectAll('g')
                .data(nodes)
                .enter()
                .append('g')
                .on('click', click_circle_local)
                .on('dblclick', dblclick_circle_local)
                .call(
                    d3
                        .drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                )

            // .each(function(d){console.log(d);})


            //使用该函数对loop进行渲染

            this.render_loop(node, link, svg)


            let circle = node
                .append("circle")
                .attr('class', 'circle_local')
                .attr("r", radius_local)
                .attr('fill', function (d) {
                    return `0x${d.id}` === _this.state.injectNode.id ? 'purple' : (d.position == 'head' ? 'orange' : (d.position == 'tail' ? 'pink' : '#d4dbff'))
                })

            // .attr('transform', function(){return `translate(${-rectWidth/2},${-rectHeight/2})`})

            let text = node
                .append('text')
                .attr('class', 'text_local')
                .attr('x', 0)
                .attr('y', 0)
                .attr('dx', -17)
                .attr('dy', 5)
                .text(function (d) {
                    return `0x${d.id}`
                })


            /* arrow line */
            svg
                .append("defs")
                .append("marker")
                .attr("id", "marker")
                .attr("viewBox", "0 -5 10 5")
                .attr("refX", radius_local * 2)
                .attr("markerWidth", 4)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");


            link_text = link_g
                .append('text')
                .attr('style', 'link_text')
                .text(function (d) {
                    return d.diff;
                })
                // .attr('dx','-20px')
                .attr('dy', '-3px')
                .style('font-size', '1em')
                .style('z-index', '999')

        }


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
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        global.d3 = d3

        //交互：tooltip  mouseover
        function mouseover_circle(d, i) {
            let _this = this.parentNode;

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)


        }

        function mouseout_circle(d, i) {


            if (!_this.state.click_flag) {
                d3.select(this)
                    .select('text')
                    .transition()
                    .duration(50)
                    .style('display', 'none')

                d3.select(this)
                    .select('rect')
                    .transition()
                    .duration(100)
                    .attr('width', rectWidth)
                    .attr('height', rectHeight)

            }


        }

        function click_circle(d) {
            _this.setState({click_flag: true})

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle(d) {

            _this.setState({click_flag: false})


            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'none')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidth)
                .attr('height', rectHeight)

            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }

        function click_circle_local(d) {

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle_local(d) {
            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }
    }

    drawRv2(clusterByKey, setting) {
        global.data.clusterByKey = clusterByKey

        /* parse setting */
        let force = setting.force,
            mode = setting.if_global

        const width = 585,
            height = 600;

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


        /* 根据only_filter的值来决定数组nodes和links */
        let nodes = [], links = []

        if (!this.state.global_setting.only_filter) {
            if (!('id' in clusterByKey)) {
                Object.values(clusterByKey).forEach(d => {
                    nodes = [...nodes, ...d.nodes]
                })

                Object.values(clusterByKey).forEach(d => {
                    links = [...links, ...d.links]
                })
            } else {
                nodes = clusterByKey.nodes
                links = clusterByKey.links
            }
        } else {
            /* 下面构造filter下的数组 */
            if (!('id' in clusterByKey)) {
                Object.values(clusterByKey).forEach(d => {
                    let res = d.links.some((val, index) => {
                        return val.diff != 0
                    })
                    if (res) {
                        nodes = [...nodes, ...d.nodes]
                    }
                })

                Object.values(clusterByKey).forEach(d => {
                    let res = d.links.some((val, index) => {
                        return val.diff != 0
                    })
                    if (res) {
                        links = [...links, ...d.links]
                    }
                })
            } else {
                nodes = clusterByKey.nodes
                links = clusterByKey.links
            }
        }


        /* HEREEEEEEEEEEEEEEEEEEEEEEEEEEE */


        // for(let key in this.state.diffList_union){
        //     let [source, target] = key.split('to')
        //     if(links.every(d=>{
        //         return (source != d.source.id) && (target !=d.target.id)
        //     })){
        //         links.push({
        //             "diff": this.state.diffList_union[key].diff,
        //             "source": {"id":source},
        //             "target": {"id":target}
        //         })
        //     }
        // }

        var svg = d3.select("#svg-rv-2").attr("width", width).attr("height", height);

        svg.selectAll("*").remove();

        this.init_legend(svg)


        let div = d3.select('body')
            .append('div')
            .attr('id', 'tooltip')
            .style('opacity', 0)

        /* start to build graph */
        /* +引力  -斥力 */
        let simulation = d3
            .forceSimulation()
            .force(
                "link",
                d3.forceLink().id(function (d) {
                    return d.id;
                })
            )
            .force("charge", d3.forceManyBody().strength(force))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "r",
                d3
                    .forceRadial()
                    .radius(width / 2, height / 2)
                    .strength(0.01)
            );
        // .force("y", d3.forceY())

        /* 结束构造simulation*/


        /* 映射线条粗细的比例尺 */
        let scale = d3.scaleLinear().domain(d3.extent(links.map(d => {
            return d.goldenValue
        }))).range([1.5, 3])


        let link_g = svg
            .append('g')
            .attr("class", "links")
            .selectAll('g')
            .data(links)
            .enter()
            .append('g')


        let link, node, link_text

        /* 全局模式下隐藏id */
        if (mode) {

            /* 开始画点和线 */
            link = link_g
                .append("line")
                .style('stroke', function (d) {
                    return d.diff <= _this.state.threshold ? "rgb(154,151,151)" : 'red'
                })
                .style('stroke-width', function (d) {
                    return scale(d.goldenValue)
                })

            link_text = link_g
                .append('text')
                .attr('style', 'link_text')
                .text(function (d) {
                    return d.diff;
                })
            // .attr('dx','-10px')

            node = svg
                .append("g")
                .attr("class", "nodes")
                .selectAll('g')
                .data(nodes)
                .enter()
                .append('g')
                .on('mouseover', mouseover_circle)
                .on('mouseout', mouseout_circle)
                .on('click', click_circle)
                .on('dblclick', dblclick_circle)
                .call(
                    d3
                        .drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                );


            let circle = node
                .append("rect")
                .attr("width", rectWidth)
                .attr('height', rectHeight)
                .attr('rx', rx)
                .attr('ry', ry)
                .attr('transform', function () {
                    return `translate(${-rectWidth / 2},${-rectHeight / 2})`
                })
                .attr('fill', function (d) {
                    return d.position == 'head' ? 'orange' : (d.position == 'tail' ? 'pink' : '#d4dbff')
                })


            let hoverTrigger = node
                .append('circle')
                .attr('class', 'circle')
                .attr('r', lightRadius)

            let text = node
                .append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('dx', lightRadius * 2)
                .attr('dy', rectHeightHover / 2)
                .text(function (d) {
                    return d.id
                })
                .style('display', 'none')


            /* arrow line */
            svg
                .append("defs")
                .append("marker")
                .attr("id", "marker")
                .attr('width', 100)
                .attr('height', 100)
                .attr("viewBox", "0 -5 10 5")
                .attr("refX", 15)
                .attr("markerWidth", 4)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");
        }
        /* 局部模式下显示id */
        else {

            /* 开始画点和线 */
            link = link_g
                .append("line")
                .style('stroke', function (d) {
                    return d.diff <= _this.state.threshold ? "rgb(148,145,145)" : 'red'
                })
                .style('stroke-width', function (d) {
                    return scale(d.goldenValue)
                })


            node = svg
                .append("g")
                .attr("class", "nodes")
                .selectAll('g')
                .data(nodes)
                .enter()
                .append('g')
                .on('click', click_circle_local)
                .on('dblclick', dblclick_circle_local)
                .call(
                    d3
                        .drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                )
            // .each(function(d){console.log(d);})

            this.render_loop(node, link, svg)



            let circle = node
                .append("circle")
                .attr('class', 'circle_local')
                .attr("r", radius_local)
                .attr('fill', function (d) {
                    return `0x${d.id}` === _this.state.injectNode.id ? 'purple' : (d.position == 'head' ? 'orange' : (d.position == 'tail' ? 'pink' : '#d4dbff'))
                })

            // .attr('transform', function(){return `translate(${-rectWidth/2},${-rectHeight/2})`})

            let text = node
                .append('text')
                .attr('class', 'text_local')
                .attr('x', 0)
                .attr('y', 0)
                .attr('dx', -17)
                .attr('dy', 5)
                .text(function (d) {
                    return `0x${d.id}`
                })


            /* arrow line */
            svg
                .append("defs")
                .append("marker")
                .attr("id", "marker")
                .attr("viewBox", "0 -5 10 5")
                .attr("refX", radius_local * 2)
                .attr("markerWidth", 4)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");


            link_text = link_g
                .append('text')
                .attr('style', 'link_text')
                .text(function (d) {
                    return d.diff;
                })
                // .attr('dx','-20px')
                .attr('dy', '-3px')
                .style('font-size', '1em')
                .style('z-index', '999')

        }


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
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        global.d3 = d3

        //交互：tooltip  mouseover
        function mouseover_circle(d, i) {
            let _this = this.parentNode;

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)


        }

        function mouseout_circle(d, i) {


            if (!_this.state.click_flag) {
                d3.select(this)
                    .select('text')
                    .transition()
                    .duration(50)
                    .style('display', 'none')

                d3.select(this)
                    .select('rect')
                    .transition()
                    .duration(100)
                    .attr('width', rectWidth)
                    .attr('height', rectHeight)

            }


        }

        function click_circle(d) {
            _this.setState({click_flag: true})

            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'block')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidthHover)
                .attr('height', rectHeightHover)

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle(d) {

            _this.setState({click_flag: false})


            d3.select(this)
                .select('text')
                .transition()
                .duration(50)
                .style('display', 'none')

            d3.select(this)
                .select('rect')
                .transition()
                .duration(100)
                .attr('width', rectWidth)
                .attr('height', rectHeight)

            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }

        function click_circle_local(d) {

            let [gX, gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

            d3.select('#tooltip')
                .transition()
                .delay(50)
                .style('opacity', 0.9);
            d3.select('#tooltip')
                .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
                .style('left', `${Number(gX) - radius + 20}px`)
                .style("top", `${Number(gY) + rectHeightHover + paddingTop * 2 + overviewHieght}px`);
        }

        function dblclick_circle_local(d) {
            d3.select('#tooltip')
                .transition()
                .duration(50)
                .style('opacity', 0);
        }
    }


    clickLabel(d) {
        // console.log(this.state.clusterByKey);
        // console.log(this.state.clusterByKey[d.id]);
        this.drawRv1(this.state.clusterByKey[d.id], this.state.local_setting)
        this.setState({
            cluster: d.label,
            clusterId: d.id
        })
    }

    /*
    return {
        "goldenByKey_1": goldenByKey_1,
        "errByKey_1": errByKey_1
    }
    */
    initTxt_parseDiff_1(golden, err) {

        let linkKey, linkSeprt = "to", goldenByKey_1 = {}, errByKey_1 = {};

        axios.get(`../../statics/${golden}`)
            .then(txt => {
                txt = txt.data

                let links = txt.split(/[\n]+/).map((d, i) => {
                    let tem = d.split(/[\s->:?\s]+/);
                    return {
                        source: tem[0],
                        target: tem[1],
                        value: Number(tem[2]),
                    };
                });


                for (let i = 0; i < links.length; i++) {
                    linkKey = links[i].source + linkSeprt + links[i].target;
                    goldenByKey_1[linkKey] = links[i]
                }

                // console.log(goldenByKey_1);

                // let m = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.source) === false) {
                //     arr.push(cur.source);
                //     return arr;
                //   }
                //   return arr;
                // }, []);

                // let nodes = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.target) === false) {
                //     arr.push(cur.target);
                //     return arr;
                //   }
                //   return arr;
                // }, m);

                // nodes = nodes.map((d, i) => {
                //   return {
                //     id: d,
                //   };
                // });
                /* 结束构造数组 */
                //   console.log(nodes,links);
                this.setState({
                    goldenByKey_1: goldenByKey_1
                })

                global.goldenByKey_1 = goldenByKey_1

            })

        axios.get(`../../statics/${err}`)
            .then(txt => {
                txt = txt.data

                let links = txt.split(/[\n]+/).map((d, i) => {
                    let tem = d.split(/[\s->:?\s]+/);
                    return {
                        source: tem[0],
                        target: tem[1],
                        value: Number(tem[2]),
                    };
                });


                for (let i = 0; i < links.length; i++) {
                    linkKey = links[i].source + linkSeprt + links[i].target;
                    errByKey_1[linkKey] = links[i]
                }

                // let m = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.source) === false) {
                //     arr.push(cur.source);
                //     return arr;
                //   }
                //   return arr;
                // }, []);

                // let nodes = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.target) === false) {
                //     arr.push(cur.target);
                //     return arr;
                //   }
                //   return arr;
                // }, m);

                // nodes = nodes.map((d, i) => {
                //   return {
                //     id: d,
                //   };
                // });
                /* 结束构造数组 */
                //   console.log(nodes,links);
                this.setState({
                    errByKey_1: errByKey_1
                })
            })


//   return {
//       "goldenByKey_1": goldenByKey_1,
//       "errByKey_1": errByKey_1
//   }
    }


    initJson_parseLayout_1(structure) {

        axios.get(`../../statics/${structure}`)
            .then(json => {
                json = json.data;
                let clusterArr = [], nodesByKey = {}, edgesByKey = {}
                let clusterByKey = [], prefix = "$", clusterKey;
                let goldenByKey_1 = this.state.goldenByKey_1,
                    errByKey_1 = this.state.errByKey_1


                json.objects.map((d, i) => {
                    if (d.name.match(/^cluster/)) {
                        clusterArr.push(
                            {
                                '_gvid': d._gvid,
                                'id': d.name,
                                'nodes': d.nodes,
                                'edges': d.edges || undefined,
                                'color': d.color,
                                'label': d.label
                            }
                        )
                    } else {
                        nodesByKey[d._gvid] = {
                            '_gvid': d._gvid,
                            'id': d.name,
                            'label': d.label,
                            'shape': d.shape
                        }
                    }
                })

                json.edges.map((d, i) => {
                    edgesByKey[d._gvid] = {
                        "_gvid": d._gvid,
                        "source": d.tail,
                        "target": d.head,
                        'color': d.color || undefined,
                        "index": d.index
                    }
                })

                global.clusterArr = clusterArr
                global.nodesByKey = nodesByKey
                global.edgesByKey = edgesByKey

                this.setState({
                    clusterArr: clusterArr,
                    nodesByKey: nodesByKey,
                    edgesByKey: edgesByKey,
                })


                // console.log(clusterArr);
                // console.log(nodesByKey);
                for (let i = 0; i < clusterArr.length; i++) {
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
                            id: nodesByKey[d].id,
                            label: nodesByKey[d].label,
                            shape: nodesByKey[d].shape,
                            position: position
                        })
                    })
                    if (clusterArr[i].edges) {
                        clusterArr[i].edges.forEach(d => {
                            clusterByKey[clusterKey].links.push({
                                /* edgesByKey[d].target是“43” */
                                /* nodesByKey[edgesByKey[d].target].id是400472 */
                                'id': clusterKey,
                                'source': nodesByKey[edgesByKey[d].source].id,
                                "target": nodesByKey[edgesByKey[d].target].id,
                                "color": edgesByKey[d].color,
                                "index": edgesByKey[d].index,
                                "goldenValue":
                                    `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey_1 ?
                                        goldenByKey_1[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                                "errValue":
                                    `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in errByKey_1 ?
                                        errByKey_1[`${nodesByKey  [edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                                "diff":
                                    (`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey_1) && (`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in errByKey_1) ?
                                        Math.abs(errByKey_1[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value - goldenByKey_1[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value) : undefined,
                                "_gvid": edgesByKey[d]._gvid
                            })
                        })
                    }
                    clusterByKey[clusterKey].id = clusterArr[i].id;
                    clusterByKey[clusterKey].label = clusterArr[i].label;
                    clusterByKey[clusterKey].color = clusterArr[i].color;
                }


                global.clusterByKey = clusterByKey


                /* 最终数组 */
                // json(clusterByKey)
                this.setState({
                    clusterByKey: clusterByKey
                })


                /* 引入drawOverview画上面的视图 */
                this.drawOvVw1(clusterByKey)
                // this.drawOvVw2(clusterByKey)

                /* 引入drawRv1画下面的视图 */
                // this.drawRv1(clusterByKey,this.state.global_setting)

            })

    }


    initTxt_parseDiff_2(golden, err) {

        let linkKey, linkSeprt = "to", goldenByKey_2 = {}, errByKey_2 = {};

        axios.get(`../../statics/${golden}`)
            .then(txt => {
                txt = txt.data

                let links = txt.split(/[\n]+/).map((d, i) => {
                    let tem = d.split(/[\s->:?\s]+/);
                    return {
                        source: tem[0],
                        target: tem[1],
                        value: Number(tem[2]),
                    };
                });


                for (let i = 0; i < links.length; i++) {
                    linkKey = links[i].source + linkSeprt + links[i].target;
                    goldenByKey_2[linkKey] = links[i]
                }

                // console.log(goldenByKey_2);

                // let m = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.source) === false) {
                //     arr.push(cur.source);
                //     return arr;
                //   }
                //   return arr;
                // }, []);

                // let nodes = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.target) === false) {
                //     arr.push(cur.target);
                //     return arr;
                //   }
                //   return arr;
                // }, m);

                // nodes = nodes.map((d, i) => {
                //   return {
                //     id: d,
                //   };
                // });
                /* 结束构造数组 */
                //   console.log(nodes,links);
                this.setState({
                    goldenByKey_2: goldenByKey_2
                })

                global.goldenByKey_2 = goldenByKey_2

            })

        axios.get(`../../statics/${err}`)
            .then(txt => {
                txt = txt.data

                let links = txt.split(/[\n]+/).map((d, i) => {
                    let tem = d.split(/[\s->:?\s]+/);
                    return {
                        source: tem[0],
                        target: tem[1],
                        value: Number(tem[2]),
                    };
                });


                for (let i = 0; i < links.length; i++) {
                    linkKey = links[i].source + linkSeprt + links[i].target;
                    errByKey_2[linkKey] = links[i]
                }

                // let m = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.source) === false) {
                //     arr.push(cur.source);
                //     return arr;
                //   }
                //   return arr;
                // }, []);

                // let nodes = links.reduce((arr, cur) => {
                //   if (arr.includes(cur.target) === false) {
                //     arr.push(cur.target);
                //     return arr;
                //   }
                //   return arr;
                // }, m);

                // nodes = nodes.map((d, i) => {
                //   return {
                //     id: d,
                //   };
                // });
                /* 结束构造数组 */
                //   console.log(nodes,links);
                this.setState({
                    errByKey_2: errByKey_2
                })
            })


//   return {
//       "goldenByKey_2": goldenByKey_2,
//       "errByKey_2": errByKey_2
//   }
    }


    initJson_parseLayout_2(structure) {

        axios.get(`../../statics/${structure}`)
            .then(json => {
                json = json.data;
                let clusterArr = [], nodesByKey = {}, edgesByKey = {}
                let clusterByKey = [], prefix = "$", clusterKey;
                let goldenByKey_2 = this.state.goldenByKey_2,
                    errByKey_2 = this.state.errByKey_2


                json.objects.map((d, i) => {
                    if (d.name.match(/^cluster/)) {
                        clusterArr.push(
                            {
                                '_gvid': d._gvid,
                                'id': d.name,
                                'nodes': d.nodes,
                                'edges': d.edges || undefined,
                                'color': d.color,
                                'label': d.label
                            }
                        )
                    } else {
                        nodesByKey[d._gvid] = {
                            '_gvid': d._gvid,
                            'id': d.name,
                            'label': d.label,
                            'shape': d.shape
                        }
                    }
                })

                json.edges.map((d, i) => {
                    edgesByKey[d._gvid] = {
                        "_gvid": d._gvid,
                        "source": d.tail,
                        "target": d.head,
                        'color': d.color || undefined,
                        "index": d.index
                    }
                })

                global.clusterArr = clusterArr
                global.nodesByKey = nodesByKey
                global.edgesByKey = edgesByKey

                this.setState({
                    clusterArr: clusterArr,
                    nodesByKey: nodesByKey,
                    edgesByKey: edgesByKey,
                })


                // console.log(clusterArr);
                // console.log(nodesByKey);
                for (let i = 0; i < clusterArr.length; i++) {
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
                            id: nodesByKey[d].id,
                            label: nodesByKey[d].label,
                            shape: nodesByKey[d].shape,
                            position: position
                        })
                    })
                    if (clusterArr[i].edges) {
                        clusterArr[i].edges.forEach(d => {
                            clusterByKey[clusterKey].links.push({
                                /* edgesByKey[d].target是“43” */
                                /* nodesByKey[edgesByKey[d].target].id是400472 */
                                'id': clusterKey,
                                'source': nodesByKey[edgesByKey[d].source].id,
                                "target": nodesByKey[edgesByKey[d].target].id,
                                "color": edgesByKey[d].color,
                                "index": edgesByKey[d].index,
                                "goldenValue":
                                    `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey_2 ?
                                        goldenByKey_2[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                                "errValue":
                                    `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in errByKey_2 ?
                                        errByKey_2[`${nodesByKey  [edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                                "diff":
                                    (`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey_2) && (`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in errByKey_2) ?
                                        Math.abs(errByKey_2[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value - goldenByKey_2[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value) : undefined,
                                "_gvid": edgesByKey[d]._gvid
                            })
                        })
                    }
                    clusterByKey[clusterKey].id = clusterArr[i].id;
                    clusterByKey[clusterKey].label = clusterArr[i].label;
                    clusterByKey[clusterKey].color = clusterArr[i].color;
                }


                global.clusterByKey_2 = clusterByKey


                /* 最终数组 */
                // json(clusterByKey)
                this.setState({
                    clusterByKey_2: clusterByKey
                })



                /* 引入drawOverview画上面的视图 */
                // this.drawOvVw1(clusterByKey)
                this.drawOvVw2(clusterByKey)

                /* 引入drawRv1画下面的视图 */
                // this.drawRv1(clusterByKey,this.state.global_setting)

            })

    }


    initGUI() {

        //定义gui配置项
        const controls = new function () {
            this.threshold = 0
        }

        const gui = new dat.GUI();


        /* 在这里修改thrshold的range */
        /* 0, 100 */
        gui.add(controls, 'threshold', 0, 100).name('Diff Threshold').step(1).onFinishChange(threshold => {

            this.setState({
                threshold: threshold
            })
            this.drawRv1(this.state.clusterByKey[this.state.clusterId], this.state.local_setting)
            this.drawRv2(this.state.clusterByKey[this.state.clusterId], this.state.local_setting)
        })
    }

    render_loop(node, link, svg){
        // node.style('opacity','0.5')
        // link.style('opacity','0.5')

        axios.get(`../../statics/loops.json`)
            .then(loops=> {

                if(loops.data[`${this.state.clusterId}`]){


                let loop_arr = loops.data[`${this.state.clusterId}`].loops // 取到该clusterId下的所有loops

                function find_node_in_a_loop(id, loop) {
                    if (loop.nodes.indexOf(id) != -1) {
                        return false // id为id的node在该loop里是有的
                    }
                    return true
                }

                node.attr('class', function (d) {
                    let class_name = []
                    loop_arr.forEach(loop => {
                        if (find_node_in_a_loop(d.id, loop)) {
                            class_name.push(loop.name)
                        }
                    })
                    return class_name.join(' ')
                })

                link.attr('class',function(d){
                    let class_name = []
                    loop_arr.forEach(loop=>{
                        let source_to_target = loop.links.map(link=>{
                            return link.source.concat(link.target)
                        })

                        if(source_to_target.indexOf(d.source.id.concat(d.target.id))==-1){
                            class_name.push(loop.name)
                        }
                    })
                    return class_name.join(' ')
                })

                let loop_node = svg.append('g')
                    .attr('transform', `translate(525,120)`)
                    .selectAll('g')
                    .data(loop_arr)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        return `translate(0,${60 * i})`
                    })
                    .on('mouseover', function(d, i){
                        d3.select(this).select('circle').attr('r',28)
                        let class_name = d.name
                        d3.selectAll(`.${class_name}`)
                            .style('opacity', 0.3)
                    })
                    .on('mouseout', function(d, i){
                        d3.select(this).select('circle').attr('r',25)
                        let class_name = d.name
                        d3.selectAll(`.${class_name}`)
                            .style('opacity', 1)
                    })


                loop_node.append('circle')
                    .attr('fill', 'white')
                    .attr('r', 25)
                    .attr('class', 'loop_node')

                loop_node.append('text')
                    .text(function (d) {
                        return d.name
                    })
                    .attr('dx', -18)
                    .attr('dy', 5)
                    .attr('class', 'loop_text')


            }

            })
    }


    componentDidMount() {

        //左边视图的数据，上面计算diff，下面确定结构
        this.initTxt_parseDiff_1('LSG_1.txt','LSG_153.txt')
        this.initJson_parseLayout_1('bsort.json'); /* 内部调用了draw函数 */

        //右边视图的数据，上面计算diff，下面确定结构
        this.initTxt_parseDiff_2('L_1.txt','L_153.txt')
        this.initJson_parseLayout_2('bsort.json'); /* 内部调用了draw函数 */



        this.initGUI()


    }

    render() {

        let itemCardColor = ["#d54062", "#ffa36c", "#ebdc87", "#799351", "#557571", "#d49a89", "#a3d2ca", "#5eaaa8", "#056676", "#d8d3cd"]


        return (
            <div id="root">
                <div className='overview-container'>
                    <svg id="svg-overview"></svg>
                </div>

                <div className="svg-container container-1">
                    <svg id="svg-rv-1"></svg>
                    <h3>{this.state.cluster_1}</h3>
                </div>

                <div className="svg-container container-2">
                    <svg id="svg-rv-2"></svg>
                    <h3>{this.state.cluster_2}</h3>
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
