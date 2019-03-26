import { pointToSegDist, removeObjectByKey } from './utils.js';
import Baseline, { comLinePosition } from './line.js';
import { drawBaseModule } from './flowchart.shape';
import Raphael from 'raphael'
import moduleDefault from './module.default'

// 模块
function BaseModule(options = {}) {
  Object.assign(this, moduleDefault, options);

  this.className = options.className ? options.className : '' + ' flowBaseModule';
  this.text = options.text ? options.text : this.isFirst ? '开始' : (this.isLast ? '结束' : '标题');
  this.$icon = undefined;
  this.$title = undefined;
  this.paper = options.paper; // raphael paper parent

  if (this.isLast) {
    this.canbeStart = false;
    this.className += ' last-module';
  } else if (options.canbeStart !== undefined) {
    this.canbeStart = options.canbeStart;
  } else {
    this.canbeStart = true;
  }

  if (this.isFirst) {
    this.canbeEnd = false;
    this.className += ' first-module';
  } else if (options.canbeEnd !== undefined) {
    this.canbeEnd = options.canbeEnd;
  } else {
    this.canbeEnd = true;
  }
  this.canDrag = options.canDrag === undefined ? true : options.canDrag;
}
BaseModule.prototype.update = function (newModule) {
  Object.assign(this, newModule);
  this.updateModule(this.moduleElement, { text: this.text, titleIcon: this.titleIcon});
}

BaseModule.prototype.init = function () {
  if (!this.feId) {
    var random = this.flowchart.moduleRandomIds.shift(0);
    if (!random) console.log('模块数量超出最大值1000')
    this.feId = 'module' + new Date().getTime() + random;
  }
  this.moduleElement = drawBaseModule(this.flowchart, this.paper || this.flowchart.paper, {
    width: (this.isFirst || this.isLast) ? this.smallWidth : this.normalWidth,
    height: (this.isFirst || this.isLast) ? this.smallHeight : this.normalHeight,
    x: this.x, y: this.y,
    icon: this.titleIcon,
    text: this.text,
    feId: this.feId,
    deleteIcon: this.flowchart.deleteIcon,
    isFirst: this.isFirst,
    isLast: this.isLast,
    hasDelete: this.hasDelete,
    canbeEnd: this.canbeEnd,
    canbeStart: this.canbeStart,
    feType: this.feType,
    moduleData: this,
    feNextId: this.feNextId
  }, this);
  this.initEvent()
}
BaseModule.prototype.moveScroll = function (event) {
  // 处理边界滚动， 如果已经在滚动不做处理
  if (this.isAutoScroll) return;
  var point = { x: event.pageX, y: event.pageY };
  // 鼠标相隔最近$scrollWraper的四个方向线段， 并朝该方向滚动
  var offset = this.flowchart.$scrollWraper.offsetValue || this.flowchart.$scrollWraper.offset(),
    width = this.flowchart.$scrollWraper.widthValue || this.flowchart.$scrollWraper.width(),
    height = this.flowchart.$scrollWraper.heightValue || this.flowchart.$scrollWraper.height();
  var left = { dir: 'left', start: { x: offset.left, y: offset.top }, end: { x: offset.left, y: offset.top + height } },
    right = { dir: 'right', start: { x: offset.left + width, y: offset.top }, end: { x: offset.left + width, y: offset.top + height } },
    top = { dir: 'top', start: { x: offset.left, y: offset.top }, end: { x: offset.left + width, y: offset.top } },
    bottom = { dir: 'bottom', start: { x: offset.left, y: offset.top + height }, end: { x: offset.left + width, y: offset.top + height } };
  //如果有鼠标 点到两条线段 的距离相同时，随机选个方向滚动 
  var leftdis = pointToSegDist(point, left.start, left.end),
    rightdis = pointToSegDist(point, right.start, right.end),
    topdis = pointToSegDist(point, top.start, top.end),
    bottomdis = pointToSegDist(point, bottom.start, bottom.end);
  var mindis = Math.min(leftdis, rightdis, topdis, bottomdis);
  if (topdis === mindis) {
    this.autoScroll('top')

  } else if (bottomdis === mindis) {
    this.autoScroll('bottom');

  } else if (leftdis === mindis) {
    this.autoScroll('left')
  } else if (rightdis === mindis) {
    this.autoScroll('right')
  }

}
BaseModule.prototype.autoScroll = function (dir) {
  var stepD = 10,
    self = this,
    disLeft = 0,
    disTop = 0,
    $scrollWraperHeight = 0,
    $scrollWraperWidth = 0; // 每次移动距离
  // 自动进行移动， 如果停止拖拽或者运动抵达距离就停止
  clearInterval(this.timer);
  this.isAutoScroll = true;
  if (dir === 'top') {
    this.timer = setInterval(function () {
      disTop = self.flowchart.$scrollWraper.scrollTop();
      self.flowchart.$scrollWraper.scrollTop(Math.max(disTop - stepD, 0));
      if (disTop <= 0 || !self.isMoving) {
        self.stopScroll();
      };
    }, 60)
  } else if (dir === 'bottom') {
    this.timer = setInterval(function () {
      disTop = self.flowchart.$scrollWraper.scrollTop();
      $scrollWraperHeight = self.flowchart.$scrollWraper.heightValue || self.flowchart.$scrollWraper.height();

      if (disTop + $scrollWraperHeight >= self.flowchart.height || !self.isMoving) {
        // 滚动距离加屏幕可显示距离 为整个画布距离时 则滑到底
        self.stopScroll();
      };
      self.flowchart.$scrollWraper.scrollTop(disTop + Math.min(stepD, self.flowchart.height - $scrollWraperHeight));
    }, 60)
  } else if (dir === 'left') {
    this.timer = setInterval(function () {
      disLeft = self.flowchart.$scrollWraper.scrollLeft();
      self.flowchart.$scrollWraper.scrollLeft(Math.max(disLeft - stepD, 0));
      if (disLeft <= 0 || !self.isMoving) {
        self.stopScroll();
      }
    }, 60)
  } else if (dir === 'right') {
    this.timer = setInterval(function () {
      disLeft = self.flowchart.$scrollWraper.scrollLeft();
      $scrollWraperWidth = self.flowchart.$scrollWraper.widthValue || self.flowchart.$scrollWraper.width();
      if (disLeft + $scrollWraperWidth >= self.flowchart.width || !self.isMoving) {
        self.stopScroll();
      }
      self.flowchart.$scrollWraper.scrollLeft(disLeft + Math.min(stepD, self.flowchart.width - $scrollWraperWidth));
    }, 60)
  }
}
BaseModule.prototype.stopScroll = function () {
  clearInterval(this.timer);
  this.isAutoScroll = false;
}


BaseModule.prototype.contains = function (ancestorId, descendant) {
  var ancestor = document.getElementById(ancestorId);
  return ancestor && $.contains(ancestor, descendant);
}

BaseModule.prototype.destroy = function () {
  //  删除相关联的线
  this.flowchart.deleteRelaLines(this);
  this.stopScroll();
  this.moduleElement.setPaper.remove();

  // 消除本身对象
  removeObjectByKey(this.flowchart.modules, 'feId', this.feId);

  // 更新nodes显示
  this.flowchart.showNodes();
}
BaseModule.prototype.clickModule = function () {
  this.moduleElement.moduleNode.click(() => {
    if (this.isMoving) return;
    console.log('baseModule click')
    var e = $.Event('modulesetting', { module: Object.assign(this) })
    this.flowchart.$wraper.triggerHandler(e)
  })
}

BaseModule.prototype.initEvent = function() {
  this.dragModule();
  this.clickModule();
}
BaseModule.prototype.dragModule = function () {
  this.moduleElement.moduleNode.drag((dx, dy, x, y, event) => {
    this.isMoving = true;
    this.dragMoveSvgModule(this.moduleElement, dx, dy, x, y, event)
  }, (x, y, event) => {
    this.isMoving = false;
    this.dragStartSvgModule(this.moduleElement)
  })
}
BaseModule.prototype.dragMoveSvgModule = function (elements, dx, dy, x, y, event) {
  let scale = this.flowchart.scale;
  if (elements.length === undefined ) {
    elements = [elements]
  }
  // 如果鼠标在可视区外指定距离，模块不被拖动, 如果能滚动则自动滚动画布
  if (!this.flowchart.inScrollParent({ x: event.pageX, y: event.pageY }, 20)) {
    this.moveScroll(event);
    return;
  } else {
    this.stopScroll()
  }

  // 模块可移动区域边界检测
  let width = this.width,
      height = this.height,
      mo = this.moduleElement.moduleNode,
      nextmX = Number(mo.startX) + dx,
      nextmY = Number(mo.startY) + dy;

  if (nextmX < 0 ||
      nextmY < 0||
      nextmX.x > this.flowchart.width - width ||
      nextmY > this.flowchart.height - height
      ) return;

  
  elements.forEach(element => {
    this.updateModule(element, { dx: dx / scale, dy: dy / scale })
    this.updateRelayLines(this.flowchart, element.feId)
  });
}

BaseModule.prototype.dragStartSvgModule = function (elements) {
  let scale = this.flowchart.scale;
  if (elements.length === undefined ) {
    elements = [elements]
  }
  elements.forEach(element => {
    for (let i in element) {
      if (typeof element[i] !== 'object' || !element[i].node) continue;
      let positions = element[i].getBBox && element[i].getBBox();
      element[i].startX = Number(positions.x);
      element[i].startY = Number(positions.y);
      if (element[i].type && element[i].type === 'circle') {
        element[i].startX = Number(positions.x) + positions.width / 2;
        element[i].startY = Number(positions.y) + positions.height / 2;
      }
    }
  })
}

BaseModule.prototype.updateModule = function (mEles, options) {
  const nodes = ['leftNode', 'rightNode', 'moduleNode', 'deleteNode'];
  if (options.dx !== undefined && options.dy !== undefined) {
    let dx = options.dx, dy = options.dy;
    for (let i in mEles) {
      nodes.includes(i) && mEles[i] && mEles[i].attr && mEles[i].attr({
        x: Number(mEles[i].startX) + dx,
        y: Number(mEles[i].startY) + dy,
        cx: Number(mEles[i].startX) + dx,
        cy: Number(mEles[i].startY) + dy
      })
    }
  } else if (options.x !== undefined && options.y !== undefined) {
    let positions = mEles.moduleNode.getBBox(),
        dx = Number(options.x) - positions.x,
        dy = Number(options.y) - positions.y;
    for (let i in mEles) {
      if (nodes.includes(i) && mEles[i] && mEles[i].attr) {
        // x, y为模块整体初始点
        let origin = mEles[i].getBBox()
        mEles[i].attr({
          x: Number(origin.x) + dx,
          y: Number(origin.y) + dy,
          cx: Number(origin.cx) + dx,
          cy: Number(origin.cy) + dy
        })
      } 
    }
  }
  if (options.text) {
    $(mEles.moduleNode.node).find('.title-text').text(options.text)
  }

  if (options.titleIcon) {
    $(mEles.moduleNode.node).find('.ivricon').removeClass().addClass(`${options.titleIcon} ivricon`)
  }
}

BaseModule.prototype.updateRelayLines = function (chart, feId) {
  let reLines = chart.lines.filter(line => line.start.feId === feId || line.end.feId === feId)
  reLines.length && reLines.forEach(line => {
    line.updateLine()
  });
}


// 包含子模块的菜单模块
function ContainModule(options = {}) {
  this.canbeEnd = true;
  this.canbeStart = false;
  this.hasSetting = true;
  this.childrenGap = 0;
  this.feType = 'branchmodule';
  this.children = [];
  this.className = 'hasChildren';

  Object.assign(this, options);
  this.$icon = undefined;
  this.$title = undefined;
}

ContainModule.prototype = new BaseModule();
ContainModule.prototype.initDraw = function () {
  if (!this.feId) {
    var random = this.flowchart.moduleRandomIds.shift(0);
    if (!random) console.log('模块数量超出最大值1000')
    this.feId = 'containModule' + new Date().getTime() + random;
  }

  this.init();
  var mod = this.addBranch({ text: '子模块' })
  mod.initDraw();
  this.initEvent();
  this.flowchart.modules.push(mod)
}
ContainModule.prototype.addBranch = function (options) {

  // 更新位置
  let pos = this.moduleElement.moduleNode.getBBox()
  this.x = pos.x
  this.y = pos.y
  options = Object.assign(options, {
    flowchart: this.flowchart,
    feParentId: this.feId,
    parentwidth: this.width,
    parentHeight: this.height,
    gap: this.childrenGap,
    containerId: this.feId,
    childIndex: this.children.length,
    x: this.x,
    y: Number(this.y) + (this.children.length + 1) * (this.normalHeight + this.childrenGap),
  })
  var mod = new ChildModule(options);
  this.children.push(mod);
  return mod;
}

ContainModule.prototype.dragModule = function () {
  let allMoveElements =[ this.moduleElement].concat(this.children.map((child) => child.moduleElement || {}));
  let allModules = [this.moduleElement.moduleNode].concat(this.children.map(child => child.moduleElement && child.moduleElement.moduleNode))
  allModules.forEach(mod => {
    if (mod && typeof mod.drag === 'function'){
      mod.undrag();
      mod.drag((dx, dy, x, y, event) => {
        this.children.forEach(child => child.isMoving = true)
        this.isMoving = true
        this.dragMoveSvgModule(allMoveElements, dx, dy, x, y, event)
      }, (x, y, event) => {
        this.children.forEach(child => child.isMoving = false)
        this.isMoving = false
        this.dragStartSvgModule(allMoveElements, x, y, event)
      })
    }

  })
}

ContainModule.prototype.update = function (newModule) {
  Object.assign(this, newModule);
  this.updateModule(this.moduleElement, { text: this.text, titleIcon: this.titleIcon});
  
  // 更新子模块
  if (this.children) {
    this.children.forEach(child => {
      let childOpt = newModule.children.find(chi => chi.feId === child.feId)
      childOpt && child.update(childOpt)
    })
  }
}
ContainModule.prototype.clickModule = function () {
  var clickFun = ()=> {
    if (this.isMoving) return;
    var e = $.Event('modulesetting', { module: Object.assign(this) })
    this.flowchart.$wraper.triggerHandler(e);
    console.log('containModule Click')
  }
  this.moduleElement.moduleNode.unclick();
  this.moduleElement.moduleNode.click(clickFun)
  this.children.forEach(child => {
    child.moduleElement && child.moduleElement.moduleNode.unclick() && child.moduleElement.moduleNode.click(clickFun)
  })
}

ContainModule.prototype.removeChild = function (moduleId) {
  this.children = this.children.filter((child) => {
    if (child.feId == moduleId) {
      child.destroy();
      // 重新调整children的位置
      return false;
    } else {
      return child;
    }
  });
  this.updatePosView();
}
ContainModule.prototype.updatePosView = function () {
  this.children.forEach((child, ind) => {
    if (child.childIndex != ind) {
      let posi = this.moduleElement.moduleNode.getBBox()
      child.updateModule(child.moduleElement, {
        x: posi.x,
        y: Number(posi.y) + (ind + 1) * (this.normalHeight + this.childrenGap)
      })
      // 更新连线相关位置
      let rlines = this.flowchart.lines.filter(line => line.start.feId === child.feId || line.end.feId === child.feId);
      rlines.forEach(line => line.updateLine(this.flowchart))
    }
  })
}
ContainModule.prototype.destroy = function () {
  //  删除相关联的线
  this.flowchart.deleteRelaLines(this);
  // 还没消除本身对象
  this.moduleElement.setPaper.remove();
  removeObjectByKey(this.flowchart.modules, 'feId', this.feId)
  this.removeChildren();
   // 更新nodes显示
   this.flowchart.showNodes();
}

ContainModule.prototype.removeChildren = function () {
  this.children.forEach(function (item) { return item.destroy() });
  this.children = [];
}

// 被包含菜单的子模块
function ChildModule(options = {}) {
  this.className = 'childModule';
  this.canbeEnd = false;
  this.canbeStart = true;
  this.hasDelete = false;
  this.hasSetting = false;
  this.canDrag = false;
  this.gap = 10;
  this.width = 80;
  this.height = 20;
  this.feType = 'branch';
  this.position = 'relative';
  this.titleIcon = '';
  var childModuleOpt = Object.assign(this, options);
  childModuleOpt.width = childModuleOpt.parentwidth - childModuleOpt.gap * 2;
  childModuleOpt.height = childModuleOpt.parentHeight - childModuleOpt.gap;
  Object.assign(this, childModuleOpt);
  this.$icon = undefined;
  this.$title = undefined;

}
ChildModule.prototype = new BaseModule();
ChildModule.prototype.initDraw = function () {
  if (!this.feId) {
    var random = this.flowchart.moduleRandomIds.shift(0);
    if (!random) console.log('模块数量超出最大值1000')
    this.feId = 'childModule' + new Date().getTime() + random;
  }
  this.init();
}
ChildModule.prototype.clickModule = function() {
  this.moduleElement.moduleNode.unclick();
}

// 指定子模块的初始模块
function SpecialModule(options = {}) {
  this.feType = 'specialBranch';
  Object.assign(this, options);
}
SpecialModule.prototype = new ContainModule();
SpecialModule.prototype.initDraw = function () {
  var children = this.children.concat([]),
    self = this,
    random;
  if (!this.feId) {
    random = this.flowchart.moduleRandomIds.shift(0);
    if (!random) console.log('模块数量超出最大值1000')
    this.feId = 'specialBranch' + new Date().getTime() + random;
  }
  this.init();
  var children = this.children.concat([]),
    self = this;
  this.children = [];
  children.forEach(function (child) {
    var mod = self.addBranch(Object.assign(child))
    mod.initDraw();
    self.flowchart.modules.push(mod)
  })
  this.initEvent();
}

export {
  BaseModule,
  ContainModule,
  ChildModule,
  SpecialModule
}