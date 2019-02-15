
// util
function getRatio() {
    var canvas = $('<canvas></canvas>');
    var context = canvas[0].getContext('2d');
    
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

// 绘制箭头
function drawArrow(ctx, fromX, fromY, toX, toY,theta,headlen,width,color) { 
    theta = typeof(theta) != 'undefined' ? theta : 30;
    headlen = typeof(theta) != 'undefined' ? headlen : 10;
    width = typeof(width) != 'undefined' ? width : 1;
    color = typeof(color) != 'color' ? color : '#000'; // 计算各角度和对应的P2,P3坐标 
    var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI, 
        angle1 = (angle + theta) * Math.PI / 180, 
        angle2 = (angle - theta) * Math.PI / 180, 
        topX = headlen * Math.cos(angle1), 
        topY = headlen * Math.sin(angle1), 
        botX = headlen * Math.cos(angle2), 
        botY = headlen * Math.sin(angle2); 
        ctx.save(); ctx.beginPath(); 
    var arrowX = fromX - topX, 
    arrowY = fromY - topY; 
    ctx.moveTo(arrowX, arrowY); 
    ctx.moveTo(fromX, fromY); 
    ctx.lineTo(toX, toY); 
    arrowX = toX + topX; 
    arrowY = toY + topY; 
    ctx.moveTo(arrowX, arrowY); 
    ctx.lineTo(toX, toY); 
    arrowX = toX + botX; 
    arrowY = toY + botY; 
    ctx.lineTo(arrowX, arrowY);
     ctx.fillStyle = color; 
     ctx.lineWidth = width; 
     ctx.fill(); 
     ctx.restore();
}

export {
    getRatio,
    resetCanvasRatio,
    pointToSegDist,
    drawArrow
}