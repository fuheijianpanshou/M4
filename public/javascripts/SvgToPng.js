function saveToPng(selection,pngName){
    SVGConverter.loadFromElement(selection.node()).then((converter) => {
       dataURLtoFile(converter.pngDataURL(),pngName);
       let imgBox=d3.select("#imgBox");
       imgBox.append("img")
        .attr("src",converter.pngDataURL())
        .attr("width","300px");
       selection.remove();
       
      });
}
/**
 * Blob上传到服务器
 * @param {} dataurl 
 */
function BlobUpload(dataurl){
    let blobFile=dataURLtoBlob(dataurl);
    console.log(blobFile);
    let formData=new FormData();
    formData.append("file",blobFile,"1.png");

    $.ajax({
        headers: {
            "Accept": "text/plain; charset=utf-8",
            "Content-Type": "text/plain; charset=utf-8"
        },
        url:"http://localhost:3000/filepost",
        dataType:"image/png",
        type:"post",
        data:formData,
        processData:false,
        contentType:false,
        error:(res)=>{
            alert(res.desc);
            return;
        },
        success:(res)=>{
            alert(res.desc);
            return;
        }
    });

}
/**
 * 将base64转换为文件上传到服务器
 * @param {*} dataurl 
 * @param {*} filename 
 */
function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    let fe=new File([u8arr], filename,{type:mime});
    let formData=new FormData();
    formData.append("file",fe);

    $.ajax({
        url:"http://localhost:3000/filepost",
        dataType:"image/png",
        type:"post",
        data:formData,
        processData:false,
        contentType:false,
        error:(res)=>{
            return;
        },
        success:(res)=>{
            return;
        }
    });

    
    console.log(fe);
}
/**
 * dataUrl转为Blob
 * @param {*} dataurl 
 */
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(',');
     //注意base64的最后面中括号和引号是不转译的   
     var _arr = arr[1].substring(0,arr[1].length-2);
     var mime = arr[0].match(/:(.*?);/)[1],
         bstr =atob(_arr),
         n = bstr.length,
         u8arr = new Uint8Array(n);
     while (n--) {
         u8arr[n] = bstr.charCodeAt(n);
     }
     return new Blob([u8arr], {
         type: mime
     });
 }