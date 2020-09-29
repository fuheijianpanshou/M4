function svgToPng(svgTarget,pngWidth,pngHeight){
    let serializer=new XMLSerializer();
    let source="<?xml version='1.0' standalone='no'?>\r\n"+serializer.serializeToString(svgTarget.node());
    let image=new Image;

    image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

    let canvas=document.createElement("canvas");
    canvas.width=pngWidth;
    canvas.height=pngHeight;

    let context=canvas.getContext("2d");
    context.fillStyle="#fff";
    context.fillRect(0,0,10000,10000);
    context.drawImage(image,0,0);
    return canvas.toDataURL("image/png");
}

function pngGenerator(svgTarget,width,height){
    console.log(svgToPng(svgTarget,width,height));
}