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
function pointToSegDist(point, startPoint, endPoint) {
    // 点到线段的最短距离， 矢量法，参照https://www.cnblogs.com/lyggqm/p/4651979.html
    var cross = (endPoint.x - startPoint.x) * (point.x - startPoint.x) + (endPoint.y - startPoint.y) * (point.y - startPoint.y);
    if (cross <= 0) return Math.sqrt(Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2));

    var d2 = Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2);
    if (cross >= d2) return Math.sqrt(Math.pow(point.x - endPoint.x, 2) + Math.pow(point.y - endPoint.y, 2));
    
    var r = cross / d2,
        px = startPoint.x + (endPoint.x - startPoint.x) * r,
        py = startPoint.y + (endPoint.y - startPoint.y) * r;
    return Math.sqrt(Math.pow(point.x - px, 2) + Math.pow(py - point.y, 2));
}

