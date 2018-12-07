function BaseModule (options = {}) {
    var ratio = getRatio(); //canvas 渲染像素倍率
    // this这样属性才能被继承
    this.isLast = false; // 是否为结束模块
    this.isFirst = false; //是否为开始模块
    this.$parent = $('#bgcontainer');
    this.hasDelete = false;
    this.hasSetting = false;
    this.ratio = ratio;
    this.text = '标题';
    this.width = 100;
    this.height = 30;
    this.deleteWidth = 10;
    this.canvasX = 0; //canvas x 坐标
    this.canvasY = 0;
    this.x = 0;
    this.y = 0;
    this.containerHeight = 0; //有子模块是整体高度,
    this.feType = 'normal';
    this.fontSize = 14;
    this.textX = 5; //文字据左边偏移
    this.color =  '#333';
    this.fontColor = '#000';
    
    Object.assign(this, options);

    this.fontSize = this.fontSize * ratio;
    this.text = options.text ? options.text : this.isFirst ? '开始': (this.isLast ? '结束': '标题');
    this.textX = this.textX * ratio;

    if (this.isLast) {
        this.canbeStart = false;
    } else if (options.canbeStart !== undefined) {
        this.canbeStart = options.canbeStart;
    } else {
        this.canbeStart = true;
    }

    if (this.isFirst) {
        this.canbeEnd = false;
    } else if (options.canbeEnd !== undefined) {
        this.canbeEnd = options.canbeEnd;
    } else {
        this.canbeEnd = true;
    }

    this.canDrag = options.canDrag === undefined ? true : options.canDrag;
    this.font = `${this.fontSize}px Microsoft Yahei`;
    this.textY = this.height* this.ratio - (this.height* this.ratio - this.fontSize)/2; //canvas 以文字底端算y距离
}
BaseModule.prototype.update = function(newModule) {
    Object.assign(this, newModule);
    this.drawModule();
}
BaseModule.prototype.drawModule = function() {
    this.ctx.clearRect(this.canvasX, this.canvasY, this.width * this.ratio, this.height* this.ratio)
    this.ctx.strokeStyle = this.color;
    this.ctx.strokeWidth = 1 * this.ratio;
    this.ctx.strokeRect(this.canvasX, this.canvasY, this.width * this.ratio, this.height* this.ratio);
    this.ctx.fillStyle = this.fontColor;
    this.ctx.font = this.font;
    this.ctx.fillText(this.text, this.textX, this.textY);
    if (this.hasDelete) {
        this.deletectx.strokeStyle = '#333';
        this.deletectx.lineWidth = 1 * this.ratio;
        this.deletectx.beginPath();
        this.deletectx.moveTo(0, 0);
        this.deletectx.lineTo(this.deleteWidth * this.ratio, this.deleteWidth * this.ratio);
        this.deletectx.moveTo(0, this.deleteWidth * this.ratio);
        this.deletectx.lineTo(this.ratio * this.deleteWidth, 0);
        this.deletectx.stroke();
    }
}
BaseModule.prototype.init = function() {
    var self = this;
    if (!this.feId) {
        var random = this.flowchart.moduleRandomIds.shift(0);
        if (!random) console.log('模块数量超出最大值1000')
        this.feId = 'module' + new Date().getTime() + random;
    }
    // 创建一个div元素包含canvas元素
    var div = $(`<div id="${this.feId}" draggable="false" class="basemodule ${this.className}" style="position: absolute; z-index: 1;left: ${this.x}px; top: ${this.y}px; width: ${this.width}px; height: ${this.height}px;"></div>`);
    var canvas = $(`<canvas id="canvas${this.feId}" width=${this.width} height=${this.height}></canvas>`);
    this.div = div;
    
    this.ctx = canvas[0].getContext('2d');
    this.$canvas = canvas;
    resetCanvasRatio(canvas, this.width, this.height, this.ratio);
    
    if (this.canDrag) {
        div.mousedown(this.moveStart.bind(this));
        $('body').mouseup(this.moveEnd.bind(this));
        $('body').mousemove(this.moveDrag.bind(this));
    }
    if (this.hasDelete) {
        var width = this.deleteWidth;
        var rx = 10;
        var ty = (this.height - width)/2;
        var $delete = $(`<div id="delete${this.feId}"style="position: absolute; right: ${rx}px; top: ${ty}px; width: ${width}px; height: ${width}px"></div>`);
        var canvasDelete = $(`<canvas style="position: absolute; left: 0px; top:0px" width=${width} height=${width}></canvas>`);
        this.deletectx = canvasDelete[0].getContext('2d');
        this.delete = $delete;
        resetCanvasRatio(canvasDelete, width, width, this.ratio);
        $delete.on('click', function(event) {
            event.stopPropagation();
            self.destroy();

            // 删除后节点数变化
            self.flowchart.showNodes();
        })
        $delete.append(canvasDelete);
        div.append($delete);
    }
    this.drawModule();
    this.createdragableRect();
    div.append(canvas);
    this.$parent.append(div);
}
BaseModule.prototype.createdragableRect = function() {
    var self = this;
    // 创建连接点
    if (this.canbeEnd) {
        var leftdiv = $(`<div class="dragableRect leftRect" style="top: ${this.height/2 - 3}px"></div>`);
        this.div.append(leftdiv);
    }
    if (this.canbeStart) {
        var rightdiv = $(`<div class="dragableRect rightRect" draggable="true" style="top: ${this.height/2 - 3}px"></div>`);
        this.div.append(rightdiv);
    }

    $('body').on('dragstart', '#' + this.feId +'>.dragableRect.rightRect', function(event)  {
        event = event.originalEvent;
        // 连线只能从模块右边开始连线
        var nowId = $(event.target).parent().attr('id');
        var line = self.flowchart.lines.find(function(line) { return line.start && nowId == line.start.feId });
        if (line) return;

        var elementPro = '';
        line = new Baseline({ originX: self.flowchart.originX, originY: self.flowchart.originY});
        if ($(event.target).hasClass('leftRect')) {
            elementPro = 'end';
        } else {
            elementPro = 'start';
        }
        line[elementPro] = {
            feId: nowId
        };
        line.lineCoordinate(self.flowchart.scrollDistance());
        self.flowchart.lines.push(line);
        // for dragover access this data
        self.flowchart.currentStartModuleId = nowId;
        event.dataTransfer.effectAllowed= 'copy';
        // firefox 需要设置Data否则后续事件不会触发
        event.dataTransfer.setData('startModuleId', nowId);
    });

    this.flowchart.canvas.parent().unbind('dragover.BaseModuleNode');
    this.flowchart.canvas.parent().bind('dragover.BaseModuleNode', function(event) {
        event = event.originalEvent;
        // 不阻止默认行为，否则不能drop
        event.preventDefault();
        var nowId = self.flowchart.currentStartModuleId;
        if (!nowId) return; // 不是连线触发的

        var scrollDistance = self.flowchart.scrollDistance();
        var x = event.pageX - self.flowchart.originX + scrollDistance.scrollLeft, y = event.pageY - self.flowchart.originY + scrollDistance.scrollTop;
        
        // 非指定元素上  不能放置
        if ($(event.target).hasClass('leftRect') && !self.contains(nowId, event.target)) {
            event.dataTransfer.dropEffect = 'copy';
        } else {
            event.dataTransfer.dropEffect = 'none';
        }
        self.flowchart.lines.forEach(function(line) { 
            if (line.isEnd) return;
            if(line.start && line.start.feId == nowId) {
                line.update({ex: x, ey: y});
                line.lineCoordinate(scrollDistance);
            }
        });
        self.flowchart.drawLines(scrollDistance);
    });
    $('body').on('dragend', '#'+ this.feId + '>.dragableRect.rightRect', function(event) {
        // 如果没有降落在合适的位置， 取消该连线
        event = event.originalEvent;
        self.isLinging = false;
        event.preventDefault();
        // 没有无终点的连线
        if (!self.flowchart.lines.find(function (line){ return !line.isEnd})) return;
        var myline = self.flowchart.lines.find(function(line) {
            if (line.isEnd || line.end) return false;
            if (self.feId == line.start.feId) {
                line.destroy();
                return true;
            }
            return false;
        });
        self.flowchart.lines = self.flowchart.lines.filter(function(line){return line !== myline })
        self.startModuleId = null;
        self.flowchart.drawLines();
    });

    // bind事件命名空间， 防止多次重复触发
    $('body').unbind('drop.BaseModuleNode')
    $('body').bind('drop.BaseModuleNode', '.dragableRect.leftRect', function(event) {
        event = event.originalEvent;
        event.preventDefault();
        // 找到设置的id  找到line
        var id = event.dataTransfer.getData('startModuleId'),
            nowId = $(event.target).parent().attr('id');
        var fmodule = self.flowchart && self.flowchart.modules.find(function(mod) {return mod.feId == nowId}) || {};      
        var x = fmodule.x, y = fmodule.y + fmodule.height/2;
        if (id == nowId) return;
        self.flowchart && self.flowchart.lines.forEach(function(line) { 
            if (line.isEnd) return;
            // 没有end点的
            if (line.start && line.start.feId == id) {
                line.setPoint({
                    end: { feId: nowId }
                });
                var mostart = self.flowchart.modules.find(function (start) { return start.feId == id }) || {};
                var monext = self.flowchart.modules.find(function (next) { return next.feId == nowId }) || {};
                mostart.feNextId = monext.feId;
                line.update({ex: x, ey: y});
                line.isEnd = true;
            }
        });
        self.flowchart.drawLines();
        // 增加连线后节点数变化
        self.flowchart.showNodes();
    });
}
BaseModule.prototype.inScrollParent = function(point) {
    // point 为pagex, pagey相对于整个文档的距离
    // 某个点是否在scrollparent 区域内
    var offset = this.flowchart.scrollParent.offsetValue || this.flowchart.scrollParent.offset(),
        width = this.flowchart.scrollParent.widthValue || this.flowchart.scrollParent.width(),
        height = this.flowchart.scrollParent.heightValue || this.flowchart.scrollParent.height();
    this.flowchart.scrollParent.offsetValue = offset;
    this.flowchart.scrollParent.widthValue = width;
    this.flowchart.scrollParent.heightValue = height;
    // 矩形边界检测
    return offset.left < point.x && point.x < offset.left + width &&
            offset.top < point.y && point.y < offset.top + height;
}

BaseModule.prototype.moveScroll = function(event) {
    // 处理边界滚动， 如果已经在滚动不做处理
    if (this.isAutoScroll) return;
    var point = { x: event.pageX, y: event.pageY };
    // 鼠标相隔最近scrollParent的四个方向线段， 并朝该方向滚动
    var offset = this.flowchart.scrollParent.offsetValue || this.flowchart.scrollParent.offset(),
        width = this.flowchart.scrollParent.widthValue || this.flowchart.scrollParent.width(),
        height = this.flowchart.scrollParent.heightValue || this.flowchart.scrollParent.height();
    var left = { dir:'left', start: { x: offset.left, y: offset.top }, end: { x: offset.left, y: offset.top + height }},
        right = { dir:'right',start: { x: offset.left + width, y: offset.top}, end: { x: offset.left + width, y: offset.top + height}},
        top = { dir:'top',start: { x: offset.left, y: offset.top}, end: { x: offset.left + width, y: offset.top }},
        bottom = { dir:'bottom',start: { x: offset.left, y: offset.top + height }, end: { x: offset.left + width, y: offset.top + height }};
    //如果有鼠标点到两条线段的距离相同时，随机选个方向滚动 
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
BaseModule.prototype.autoScroll = function(dir) {
    var stepD = 10,
        self = this,
        disLeft = 0,
        disTop = 0,
        scrollParentHeight = 0,
        scrollParentWidth = 0; // 每次移动距离
    // 自动进行移动， 如果停止拖拽或者运动抵达距离就停止
    clearInterval(this.timer);
    this.isAutoScroll = true;
    if (dir === 'top' ) {
        this.timer = setInterval(function() {
            disTop = self.flowchart.scrollParent.scrollTop();
            self.flowchart.scrollParent.scrollTop(Math.max(disTop - stepD, 0));
            if (disTop <= 0 || !self.isDrag) {
                self.stopScroll();
            };
        }, 60)
    } else if (dir === 'bottom') {
        this.timer = setInterval(function() {
            disTop = self.flowchart.scrollParent.scrollTop();
            scrollParentHeight = self.flowchart.scrollParent.heightValue || self.flowchart.scrollParent.height();
            if (disTop + scrollParentHeight >= self.flowchart.height || !self.isDrag) {
                // 滚动距离加屏幕可显示距离 为整个画布距离时 则滑到底
                self.stopScroll();
            };
            self.flowchart.scrollParent.scrollTop(disTop + Math.min(stepD, self.flowchart.height - scrollParentHeight));
        }, 60)
    } else if (dir === 'left' ) {
        this.timer = setInterval(function() {
            disLeft = self.flowchart.scrollParent.scrollLeft();
            self.flowchart.scrollParent.scrollLeft(Math.max(disLeft - stepD, 0));
            if (disLeft <= 0 || !self.isDrag) {
                self.stopScroll();
            }
        }, 60)
    } else if (dir === 'right') {
        this.timer = setInterval(function() {
            disLeft = self.flowchart.scrollParent.scrollLeft();
            scrollParentWidth = self.flowchart.scrollParent.widthValue || self.flowchart.scrollParent.width();
            if (disLeft + scrollParentWidth >= self.flowchart.width || !self.isDrag) {
                self.stopScroll();
            }
            self.flowchart.scrollParent.scrollLeft(disLeft + Math.min(stepD, self.flowchart.width - scrollParentWidth));
        }, 60)
    }
}
BaseModule.prototype.stopScroll = function() {
    clearInterval(this.timer);
    this.isAutoScroll = false;
}

BaseModule.prototype.moveStart = function(event, position) {
    if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
    this.isDrag = true;
    this.stopScroll()
    // 开始点
    this.startmouseX = event.pageX;
    this.startmouseY = event.pageY;
    var scrollDistance = this.flowchart.scrollDistance();
    // 鼠标跟随模块的点
    if (position === 'center') {
        this.followPoint = {
            relativeX: this.width /2,
            relativeY: this.height/2
        }
    } else {
        this.followPoint = {
            relativeX: event.pageX - this.flowchart.originX + scrollDistance.scrollLeft - this.x,
            relativeY: event.pageY - this.flowchart.originY + scrollDistance.scrollTop - this.y
        }
    }
   

}
BaseModule.prototype.moveEnd = function(event) {
    this.isDrag = false;
    if (event.pageX == this.startmouseX && event.pageY == this.startmouseY && this.hasSetting) {
        var e = $.Event('modulesetting', { module: Object.assign(this)})
        this.flowchart.canvas.triggerHandler(e)
    }
    this.stopScroll()
}
BaseModule.prototype.moveDrag = function(event) {
    if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
    if(!this.isDrag) return;
    // 如果鼠标在可视区外，模块不被拖动
    if (!this.inScrollParent({x: event.pageX, y: event.pageY})) {
        this.moveScroll(event);
        return;
    } else {
        this.stopScroll()
    }
    // 在拖拽过程中
    var scrollDistance = this.flowchart.scrollDistance();
    // originx canvas距离页面左边的距离
    this.x = event.pageX + scrollDistance.scrollLeft - this.flowchart.originX - this.followPoint.relativeX;
    this.y = event.pageY + scrollDistance.scrollTop - this.flowchart.originY- this.followPoint.relativeY;
    var width = this.containerWidth || this.width; //暂时没有containerWidth, 预留
    var height = this.containerHeight || this.height;
   
    // 模块可移动区域边界检测
    if (this.x < 0) this.x = 0;
    if (this.x > 0 + this.flowchart.width - width) this.x = this.flowchart.width - width;

    if (this.y < 0) this.y = 0;
    if (this.y > 0 + this.flowchart.height - height) this.y = this.flowchart.height - height;
    this.flowchart.lines.forEach(function(line) { line.lineCoordinate(scrollDistance)})
    this.flowchart.drawLines();
    this.dragDom();
}
BaseModule.prototype.contains = function(ancestorId, descendant) {
    var ancestor = document.getElementById(ancestorId);
    return ancestor && $.contains(ancestor, descendant);
}
BaseModule.prototype.dragDom = function() {
    // 拖动模块
    this.div.css({
        left: this.x,
        top: this.y
    });
}
BaseModule.prototype.destroy = function() {
    //  删除相关联的线
    this.flowchart.deleteRelaLines(this.feId, this.children);
    this.div.remove();
    // 还没消除本身对象
    this.flowchart.modules = this.flowchart.modules.filter(function(item) {return item.feId !== this.feId });
}


// 菜单模块
function ContainModule(options={}) {
    this.canbeEnd = true;
    this.canbeStart = false;
    this.hasSetting = true;
    this.childrenGap = 10;
    this.feType = 'branchmodule';
    this.children = [];

    Object.assign(this, options);
}

ContainModule.prototype = new BaseModule();
ContainModule.prototype.initDraw = function() {
    if (!this.feId) {
        var random = this.flowchart.moduleRandomIds.shift(0);
        if (!random) console.log('模块数量超出最大值1000')
        this.feId = 'containModule' + new Date().getTime() + random;
    }

    this.init();
    this.containDraw();
    var mod = this.addBranch({feId: 'defaultChild' + new Date().getTime(), text: '请添加分支', canbeStart: false, isDefaultBranch: true})
    mod.initDraw();
}
ContainModule.prototype.addBranch = function(options) {
    // ~  对-1取反得 0，其他值都不为0；
    var defaultModule = this.children.length && this.children.find(function(child) { return ~child.feId.indexOf('defaultChild') });
    if (defaultModule) {
        defaultModule.destroy();
        this.children = this.children.filter(function (child) {return !Boolean(~child.feId.indexOf('defaultChild')) });
    }
    options = Object.assign(options, { 
        $parent: $(`#${this.feId}`),
        flowchart: this.flowchart,
        feParentId: this.feId, 
        parentwidth: this.width, 
        parentHeight: this.height, 
        gap: this.childrenGap, 
        childrenLength: this.children.length,
        containerId: this.feId
    })
    var mod = new ChildModule(options);
    this.childrenHeight = mod.height;
    this.children.push(mod);
    this.resize();
    return mod;
}
ContainModule.prototype.containDraw = function() {
    $(`#${this.feId}`).css({
        boxSizing: 'border-box',
        border: '1px solid #333',
        backgroundColor: 'rgba(255, 255, 255, 0.4)'
    });
}
ContainModule.prototype.resize = function() {
    this.containerHeight = this.height + (this.children.length+1) * this.childrenGap + this.children.length * this.childrenHeight;
    $(`#${this.feId}`).css({height: this.containerHeight});
}

ContainModule.prototype.removeChild = function(moduleId) {
    this.children = this.children.filter(function(child) {
        if(child.feId == moduleId) {
            child.destroy();
        } else {
            return child;
        }
    });
    this.resize();
}
ContainModule.prototype.destroy = function() {
    //  删除相关联的线
    this.flowchart.deleteRelaLines(this.feId, this.children);
    this.div.remove();
    // 还没消除本身对象
    var modules = this.flowchart.modules;
    this.flowchart.modules = this.flowchart.modules.filter(function(item) {return item.feId !== this.feId});
    this.removeChildren();
}

ContainModule.prototype.removeChildren = function() {
    this.children.forEach(function(item) {return item.destroy()});
    this.children = [];
    this.resize();
}

// 被包含菜单的子模块
function ChildModule(options={}) {
    this.className = 'childModule';
    this.canbeEnd = false;
    this.canbeStart = true;
    this.hasDelete = false;
    this.hasSetting = false;
    this.canDrag = false;
    this.gap = 10;
    this.width = 80;
    this.height = 20;
    this.x = 10;
    this.y = 40;
    this.feType = 'branch';
    var childModuleOpt = Object.assign(this, options);
    childModuleOpt.width = childModuleOpt.parentwidth - childModuleOpt.gap * 2;
    childModuleOpt.height = childModuleOpt.parentHeight - childModuleOpt.gap;
    Object.assign(this, childModuleOpt);
    this.x = childModuleOpt.gap || 10;
    this.y = childModuleOpt.parentHeight + (childModuleOpt.childrenLength + 1) * childModuleOpt.gap + (childModuleOpt.childrenLength * childModuleOpt.height);
}
ChildModule.prototype = new BaseModule();
ChildModule.prototype.initDraw = function() {
    if (!this.feId) {
        var random = this.flowchart.moduleRandomIds.shift(0);
        if (!random) console.log('模块数量超出最大值1000')
        this.feId = 'childModule' + new Date().getTime() + random;
    }
   
    this.init();
    this.childDraw();
}
ChildModule.prototype.childDraw = function() {
    $(`#${this.feId}`).css({
        backgroundColor: 'rgba(238, 238, 238, 0.5)'
    })
}


// // 指定子模块的初始模块
function SpecialModule(options = {}) {
    this.feType = 'specialBranch';
    Object.assign(this, options);
    
}
SpecialModule.prototype = new ContainModule();
SpecialModule.prototype.initDraw = function() {
    var children = this.children.concat([]),
        self = this,
        random;
    if (!this.feId) {
        random = this.flowchart.moduleRandomIds.shift(0);
        if (!random) console.log('模块数量超出最大值1000')
        this.feId = 'specialBranch' + new Date().getTime() + random;
    }
    this.init();
    this.containDraw();
    var children = this.children.concat([]),
        self = this;
    this.children = [];
    children.forEach(function(child) {
        var mod = self.addBranch(Object.assign(child))
        mod.initDraw();
    })
}


