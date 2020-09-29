let mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'linedata'
});

connection.connect();

const getRawDataSql="select v from data";
const waveletSql="insert into waveletdata(flag,mint,minv,maxv,maxt) values(?,?,?,?,?)";

connection.query(getRawDataSql,(err,result)=>{
    if(err){
        return;
    }
    let tempRawData=[];
    result.forEach(element => {
        tempRawData.push(element.v);
    });
    let tempRawDatalen=tempRawData.length;
    let tempMinT=waveletTransform(tempRawData,tempRawDatalen,0);
    let tempMinV=waveletTransform(tempRawData,tempRawDatalen,1);
    let tempMaxV=waveletTransform(tempRawData,tempRawDatalen,2);
    let tempMaxT=waveletTransform(tempRawData,tempRawDatalen,3);
 
    for(let i=0;i<tempMinT.length;i++){
        let params=[];
        params.push(i);
        params.push(tempMinT[i]);
        params.push(tempMinV[i]);
        params.push(tempMaxV[i]);
        params.push(tempMaxT[i]);
        connection.query(waveletSql,params,(err,result)=>{
            if(err){
                return;
            }
        })

    }
    
})
function waveletTransform(tempRawData, dataAmount, flag) {
    let tempV = [];
    let tempBarrelArray = [];
    tempV = tempRawData.slice(0,2**Math.floor(Math.log2(dataAmount)));
    for (let i = Math.floor(Math.log2(dataAmount)); i > 0; i--) {
        let tempNodeArray = [];
        let count = 0;
        for (let j = 0; j < 2 ** i; j += 2) {
            tempNodeArray.push(tempV[j] - tempV[j + 1]);
            if (flag == 0) {
                tempV[count++] = tempV[j];
            } else if (flag == 1) {
                if (tempV[j] < tempV[j + 1]) {
                    tempV[count++] = tempV[j];
                } else {
                    tempV[count++] = tempV[j + 1];
                }
            } else if (flag == 2) {
                if (tempV[j] >= tempV[j + 1]) {
                    tempV[count++] = tempV[j];
                } else {
                    tempV[count++] = tempV[j + 1];
                }
            } else if (flag == 3) {
                tempV[count++] = tempV[j + 1];
            } else {
                throw new Error("current flag value is unexpected!");
            }
        }
        tempV = tempV.splice(0, count);
        tempBarrelArray.unshift(tempNodeArray);
    }
    tempV = tempV.splice(0, 1);
    tempBarrelArray.forEach((item) => {
        item.forEach((item1) => {
            tempV.push(item1);
        })
    });
    return tempV;
}


