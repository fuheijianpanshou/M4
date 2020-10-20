const width = 1500;
const height = 500;
const padding = { top: 60, bottom: 60, left: 60, right: 60 };
let param;



/**
 * 绘制M4数据的图形
 * @param {数据库中的result} data 
 * @param {*} params 
 */
function drawChart(data, params) {
    let svg = d3.select("body").select("svg");
    if (svg == null) {
    } else {
        svg.remove();
    }

    svg = d3.select("body").append("svg")
        .attr("class", "mainSvg")
        .attr("id", "mainSvg")
        .attr("width", width)
        .attr("height", height)

    let g = svg.append("g")
        .attr("class", "mainG")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
    //.call(zoom);

    let zoom = d3.zoom(d3.select(".mainG"))
        .on("zoom", zoomed)
        .on("end", zoomEnd)
        // .transform(() => d3.event.transform, () => {
        //     let temp = [];
        //     temp.push(d3.event.x)
        //     temp.push(d3.event.y);
        //     return temp;
        // })
    //.extent([[100,100],[200,200]]);

    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(data, (d) => {
            return d.v;
        })])
        .range([height - padding.top - padding.bottom, 0]);

    let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(20);
    let linePath = d3.line()
        .y((d) => {
            return yScale(d[1]);
        });
    g.append("g")
        .attr("transform", "translate(" + padding.left + "," + 0 + ")")
        .call(yAxis);

    let formatData = dataConvert(data, params);
    let pathData = linePath(formatData);

    g.append("path")
        .attr("class", "m4Path")
        .attr("transform", "translate(" + (padding.left + 10) + "," + 0 + ")")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("d", pathData);

}


/**
 * 将数据转换为M4可绘制的数据
 * @param {数据库中获取的result} data 
 * @param {用户指定的宽度、开始、结束时间} params 
 */
function dataConvert(data, params) {
    let pathData = [];
    console.log(params);
    for (let i = 0; i < data.length; i++) {
        let temp = [];
        temp.push(Math.round(params.width * (data[i].t - params.tStart) / (params.tEnd - params.tStart)));
        temp.push(data[i].v);
        pathData.push(temp);
    }
    return pathData;
}

/**
 * 将数据转换为可绘制详细图像的数据格式
 * @param {数据库中获取result} data 
 */
function detailDataProcesser(data) {
    let pathData = [];

    for (let i = 0; i < data.length; i++) {
        let temp = [];
        temp.push(i);
        temp.push(data[i].v);
        pathData.push(temp);
    }
    return pathData;

}

d3.select("#show_window")
    .on("click", () => {
        addWindow({ width: document.getElementById("input_width").value, tStart: document.getElementById("input_tstart").value, tEnd: document.getElementById("input_tend").value }, d3.event);
    });
d3.select("#show_drag_window")
    .on("click", () => {
        addDragWindow({ width: document.getElementById("input_width").value, tStart: document.getElementById("input_tstart").value, tEnd: document.getElementById("input_tend").value });
    })

var isWindowShow = false;
var windowRect;


/**
 * 添加窗口，并计算窗口区间内的时间
 * @param {窗口宽度、开始时间、结束时间} params 
 * @param {*} event 
 */
function addWindow(params, event) {
    let selectWindow = null;
    if (isWindowShow) {
        isWindowShow = false;
        document.getElementById("show_window").innerText = "Window";
        d3.select("body")
            .on("mousemove", null);

        d3.select("svg").select(".winRect")
            .remove();

        d3.select("svg").select(".detailG").remove();

    } else {
        isWindowShow = true;
        selectWindow = d3.select("svg")
            .append("rect")
            .attr("class", "winRect")
            .attr("x", event.x)
            .attr("y", event.y)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("width", parseInt(params.width * params.width / (params.tEnd - params.tStart)))
            .attr("height", 500);


        let tStart1;
        let tEnd1;


        d3.select("body")
            .on("mousemove", () => {
                selectWindow
                    .attr("x", () => {
                        if (d3.event.x > (2 * padding.left + 10)) {
                            return d3.event.x;
                        } else {
                            return parseInt(2 * padding.left + 10);
                        }
                    });
                // console.log(params.tStart+" "+params.tEnd+" "+params.width+" "+d3.event.x+" "+padding.left);
                tStart1 = parseInt(params.tStart) + (parseInt(d3.select(".winRect").attr("x")) - 2 * parseInt(padding.left) + 10) * Math.round((params.tEnd - params.tStart) / params.width);
                tEnd1 = parseInt(params.tStart) + (parseInt(d3.select(".winRect").attr("x")) - 2 * parseInt(padding.left) + 10 + parseInt(params.width * params.width / (params.tEnd - params.tStart))) * ((params.tEnd - params.tStart) / params.width);

                //console.log("ts"+tStart1+"te"+tEnd1);



            })
            .on("dblclick", () => {
                if (isWindowShow) {
                    $.ajax({
                        url: "http://localhost:3000/detail" + "?tStart=" + tStart1 + "&" + "tEnd=" + tEnd1,
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
                            pngName = tStart1 + "-" + tEnd1 + ".png";
                            addDetailBox(data, pngName, params);
                        }
                    });

                }

            })

        document.getElementById("show_window").innerText = "cancel";

    }


}



/**
 * 在M4基础上绘制与width相同像素的图像
 * @param {*} data 
 */
function addDetailBox(data, pngName, params) {
    d3.select(".mainSvg").select(".detailG").remove();

    let g = d3.select(".mainSvg").append("g")
        .attr("class", "detailG")
        .attr("transform", "translate(" + (padding.left + 10) + "," + (padding.top) + ")");
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(data, (d) => {
            return d.v;
        })])
        .range([height - padding.top - padding.bottom, 0]);

    let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(20);
    let linePath = d3.line()
        .y((d) => {
            return yScale(d[1]);
        });

    let formatData = detailDataProcesser(data);
    let pathData = linePath(formatData);
    g.append("g")
        .attr("transform", "translate(" + (padding.left + 15) + "," + 0 + ")")
        .attr("opacity", 0.5)
        .call(yAxis);
    g.append("path")
        .attr("transform", "translate(" + (padding.left + 20) + "," + 0 + ")")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("d", pathData);

    createTempSvg("a" + pngName.split(".")[0], data, params);
    // saveToPng(d3.select("#a"+pngName.split("."[0])), pngName);
    // d3.select("#a"+pngName.split("."[0])).remove();



}
/**
 * 添加临时透明的svg用于生成png
 */
function createTempSvg(svgId, data, params) {
    d3.select("#" + svgId).remove();

    let svg = d3.select("body").append("svg")
        .attr("id", svgId)
        .attr("width", params.width)
        .attr("height", 400);
    //       .attr("visibility", "hidden");

    let g = svg.append("g")
        .attr("transform", "translate(" + (0) + "," + (0) + ")");
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => {
            return d.v;
        })])
        .range([400, 0]);

    let linePath = d3.line()
        .y((d) => {
            return yScale(d[1]);
        });

    let formatData = detailDataProcesser(data);
    let pathData = linePath(formatData);
    g.append("path")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("d", pathData);
    let pngName = svgId + ".png";

    saveToPng(svg, pngName);
}

var isDragWindowShow = false;

function addDragWindow(params) {
    if (isDragWindowShow) {
        isDragWindowShow = false;
        d3.select("#imgBox").remove();
        document.getElementById("show_drag_window").innerText = "dragWindow";
        d3.select("svg").select(".dragWinRect")
            .remove();
    } else {
        document.getElementById("show_drag_window").innerText = "cancel";
        isDragWindowShow = true;
        var dragWindow = d3.select("svg")
            .append("rect")
            .attr("class", "dragWinRect")
            .attr("id", "ddd")
            .attr("x", 500)
            .attr("y", 50)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("strok-width", 1)
            .attr("width", parseInt(params.width * params.width / (params.tEnd - params.tStart)))
            .attr("height", 430);
        let minWidth = parseInt(params.width * params.width / (params.tEnd - params.tStart));

        d3.select(".mainSvg")
            .on("mousedown", () => {
                if (Math.abs(d3.event.x - dragWindow.attr("x") <= 15)) {
                    let oldX = parseInt(dragWindow.attr("x"));
                    let oldWidth = parseInt(dragWindow.attr("width"));
                    d3.select(".mainSvg")
                        .on("mousemove", () => {
                            if (d3.event.x > (oldX + oldWidth - minWidth)) {
                                return;
                            } else {
                                dragWindow.attr("x", d3.event.x)
                                    .attr("width", () => {
                                        return ((oldX - parseInt(d3.event.x)) + oldWidth);
                                    });
                            }

                        });
                } else if (Math.abs(parseInt(d3.event.x) - (parseInt(dragWindow.attr("x")) + parseInt(dragWindow.attr("width")))) <= 15) {
                    let oldX = parseInt(dragWindow.attr("x"));
                    let oldWidth = parseInt(dragWindow.attr("width"));
                    d3.select(".mainSvg")
                        .on("mousemove", () => {
                            if (d3.event.x < oldX + minWidth) {
                                return;
                            } else {
                                dragWindow.attr("width", () => {
                                    return parseInt(d3.event.x) - oldX;
                                });
                            }

                        });
                }
            })
            .on("mouseup", () => {
                d3.select(".mainSvg")
                    .on("mousemove", null);
            });
    }
}

function sendDragInfo() {
    let width = document.getElementById("input_width").value;
    let tStart = document.getElementById("input_tstart").value;
    let tEnd = document.getElementById("input_tend").value;
    let params = {
        width: width,
        tStart: tStart,
        tEnd: tEnd
    };
    param = params;
    if (isDragWindowShow) {
        tStart1 = parseInt(params.tStart) + (parseInt(d3.select(".dragWinRect").attr("x")) - 2 * parseInt(padding.left) + 10) * Math.round((params.tEnd - params.tStart) / params.width);
        tEnd1 = tStart1 + parseInt(d3.select(".dragWinRect").attr("width")) * ((params.tEnd - params.tStart) / params.width);
        let timeCount = 0;
        for (let i = tStart1; i <= tEnd1; i += parseInt(width)) {
            setTimeout("setDragInfoTimeout(" + i + ")", timeCount * 1000);
            timeCount++;
        }
    } else {
        return;
    }
    let body = document.getElementsByTagName("body");
    let imgBox = document.createElement("div");
    imgBox.style = "width: 100%;margin-top: 10px;margin-bottom: 30px;white-space: nowrap;overflow-x: auto;-webkit-overflow-scrolling:touch;";
    imgBox.id = "imgBox";
    body[0].appendChild(imgBox);
}

function setDragInfoTimeout(i) {
    i = parseInt(i);
    $.ajax({
        url: "http://localhost:3000/detail" + "?tStart=" + i + "&" + "tEnd=" + (i + parseInt(width) - 1),
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
            pngName = i + "-" + (i + parseInt(width) - 1) + ".png";
            let svgId = "a" + i + "-" + (i + parseInt(width) - 1);
            createTempSvg(svgId, data, param);

        }
    });

}

function zoomed() {
    console.log(d3.event);
    d3.select(".mainG")
        .attr("transform", d3.event.transform);
    //d3.event.preventDefault();
}

function zoomEnd() {

}
