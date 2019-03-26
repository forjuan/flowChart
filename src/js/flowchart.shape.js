import { drawLine, drawCircle, drawRect, createSVG } from './svg.drawShape'
import { svgLine, comLinePosition } from './line'
import { pointInCircle, getSvgPositionX, getSvgPositionY, removeObjectByKey } from './utils'
import Raphael from 'raphael';
import $ from 'jquery';

Raphael.fn.html = Raphael.fn.html || function(html, x, y, width, height) { 
  var f = createSVG(this, this, "foreignObject", 
                    x, y, width, height, html); 
  f.node.innerHTML = html;
  f.getBBox = function() {
    let x, y, width, height;
    x = f.node.getAttribute('x')
    y = f.node.getAttribute('y')
    width = f.node.getAttribute('width')
    height = f.node.getAttribute('height')
    return { x, y, width, height }
  }
  f.hide = function() {
    $(f.node).hide();
  }
  f.show = function() {
    $(f.node).show();
  }
  return f; 
} 

function drawBaseModule(chart, paper, options = {}, mo = {}) {
  // mo 模块实例对象
  // 基础模块
  let defaults = {
    width: 162,
    height: 36,
    hasDelete: true,
    'title-bg-color': '#fff',
    'title-color': '#484848',
    canbeEnd: true,
    canbeStart: true,
    text: '标题',
    circleNodeWidth: 6,
    deleteDistance: 5,
    isFirst: false,
    isLast: false,
    feType: 'normal' // branchmodule, branch, specialBranch, normal
  }
  options = Object.assign(defaults, options);
  let titleIconHtml = options.feType === 'branch' ? '': `<i class="${options.icon} ivricon"></i>`;

  let moduleHTML = `<div id="${options.feId}" class="baseModule ${options.feType} ${options.isFirst?'first-module': ''} ${options.isLast?'last-module': ''}">
      <div class="title-wraper">
        ${titleIconHtml}
        <span class="title-text ${options.feType === 'branch' ? '' : 'hasLeftSepa'}">${options.text}</span>
      </div>
      </div>`
  let moduleNode = paper.html(moduleHTML, options.x, options.y, options.width, options.height);
  let moduleObj = { feId: options.feId, feNextId: options.feNextId };
  let setPaper = paper.set()
  setPaper.push(moduleNode)
  setPaper.attr({
    'cursor': 'move'
  })

  if (options.hasDelete) {
    let deleteHTML = `<i class="${options.deleteIcon} delete" style="color: #dfdfdf;font-size:23px; padding-left: 10px"></i>`;
    let deleteIconHeight = 32;
    let dx = Number(options.x) + options.width,
        dy = Number(options.y) + (options.height - deleteIconHeight) / 2,
        deleteNode = paper.html(deleteHTML, dx, dy, deleteIconHeight + 20, deleteIconHeight)

    deleteNode.hide()
    moduleObj.deleteNode = deleteNode
    setPaper.push(deleteNode)
  }

  if (options.canbeEnd) {
    let lcx = options.x,
        lcy = Number(options.y) + (options.height - options.circleNodeWidth)/2,
        leftNode = paper.circle(lcx, lcy, options.circleNodeWidth);
    leftNode.attr({
      'stroke-width': 1,
      stroke: '#ddd',
      fill: '#ddd',
      'cursor': 'pointer'
    }).data('end', true).data('feId', options.feId);
    moduleObj.leftNode = leftNode;
    setPaper.push(leftNode)
    dragCircle(chart, moduleObj, leftNode, 'end')
  } 
  if (options.canbeStart) {
    let lcx = Number(options.x) + Number(options.width),
        lcy = Number(options.y) + (Number(options.height) - Number(options.circleNodeWidth))/2,
        rightNode = paper.circle(lcx, lcy, options.circleNodeWidth)
    rightNode.attr({
      'stroke-width': 1,
      stroke: '#ddd',
      fill: '#FFF',
      'cursor': 'pointer',
      'fill-opacity': 0.8
    }).data('start', true).data('feId', options.feId);
    dragCircle(chart, moduleObj, rightNode, 'start')
    moduleObj.rightNode = rightNode;
    setPaper.push(rightNode)
  }
  setPaper.hover(function(){
    moduleObj.deleteNode && moduleObj.deleteNode.show()
  }, function(){
    moduleObj.deleteNode && moduleObj.deleteNode.hide()
  }, setPaper, setPaper)

  moduleObj.setPaper = setPaper;
  moduleObj.moduleNode = moduleNode;
  moduleStyleInteraction(chart, options.moduleData, moduleObj, mo)
  return moduleObj;
}

function moduleStyleInteraction(chart, moduleData, moduleE, mo) {
  // 交互样式
  moduleE.rightNode && moduleE.rightNode.hover(function() {
    // hover时
    
    if (!moduleE.next) {
      moduleE.rightNode.attr({
        'cursor': 'pointer'
      })
    } else {
      moduleE.rightNode.attr({
        'cursor': 'not-allowed'
      })
    }
  }, function() {})

  // delete
  moduleE.deleteNode && moduleE.deleteNode.click(function() {
    mo.destroy();
  })
}


function dragCircle(chart, moduleE, circleEle, type) {
  let line,
      isStart = type === 'start',
      start = {x: 0, y: 0},
      end = {x: 0, y: 0};
  let svgWraperOffset = chart.$scrollWraper.offset();
  chart.originX = chart.originX || svgWraperOffset.left,
  chart.originY = chart.originY || svgWraperOffset.top;

  circleEle.drag(function(dx, dy, x, y, event) {
    // drag move
    if (moduleE.feNextId && isStart) {
    // 同一起点只能连一次
      return;
    }
    let scale = chart.scale;
    let mx = getSvgPositionX(scale, chart.$scrollWraper, chart.originX, x),
        my = getSvgPositionY(scale, chart.$scrollWraper, chart.originY, y)
    if (isStart) {
      line.updateLine(chart, { x: start.x, y: start.y }, { x: mx, y: my } )
    } else {
      line.updateLine(chart, { x: mx, y: my }, { x: start.x, y: start.y } )
    }
  }, function(x, y, event) {
    // drag start

    if (moduleE.feNextId && isStart) {
      // 同一起点只能连一次
      return;
    }
    let scale = chart.scale;
    let cx = circleEle.attr('cx'),
        cy = circleEle.attr('cy'),
        r = circleEle.attr('r');
    let sx, sy = cy;
    sx = isStart ? cx + r/2 + 2 : cx - r/2 - 2; //border
    start.x = sx;
    start.y = sy;
    line = drawLine(chart, { x: sx, y: sy}, {x: sx, y: sy}, {})
  }, function(event) {
    // drag end
    if (moduleE.feNextId && isStart) {
      // 同一起点只能连一次
      return;
    }
    let scale = chart.scale;
    let ex = getSvgPositionX(scale, chart.$scrollWraper, chart.originX, event.pageX),
        ey = getSvgPositionY(scale, chart.$scrollWraper, chart.originY, event.pageY)

    // 判断是否连上了非同一类型端点
    let ele = chart.modules.find(mele => {
      let circle = isStart ? mele.moduleElement.leftNode : mele.moduleElement.rightNode,
      cirAttrs = circle && circle.attrs;
      return (circle && cirAttrs && pointInCircle(ex, ey, cirAttrs.cx, cirAttrs.cy, cirAttrs.r))
    });
    if (ele) {
      // 创建line
      let currentModule = chart.modules.find(mele => mele.feId === circleEle.data('feId')),
          lineItem,
          startModule, endModule;
      if (isStart) {
        startModule = currentModule
        endModule = ele
      } else {
        startModule = ele
        endModule = currentModule
      }
      line.pathLine && line.pathLine.remove();
      
      // 同一起点不能有多条连线
      if(chart.lines.find(lineO => lineO.start.feId === startModule.feId)) return;


      startModule.feNextId = startModule.moduleElement.feNextId = ele.feId;
      lineItem = svgLine(chart, Object.assign(startModule, {lineNode: startModule.moduleElement.rightNode}), 
                    Object.assign(endModule, {lineNode: endModule.moduleElement.leftNode}))
      chart.lines.push(lineItem)
      chart.showNodes()
    } else {
      line.pathLine && line.pathLine.remove();
    }
  })
}

export {
  drawBaseModule
}