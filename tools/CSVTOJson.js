const csv = require('csvtojson');
const mysql=require('mysql');

let connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    port:'3306',
    database:'linedata'
});

connection.connect();
 
const converter = csv()
  .fromFile('./tools/Data.csv')
  .then((json) => {
      console.log(json[0]);
      let sql="insert into data values(?,?,?)";

      for(let i=0;i<150000;i++){
          let params=[];
          params.push(json[i].name);
          params.push(i);
          params.push(json[i].high);

          connection.query(sql,params,(err)=>{
              if(err){
                  return;
              }
          })

      }
  });
