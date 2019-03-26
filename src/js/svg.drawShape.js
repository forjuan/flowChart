import { updateLine } from './line'

// svg 绘制


// 绘制line
function drawLine(chart, from, to, options) {
  let defaultOpts = {
    'stroke-color': '#12d2cb',
    'line-width': 1,
    'arrow-end': 'block'
  }
  options = Object.assign(defaultOpts, chart,  options)
  // 多个结束点
  if (Object.prototype.toString.call(to) !== '[object Array]') {
    to = [to];
  }
  let path = `M${from.x} ${from.y}`;
  for (let i = 0, len = to.length; i < len; i++) {
    path += `L${to[i].x} ${to[i].y}`
  }
  let line = {};
  line.pathLine = chart.paper.path(path);
  
  line.pathLine.attr({
    stroke: options['stroke-color'],
  });
  line.updateLine = updateLine

  return line;
}



// 绘制矩形或角有border-radius的矩形
function drawRect(chart, from, width, height, options) {
  let rect = chart.paper.rect(from.x, from.y, width, height, options.radius || 0);
  rect.attr({
    stroke: options['stroke-color'] || chart.rectStrokeColor ||'#000',
    'stroke-width': options['line-width'] || 1,
    fill: options['fill-color'] || chart.rectFillColor || 'transparent'
  });
  return rect
}

// 绘制圆形
function drawCircle(paper, center, r, options) {
  let circle = paper.circle(center.x, center.y, r);
  circle.attr({
    stroke: options['stroke-color'] || '#000',
    'stroke-width': options['line-width'] || 1,
    fill: options['fill-color'] || 'transparent'
  })
  return circle
}

// 创建paper svg元素
function createSVG(svg, container, type, x, y, w, h) { 
  // svg is the main Raphael paper instance 
  // container is the containing element, usuall also the paper instance 
  // but alternatively the 'g' 

  // thank you for leaking :) 
  var Element = svg.constructor.el.constructor; 
  var el = document.createElementNS('http://www.w3.org/2000/svg', type); 
  container.canvas && container.canvas.appendChild(el); 
  var res = new Element(el, svg); 
  res.attrs = {x: x, y: y, width: w, height: h}; 
  res.type = type; 
  if (type == "g") {
    res.canvas = res.node; 
  }
  
  var has = "hasOwnProperty"; 
  for (var key in res.attrs) { 
    if (res.attrs[has](key)) { 
      if (res.attrs[key] !== undefined) {
        el.setAttribute(key, res.attrs[key] + ""); 
      }
    } 
  }
  return res; 
} 

export {
    drawLine,
    drawCircle,
    drawRect,
    drawHTMl,
    createSVG
}