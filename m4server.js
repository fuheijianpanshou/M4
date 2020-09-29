let express = require('express');
let mysql = require('mysql');
var path = require('path');
let fs = require('fs');
const multiparty = require('multiparty');
const { config } = require('process');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'linedata'
});

connection.connect();

let app = express();
app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/m4', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    let sql = "with Q as(select t,v from data where t>=? and t<=?)\nselect t,v from Q join (select round(?*(t-?)/(?-?)) as k,min(v) as v_min,max(v) as v_max,min(t) as t_min,max(t) as t_max from data group by k) as QA on k=round(?*(t-?)/(?-?)) and (v=v_min or v=v_max or t=t_min or t=t_max)"; let params = [];
    let query = req.query;
    params.push(parseInt(query.tStart));
    params.push(parseInt(query.tEnd));
    params.push(parseInt(query.width));
    params.push(parseInt(query.tStart));
    params.push(parseInt(query.tEnd));
    params.push(parseInt(query.tStart));
    params.push(parseInt(query.width));
    params.push(parseInt(query.tStart));
    params.push(parseInt(query.tEnd));
    params.push(parseInt(query.tStart));

    connection.query(sql, params, function (err, result) {
        if (err) {
            return;
        }
        //res.write("first result!");
        res.send(result);
    });
});

app.get('/initwaveletinfo', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    let sql = "select mint,minv,maxv,maxt from waveletdata where flag<?";
    let params = [];
    params.push(2 ** (Math.ceil(Math.log2(parseInt(req.query.width)))));
    console.log(params);
    connection.query(sql, params, (err, result) => {
        if (err) {
            return;
        }
        let minT = [];
        let minV = [];
        let maxV = [];
        let maxT = [];

        result.forEach(element => {
            minT.push(element.mint);
            minV.push(element.minv);
            maxV.push(element.maxv);
            maxT.push(element.maxt);
        });
        let readyData = [];
        readyData.push(minT);
        readyData.push(minV);
        readyData.push(maxV);
        readyData.push(maxT);
        res.send(readyData);
    });
});
app.get('/progressiveinfo', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    let countSql = "select count(*) from waveletdata";
    let waveletLevel = 0;
    connection.query(countSql, (err, result) => {
        waveletLevel = Math.log2(parseInt(result[0]['count(*)']));
        let sql = 'select mint,minv,maxv,maxt from waveletdata where flag>=? and flag<=?';
        let query = req.query;
        console.log("progressiveQuery:");
        console.log(query);
        let dataWidth = parseInt(query.dataWidth);
        let start = parseInt(query.start);
        let currentLevel = parseInt(query.level);
        if (currentLevel >= waveletLevel) {

            res.send("c001");
            return;
        } else {
            let end = parseInt(query.end);
            let offsetX = parseInt(query.offsetX);
            let focusPoint = start + offsetX;
            let nextStart = focusPoint - dataWidth / 4;
            let nextEnd = focusPoint + dataWidth / 4 - 1;
            if (nextStart <= start) {
                nextStart = start;
                nextEnd = start + dataWidth / 2 - 1;
            }
            if (nextEnd >= end) {
                nextEnd = end;
                nextStart = end - dataWidth / 2 + 1;
                console.log("right!")
            }
            let flagStart = nextStart + 2 ** currentLevel;
            let flagEnd = nextEnd + 2 ** currentLevel;
            let newStart = (flagStart - 2 ** currentLevel) * 2;
            let params = [];
            params.push(flagStart);
            params.push(flagEnd);
            connection.query(sql, params, (err, result) => {
                if (err) {
                    throw new Error("progressing failed");
                }
                let minT = [];
                let minV = [];
                let maxV = [];
                let maxT = [];
                result.forEach(element => {
                    minT.push(element.mint);
                    minV.push(element.minv);
                    maxV.push(element.maxv);
                    maxT.push(element.maxt);
                });
                let readyData = [];
                let sameInfo = [];
                sameInfo.push(offsetX);
                sameInfo.push(newStart);
                readyData.push(sameInfo);
                readyData.push(minT);
                readyData.push(minV);
                readyData.push(maxV);
                readyData.push(maxT);
                // console.log("progressive:"+minT.length);
                // console.log(readyData);
                res.send(readyData);
            });
        }
    });
})

app.get("/detail", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");


    let sql = "select t,v from data where t>=? and t<=?";

    let query = req.query;

    let params = [];
    params.push(query.tStart);
    params.push(query.tEnd);

    connection.query(sql, params, (err, result) => {
        if (err) {
            return;
        }
        res.send(result);

    });
});

/**
 * 测试xhr使用
 */
app.get("/testget", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    let sql = "select t,v from data where t>=1 and t<=100000";

    connection.query(sql, (err, result) => {
        if (err) {
            throw new Error(err);
        }

        //res.write("progress test")
        res.send(result);
    })
});

app.post("/filepost", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200);

    let form = new multiparty.Form();
    form.encoding = "utf-8";
    form.uploadDir = './public/images';

    form.parse(req, function (err, fields, files) {
        console.log(files);
        try {
            let inputFile = files.file;
            let newPath = form.uploadDir + "/" + inputFile[0].originalFilename;
            // 同步重命名文件名 fs.renameSync(oldPath, newPath)
            //oldPath  不得作更改，使用默认上传路径就好
            console.log(inputFile.path);
            fs.renameSync(inputFile[0].path, newPath);
            res.send({ data: "上传成功！" });
        } catch (err) {
            console.log(err);
            res.send("失败");
        };
    });

});

app.listen(3000, function () {
    console.log("server started")
});