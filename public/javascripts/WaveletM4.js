document.getElementById("submitBtn").addEventListener("click", getInfoFromSer);
//var width = 500;
var svgWidth = 600;
let currentWaveletData = [];
var historyWaveletData = [];
var historyProps=[];
var props={};

function initProps(width){
    props.start=0;
    props.end=2 ** Math.ceil(Math.log2(width))-1;
    props.level=Math.ceil(Math.log2(width));
    props.offsetX=0;
    props.preK=0;
    props.nowK=0;
    props.dataWidth=2 ** Math.ceil(Math.log2(width));
}

/**
 * 从服务器获取初始化数据
 */
function getInfoFromSer() {
    width = parseInt(document.getElementById("inputWidth").value);
    initProps(width);
    $.ajax({
        url: "http://localhost:3000/initwaveletinfo" + "?width=" + width,
        type: "GET",
        headers: {
            "Accept": "text/plain; charset=utf-8",
            "Content-Type": "text/plain; charset=utf-8"
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (textStatus == "error") {
                alert(textStatus + " : " + errorThrown);
            } else {
                alert(textStatus);
            }
        },
        success: function (data, textStatus, jqXHR) {
            initialDataProcesser(data);
        }
    });

}
//data=[[21,-1,12,-6,-10,-2,-8,5,-5,5,5,-1,1,7,-3,5],[4,-2,1,-5,-10,-3,-2,7,-5,5,-2,-1,1,-7,-3,5],[5,-2,1,-11,-15,-3,-1,2,-5,5,-2,-1,1,-7,-3,5],[11,-3,7,4,-5,-2,-9,10,-5,5,-2,-1,1,-7,-3,5]];
//initialDataProcesser(data);
/**
 * 进行逆变换
 * @param {wavelet data} data 
 */
function initialDataProcesser(data) {
    let minT = data[0];
    let minV = data[1];
    let maxV = data[2];//[10, -1, 4, -6, -2, -2, 2, 8]
    let maxT = data[3];
    for (let i = 0; i < Math.log2(maxV.length); i++) {
        let tempMaxV = [];
        let tempMaxT = [];
        let tempMinV = [];
        let tempMinT = []
        for (let j = 0; j < 2 ** i; j++) {
            if (maxV[j + 2 ** i] >= 0) {
                tempMaxV.push(maxV[j]);
                tempMaxV.push(maxV[j] - maxV[j + 2 ** i]);
            } else {
                tempMaxV.push(maxV[j] + maxV[j + 2 ** i]);
                tempMaxV.push(maxV[j]);
            }
            if (minV[j + 2 ** i] >= 0) {
                tempMinV.push(minV[j] + minV[j + 2 ** i]);
                tempMinV.push(minV[j]);
            } else {
                tempMinV.push(minV[j]);
                tempMinV.push(minV[j] - minV[j + 2 ** i]);
            }
            tempMinT.push(minT[j]);
            tempMinT.push(minT[j] - minT[j + 2 ** i]);
            tempMaxT.push(maxT[j] + maxT[j + 2 ** i]);
            tempMaxT.push(maxT[j]);
        }
        maxV = [...tempMaxV, ...maxV.slice(2 ** (i + 1))];
        maxT = [...tempMaxT, ...maxT.slice(2 ** (i + 1))];
        minV = [...tempMinV, ...minV.slice(2 ** (i + 1))];
        minT = [...tempMinT, ...minT.slice(2 ** (i + 1))];
    }
    let m4Data = [];
    m4Data.push(minT);
    m4Data.push(minV);
    m4Data.push(maxV);
    m4Data.push(maxT);
    m4ToPathData(m4Data, 0);

}
/**
 * 添加x坐标
 * @param {m4数据} data 
 */
function m4ToPathData(data, flag) {
    currentWaveletData=data;
    let readyData = [];
    for (let i = 0; i < width; i++) {
        readyData.push([i, data[0][i]]);
        readyData.push([i, data[1][i]]);
        readyData.push([i, data[2][i]]);
        readyData.push([i, data[3][i]]);
    }
    if (flag == 0) {
        drawPath(readyData);
    } else {
        updatePath(readyData);
    }
}
/**
 * 更新Path
 * @param {坐标数据} readyData 
 */
function updatePath(readyData) {
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(readyData, (d) => {
            return d[1];
        })])
        .range([530, 0]);
    let path = d3.line()
        .y((d) => {
            return yScale(d[1]);
        })
    d3.select("#path")
        .attr("d",path(readyData));
}

/**
 * 绘制Path
 * @param {坐标数据} data 
 */
function drawPath(data) {
    d3.select("#mainSvg").remove();
    let zoom = d3.zoom()
        .on("zoom", zoomed);
    let svg = d3.select("#contentBox")
        .append("svg")
        .attr("id", "mainSvg")
        .attr("width", svgWidth)
        .attr("height", 600)
        .on("mousemove", mouseMove)
        .call(zoom);

    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(data, (d) => {
            return d[1];
        })])
        .range([530, 0]);

    let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(20);


    let g = svg.append("g")
        .attr("transform", "translate(60,60)");
    g.append("g")
        .attr("transform", "translate(0,0)")
        .call(yAxis);

    let path = d3.line()
        .y((d) => {
            return yScale(d[1]);
        })

    g.append("path")
        .attr("id", "path")
        .attr("d", path(data))
        .attr("stroke", "red")
        .attr("str1oke-width", 1)
        .attr('fill', "none")
        .attr("transform", "translate(3,0)");
}
var preK = 0;//保存缩放比例


/**
 * 获取缩放比例，向服务器发出difference 请求
 */
function zoomed() {
    let nowK = Math.floor(Math.log2(d3.event.transform.k));
    if(nowK<preK){
        console.log("zoom in");
        if(historyProps.length>0){
            preK=nowK;
            props=historyProps.pop();
            currentWaveletData=historyWaveletData.pop();
            m4ToPathData(currentWaveletData,1);
        }else{
            alert("run out");
        }
       
    }
    if (nowK > preK) {
        props.preK = preK;
        props.nowK = nowK;
        preK = nowK;
        $.ajax({
            url: "http://localhost:3000/progressiveinfo",
            type: "GET",
            headers: {
                "Accept": "text/plain; charset=utf-8",
                "Content-Type": "text/plain; charset=utf-8"
            },
            data: props,
            error: function (jqXHR, textStatus, errorThrown) {
                if (textStatus == "error") {
                    alert(textStatus + " : " + errorThrown);
                } else {
                    alert(textStatus);
                }
            },
            success: function (data, textStatus, jqXHR) {
                if (data == 'c001') {
                    alert("放大极限");
                    return;
                }
                let sameInfo=data.shift();
               
                let focusPoint = parseInt(sameInfo[0]);
                let nextStart = focusPoint - props.dataWidth / 4;
                let nextEnd = focusPoint + props.dataWidth / 4 - 1;
                if (nextStart <= 0) {
                    nextStart = 0;
                    nextEnd = props.dataWidth / 2 - 1;
                    console.log("left！")
                }
                if(nextEnd>=props.dataWidth-1){
                    nextEnd=props.dataWidth-1;
                    nextStart=props.dataWidth/2;
                    console.log("right!")
                }
                
                props.start = parseInt(sameInfo[1]);
                props.end = props.start+props.dataWidth-1;
                props.level++;
                progressiveWaveletTransfrom(data, nextStart, nextEnd);
            }
        });

    }
}
/**
 * 监听鼠标移动获取focus
 */
function mouseMove() {
    if(d3.event.screenX<=63){
        props.offsetX=0;
    }
    else if (d3.event.screenX >=width + 63) {
        props.offsetX = width
        
    } else {
        props.offsetX = d3.event.screenX - 63;
    }

}

/**
 * 
 * @param {详细数据}} difference 
 * @param {当前数据进行还原的起始点} start 
 * @param {当前数据进行还原的结束点} end 
 */
function progressiveWaveletTransfrom(difference, start, end) {
   

    let m4Data = [];
    for (let i = 0; i < 4; i++) {
        let hisData = currentWaveletData[i].slice(start, end + 1);
        
        let temp = [];
        if (i == 0) {
            for (let j = 0; j < hisData.length; j++) {
                temp.push(hisData[j]);
                temp.push(hisData[j] - difference[i][j]);
            }
            m4Data.push(temp);
        } else if (i == 1) {
            for (let j = 0; j < hisData.length; j++) {
                if (difference[i][j] >= 0) {
                    temp.push(difference[i][j] + hisData[j]);
                    temp.push(hisData[j]);
                } else {
                    temp.push(hisData[j]);
                    temp.push(hisData[j] - difference[i][j]);
                }
            }
            m4Data.push(temp);
        } else if (i == 2) {
            for (let j = 0; j < hisData.length; j++) {
                if (difference[i][j] >= 0) {
                    temp.push(hisData[j]);
                    temp.push(hisData[j] - difference[i][j]);
                } else {
                    temp.push(hisData[j] + difference[i][j]);
                    temp.push(hisData[j]);
                }
            }
            m4Data.push(temp);

        } else {
            for (let j = 0; j < hisData.length; j++) {
                temp.push(hisData[j] + difference[i][j]);
                temp.push(hisData[j]);
            }

            m4Data.push(temp);
        }
    }
    historyWaveletData.push(m4Data);
    let temp={};
    temp.dataWidth=props.dataWidth;
    temp.end=props.end;
    temp.level=props.level;
    temp.nowK=props.nowK;
    temp.offsetX=props.offsetX;
    temp.preK=props.preK;
    temp.start=props.start;
    historyProps.push(temp);
    
    m4ToPathData(m4Data, 1);
}
