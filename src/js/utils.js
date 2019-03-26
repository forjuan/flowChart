
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

// 去除数组中指定对象
function removeObject(array, obj) {
    let index = array.indexOf(obj)
    if (index >=0) {
        array.splice(index, 1) 
    }
}

// 去除数组中指定唯一主键的的对象
function removeObjectByKey(array, key, value) {
    let indexI = -1;
    let obj = array.find((arr, index) => {
        if (arr[key] === value) {
            indexI = index
            return true
        } else return false
        
    });
    obj && array.splice(indexI, 1)
}

// 根据k(不为0)以及，b以及其中一个点，求解距离该点l距离的两个点
function getLinePoints(k, b, point, l) {
    // 第二步：求得在直线y=kx+b上，距离当前坐标距离为L的某点
    // 一元二次方程Ax^2+Bx+C=0中,
    // 一元二次方程求根公式：
    // 两根x1,x2= [-B±√(B^2-4AC)]/2A
    // ①(y-y0)^2+(x-x0)^2=L^2;
    // ②y=kx+b;
    // 式中x,y即为根据以上lenthUnit单位长度(这里就是距离L)对应点的坐标
    // 由①②表达式得到:(k^2+1)x^2+2[(b-y0)k-x0]x+[(b-y0)^2+x0^2-L^2]=0， x0,y0即point的坐标
    var A = k * k + 1,
      B = 2 * ((b - point.y) * k - point.x),
      C = Math.pow(b - point.y, 2) + Math.pow(point.x, 2) - Math.pow(l, 2);
    var x1 = (-B - Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A),
      y1 = x1 * k + b,
      x2 = (-B + Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A),
      y2 = x2 * k + b;
    return {
      point1: { x: x1, y: y1 },
      point2: { x: x2, y: y2 }
    }
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

// 判断点是否在圆圈内
function pointInCircle(pointx, pointy, cx, cy, r) {
    return Math.pow(pointx - cx, 2) + Math.pow(pointy - cy, 2) <= Math.pow(r, 2)
}

// 鼠标事件坐标x转为svg相对坐标
function getSvgPositionX(scale, $scroll, offLeft, x) {
    return (x - offLeft + $scroll.scrollLeft())/scale
}

// 鼠标事件坐标y转为svg相对坐标
function getSvgPositionY(scale, $scroll, offTop, y) {
    return (y - offTop + $scroll.scrollTop())/scale
}

export {
    getRatio,
    resetCanvasRatio,
    pointToSegDist,
    drawArrow,
    pointInCircle,
    getSvgPositionX,
    getSvgPositionY,
    getLinePoints,
    removeObject,
    removeObjectByKey
}