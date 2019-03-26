/**
 * DEVELOPED BY
 * alice.luojuan@qq.com
 *
 * LICENSE: MIT
 */

import Baseline, { svgLine} from './line.js';
import { BaseModule, ContainModule, ChildModule, SpecialModule } from './module.js';
import { removeObject, getRatio, resetCanvasRatio, drawArrow, getLinePoints, getSvgPositionX, getSvgPositionY } from './utils.js';
import Raphael from 'raphael';
import defaultOpt from './flowchart.default';

function Flowchart(options = {}) {
  this.lines = [];
  this.modules = [];
  this.showNodesWraper = true;
  this.creatingModule = null;

  this.lineRandomIds = [];
  this.moduleRandomIds = [];
  this.clickLineOnModule = false; //是否点击到线上
  this.scale = 1 // 缩放倍数

  Object.assign(this, defaultOpt, options)
  this.$wraper = $(this.wraper);

  this.$wraper.html(`<div class="flowchart-scroll-wraper" style="width: 100%; height: 100%;overflow: auto">
                      <svg id="" width=${this.width} height=${this.height}> 
                      <g id="svg-wraper" x=0 y=0 transform=scale(${this.scale})> </g>
                      </svg></div>`)
  this.paper = Raphael('svg-wraper', this.width, this.height);
  this.$scrollWraper = this.$wraper.find('.flowchart-scroll-wraper');

  // 生成一个0-1000的数组，生成一个Id取出一个数，以便line 线段可以生成不重复Id
  for (var i = 0; i <= 1000; i++) {
    i = String(i);
    if (i.length < 4) {
      var d = 4 - i.length;
      for (var j = 1; j <= d; j++) {
        i = '0' + i;
      }
    }
    this.lineRandomIds.push(i);
  }
  // moduleId同理
  this.moduleRandomIds = this.lineRandomIds.concat([]);
  this.init();
  this.initEvent();
  this.initDeleteLineIcon();
}
Flowchart.prototype.initDeleteLineIcon = function () {
  // 删除连线的icon
  this.deleteLineEle = this.paper.html(`<i class="${this.deleteIcon} ivricon delete" style="color: ${this.themeColor}"></i>`, 0, 0, this.deleteLineIconWidth, this.deleteLineIconWidth);
  this.deleteLineEle.hide();
  this.deleteLineEle.click((evt) => {
    let focusLine = this.lines.find(line => line.isFocus);
    focusLine && this.deleteSvgLine(focusLine)
    this.deleteLineEle.hide();
  })
}
Flowchart.prototype.deleteSvgLine = function(line) {
  this.modules.find(moduleE => {
    if (moduleE.feId === line.start.feId) {
      delete moduleE.feNextId
      delete moduleE.moduleElement.feNextId
    }
  })
  line.pathLine.remove();
  removeObject(this.lines, line)
  this.showNodes();
}
Flowchart.prototype.showDeleteLine = function (event, line) {
  // 显示 在线段的垂直线上，距离连线与垂直平分线交点的距离distance
  var left, top, width = this.deleteLineIconWidth + 3,
    allWidth = this.width,
    allHeight = this.height,
    distance = 8,
    k,//垂直平分线段的斜率,
    b, // y=kx+b的b
    point = { x: -100, y: -100 }, //需要显示的点位置
    offsetParent = this.$scrollWraper.offset(),
    linePoint = { x: getSvgPositionX(this.scale, this.$scrollWraper, offsetParent.left, event.pageX),
                  y: getSvgPositionY(this.scale, this.$scrollWraper, offsetParent.top, event.pageY) }
  if (line.start.cx === line.end.cx) {
    // linePoint.x = line.end.cx;
    // 连线斜率不存在时
    point.x = linePoint.x - distance - width;
    point.y = linePoint.y;
    if (!this.inCanvas(point, width, width)) {
      point.x = linePoint.x + distance;
    }
  } else if (line.start.cy === line.end.cy) {
    // 根据直线方程求鼠标的点
    // 斜率为0时
    point.x = linePoint.x;
    point.y = linePoint.y - distance - width;
    if (!this.inCanvas(point, width, width)) {
      point.y = linePoint.y + distance;
    }
  } else {
    // 存在斜率且不为0
    k = -(line.end.cx - line.start.cx) / (line.end.cy - line.start.cy);
    b = linePoint.y - k * linePoint.x;
    // 过鼠标的点垂直于线段的交点为linePoint.
    // 根据二元一次方程
    // ①(y1-y)/(x1-x) = -k; （x1,y1）为鼠标的点
    // ②y=kx+b;
    // 得 x = (y1+kx1-b)/2k;
    // linePoint.x = (linePoint.y + kl * linePoint.x - bl)/ (2 * kl);
    // linePoint.y = kl*linePoint.x + bl;
    var points = getLinePoints(k, b, linePoint, distance);
    point = points.point1;
    //  x<鼠标x时， 距离应算上自身距离
    if (points.point1.x < linePoint.x) {
      point.x = point.x - width;
    }
    // y<鼠标y时， 距离应算上自身距离
    if (points.point1.y < linePoint.y) {
      point.y = point.y - width;
    }
    if (!this.inCanvas(point, width, width)) {
      point = points.point2;
    }
    // x<鼠标x时， 距离应算上自身距离
    if (points.x < linePoint.x) {
      point.x = point.x - width;
    }
    // y<鼠标y时， 距离应算上自身距离
    if (points.y < linePoint.y) {
      point.y = point.y - width;
    }
  }
  this.deleteLineEle.show()
  this.deleteLineEle.attr({
    x: point.x,
    y: point.y
  })
}

Flowchart.prototype._getAllNodes = function() {
  var nodes = 0;
  this.modules.forEach(m => {
      m.moduleElement.rightNode && nodes++;
      m.moduleElement.leftNode && nodes++;
  });
  return nodes;
}

Flowchart.prototype._getConnectedNodes = function() {
   // 连线的起点唯一， 终点不唯一需要去重
   let starts = this.lines.length;

   // 利用键值对去重
   let ends = 0;
   let obj = {};
   this.lines.forEach(item => {
       !obj[item.end.feId] && ends++;
       obj[item.end.feId] = true;
   })
   return starts + ends;
}

Flowchart.prototype.changeScale = function (scale) {
  this.scale = scale
  $('#svg-wraper').attr('transform', `scale(${scale})`)
  this.paper.canvas.setAttribute('width', this.width / scale);
  this.paper.canvas.setAttribute('height', this.height / scale);
}
Flowchart.prototype.init = function () {
  if (this.showNodesWraper) {
    this.$nodesWraper = $('<div class="nodes"><span class="all-nodes">总节点数：<span class="J-allNodes">0</span></span><span class="connected-nodes">已连接节点数：<span class="J-connectedNodes">0</span></span></div>')
    this.$scrollWraper.append(this.$nodesWraper);
    this.allNodesEle = this.$scrollWraper.find('.J-allNodes');
    this.connectNodesEle = this.$scrollWraper.find('.J-connectedNodes');
  }
}
Flowchart.prototype.initEvent = function () {
  var self = this;

  //删除连线
  $('body').on('keyup', () => {
    let focusLine = this.lines.find(line => line.isFocus)
    focusLine && this.deleteSvgLine(focusLine) 
    focusLine && this.deleteLineEle.hide()
  });
  $('body').on('mousedown', (event) => {
    let focusLine = this.lines.find(line => line.isFocus)
    if(focusLine && 
        (focusLine.pathLine.node == event.target || 
         $(this.deleteLineEle.node).find(event.target).length)) return
    // 取消聚焦， 隐藏删除图标
    this.deleteLineEle.hide();
    focusLine && focusLine.pathLine.attr({
      'stroke-width': 2
    })
  })
  // window resize change
  $(window).on('resize', function () {
    let offset = self.$scrollWraper.offset()
    self.originX = offset.left;
    self.originY = offset.top;
    // module使用flowchart的originX ,line需要重新设置
    self.lines.forEach(function (line) {
      line.originX = self.originX;
      line.originY = self.originY;
    })

    // $scrollWraper宽高可能更改
    self.$scrollWraper.widthValue = self.$scrollWraper.width();
    self.$scrollWraper.heightValue = self.$scrollWraper.height();
  })

  // dragenter  拖拽进画布
  this.$scrollWraper.on('dragenter', function (ev) {
    ev.preventDefault();
    if (self.creatingModule && self.creatingModule.feType && !self.creatingModule.moveStart) {
      var scrollDistance = self.scrollDistance(),
        x = ev.pageX - self.originX + scrollDistance.scrollLeft,
        y = ev.pageY - self.originY + scrollDistance.scrollTop;
      self.creatingModule = self.createRealModule(Object.assign(self.creatingModule, { x, y, toCenter: true }), false);
      self.creatingModule.moveStart(ev, 'center');
      ev.originalEvent.dataTransfer.dropEffect = "move";
    }
  });
  // 拖拽时移动
  this.$scrollWraper.on('dragover', function (ev) {
    ev.preventDefault();
    if (self.creatingModule && self.creatingModule.moveDrag) {
      self.creatingModule.moveDrag(ev);
      ev.originalEvent.dataTransfer.dropEffect = "move"
    }
  })

  // 拖拽完成后， 删除临时模块， 创建新模块。
  this.$scrollWraper.on('drop', function (ev) {
    ev.preventDefault();
    if (self.creatingModule && self.creatingModule.moveEnd) {
      self.creatingModule.moveEnd(ev);
      var obj = Object.assign({}, self.creatingModule);

      // 重新生成， 否则id相同的元素会被删除
      delete obj.feId;
      delete obj.$title;
      delete obj.$icon;
      delete obj.$content;
      delete obj.toCenter;
      self.creatingModule.children && self.creatingModule.children.map(function (item) {
        if (item.isDefaultBranch) {
          return Object.assign({}, item);
        }
        delete item.feId;
        delete item.$title;
        delete item.$icon;
        return Object.assign({}, item);
      })

      // 创建一个Module在modules中， 不能用creatingModule，否则设为null后， modules中的引用也被设置为null
      var newmodule = self.createRealModule(obj);
      self.creatingModule.destroy();
      self.creatingModule = null;
      newmodule.children && newmodule.children.length && newmodule.children.forEach(function (item) { self.modules.push(item) });

      // 新增模块， 节点数变化
      self.showNodes();
    }
  })

  // 完成拖拽时，若没在画布区域内放置， 清除临时模块
  $('body').on('dragend', function (ev) {
    if (self.creatingModule) {
      self.creatingModule.moveEnd && self.creatingModule.moveEnd(ev);
      self.creatingModule.destroy && self.creatingModule.destroy();
      self.creatingModule = null;
    }
  })
}
Flowchart.prototype.deleteLine = function (line) {
  // 删除某条连线， 私有方法
  if (!line) return;
  var allModules = this.modules || [];

  var cMod = allModules.find(function (item) { return item.feId == line.start.feId }) || {};
  cMod.feNextId = null;
  this.lines = this.lines.filter(function (li = {}) { return li.feId && line.feId != li.feId });
  var endId = line.end && line.end.feId;
  var otherEnd = this.lines.find(function (li = {}) { return li.end && endId == li.end.feId });
  $('#' + line.start.feId + '>.title-wraper>.dragableRect.start').removeClass('connected');
}
Flowchart.prototype.deleteRelaLines = function (mo) {
  // 删除相关连线， 私有方法
  let rLines = this.lines.filter(line => line.start.feId === mo.feId || line.end.feId === mo.feId);
  mo.children && mo.children.forEach(child => this.deleteRelaLines(child))

  rLines.forEach((deline) => this.deleteSvgLine(deline));
}

Flowchart.prototype.inCanvas = function (point, width, height) {
  // 矩形边界检测
  return 0 < point.x && point.x + width < this.width &&
    0 < point.y && point.y + height < this.height;
}
Flowchart.prototype.inScrollParent = function (point, d) {
  // point 为pagex, pagey相对于整个文档的距离
  // 某个点是否在scrollparent 区域内
  // d 比区域小d的边界区域
  var offset = this.$scrollWraper.offsetValue || this.$scrollWraper.offset(),
    width = this.$scrollWraper.widthValue || this.$scrollWraper.width(),
    height = this.$scrollWraper.heightValue || this.$scrollWraper.height();
  this.$scrollWraper.offsetValue = offset;
  this.$scrollWraper.widthValue = width;
  this.$scrollWraper.heightValue = height,
    d = d || 0;
  // 矩形边界检测
  return offset.left + d < point.x && point.x < offset.left + width - d &&
    offset.top + d < point.y && point.y < offset.top + height - d;
}

Flowchart.prototype.createRealModule = function (options, shouldInSave = true) {
  // 真的创建模块
  var newmodule = null,
    containModule = null,
    feType = options.feType || 'normal';
  if (feType == 'normal') {
    Object.assign(options, {
      originX: this.originX,
      originY: this.originY,
      flowchart: this,
      feType
    });
    newmodule = new BaseModule(options);
    newmodule.init();
  } else if (feType == 'branchmodule') {
    Object.assign(options, {
      originX: this.originX,
      originY: this.originY,
      flowchart: this,
      feType
    });
    newmodule = new ContainModule(options);
    newmodule.initDraw();
  } else if (feType == 'branch' && options.feParentId) {
    // 不应该提供这种创建分支的方法
    var mo = this.modules && this.modules.find(function (item) { return item.feId && item.feId == options.feParentId });
    if (mo && typeof mo.addBranch == 'function') {
      newmodule = mo.addBranch(options);
      newmodule.initDraw();
      mo.initEvent();
    }
  } else if (feType == 'specialBranch') {
    Object.assign(options, {
      originX: this.originX,
      originY: this.originY,
      flowchart: this,
      feType
    });
    newmodule = new SpecialModule(options);
    newmodule.initDraw();
  }
  if (newmodule) {
    newmodule.deleteRelaLines = this.deleteRelaLines.bind(this);
  }
  if (shouldInSave && newmodule) {
    this.modules.push(newmodule);
  }
  return newmodule;
}


Flowchart.prototype.scrollDistance = function () {
  // 滚动容器距离
  return {
    scrollLeft: this.$scrollWraper.scrollLeft() || 0,
    scrollTop: this.$scrollWraper.scrollTop() || 0
  }
}

Flowchart.prototype.destroy = function () {
  this.$scrollWraper.off('mousemove', this.onLineBind);
  this.$scrollWraper.off('click', this.onLineClickBind);
  $('body').off('keyup', this.deleteLineBind);
}



// 节点数相关信息显示在页面内容上
Flowchart.prototype.showNodes = function () {
  var allNodes = this._getAllNodes(),
    connectNodes = this._getConnectedNodes();
  this.allNodesEle.text(allNodes);
  this.connectNodesEle.text(connectNodes);
}


Flowchart.prototype.moduleRestore = function (obj) {
  var moduleItem = this.createRealModule(Object.assign(obj));
}
Flowchart.prototype.moduleLineRestore = function (obj, scrollDistance) {
  // 模块连线恢复
  if (obj.feNextId) {
    let endModule = this.modules.find(mod => mod.feId === obj.feNextId)

    let line = endModule && svgLine(this, Object.assign(obj, { lineNode: obj.moduleElement.rightNode}),
              Object.assign(endModule, {lineNode: endModule.moduleElement.leftNode}))  
    this.lines.push(line);
  }
}

export default Flowchart