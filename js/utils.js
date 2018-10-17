function getRatio() {
    var canvas = $('<canvas></canvas>');
    let context = canvas[0].getContext('2d');
    
    // 屏幕的设备像素比
    var devicePixelRatio = window.devicePixelRatio || 1;

    // 浏览器在渲染canvas之前存储画布信息的像素比
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
                        context.mozBackingStorePixelRatio ||
                        context.msBackingStorePixelRatio ||
                        context.oBackingStorePixelRatio ||
                        context.backingStorePixelRatio || 1;

    // canvas的实际渲染倍率
    return devicePixelRatio / backingStoreRatio;
}
function resetCanvasRatio($canvas, width, height, ratio) {
    $canvas.css({
        width,
        height
    });

    $canvas.attr({
        width: width * ratio,
        height: height * ratio
    });
}
