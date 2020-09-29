let fs = require("fs");
PNG = require("pngjs").PNG;
let Canvas=require("canvas");

// fs.createReadStream("./public/images/a21800-23299.png")
//     .pipe(new PNG({
//         filterType:4
//     }))
//     .on("parsed",function(){
//         for(let y=0;y<this.height;y++){
//             for(let x=0;x<this.width;x++){
//                 console.log("data:"+this.data);
//                 console.log((this.width*y+x));
//                 let idx=(this.width*y+x)<<2;
//                 console.log(idx);
//                 this.data[idx]=255-this.data[idx];
//                 this.data[idx+1]=255-this.data[idx+1];
//                 this.data[idx+2]=255-this.data[idx+2];


//             }
//         }
//     })
let canvas=new Canvas();
canvas.height = 500;
canvas.width = 1000;
let ctx=canvas.getContext("2d");

let img=new Image;
img.onload=()=>{
    ctx.drawImage(img,0,0);
    console.log(ctx.getImageData().data);
}
img.src="./public/images/a21800-23299.png";
