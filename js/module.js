function BaseModule (options = {}) {
    let ratio = getRatio(); //canvas 渲染像素倍率
    let defaultOpt = {
        id: 'module' + new Date().getTime(),
        isFirst: false, //是否为开始模块
        isLast: false, // 是否为结束模块
        $parent: $('#bgcontainer'),
        hasDelete: false,
        hasSetting: false,
        ratio,
        text: '标题',
        width: 100,
        height: 30,
        deleteWidth: 10,
        color: '#333',
        fontColor: '#000',
        fontSize: 12,
        textX: 5, //文字据左边偏移
        canvasX: 0, //canvas x 坐标
        canvasY: 0,
        originX: 0,
        originY: 0,
        x: 0, 
        y: 0,
        containerHeight: 0, //有子模块是整体高度,
        type: 'normal'
    }

    Object.assign(this, defaultOpt, options);
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
    // 创建一个div元素包含canvas元素
    var div = $(`<div id="${this.id}" draggable="false" class="basemodule ${this.className}" style="position: absolute; z-index: 1;left: ${this.x}px; top: ${this.y}px; width: ${this.width}px; height: ${this.height}px;"></div>`);
    var canvas = $(`<canvas id="canvas${this.id}" width=${this.width} height=${this.height}></canvas>`);
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
        var $delete = $(`<div id="delete${this.id}"style="position: absolute; right: ${rx}px; top: ${ty}px; width: ${width}px; height: ${width}px"></div>`);
        var canvasDelete = $(`<canvas style="position: absolute; left: 0px; top:0px" width=${width} height=${width}></canvas>`);
        this.deletectx = canvasDelete[0].getContext('2d');
        this.delete = $delete;
        resetCanvasRatio(canvasDelete, width, width, this.ratio);
        $delete.on('click', (event) => {
            event.stopPropagation();
            this.destroy();
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
    // 创建连接点
    if (this.canbeEnd) {
        var leftdiv = $(`<div class="dragableRect leftRect" style="top: ${this.height/2 - 3}px"></div>`);
        this.div.append(leftdiv);
    }
    if (this.canbeStart) {
        var rightdiv = $(`<div class="dragableRect rightRect" draggable="true" style="top: ${this.height/2 - 3}px"></div>`);
        this.div.append(rightdiv);
    }

    $('body').on('dragstart', `#${this.id}>.dragableRect.rightRect`, (event) => {
        event = event.originalEvent;
        // 连线只能从模块右边开始连线
        let nowId = $(event.target).parent().attr('id');
        let line = this.flowchart.lines.find(e => e.start && nowId == e.start.id);
        if (line) return ;

        var elementPro = '';
        line = new Baseline({ originX: this.originX, originY: this.originY});
        if ($(event.target).hasClass('leftRect')) {
            elementPro = 'end';
        } else {
            elementPro = 'start';
        }
        line[elementPro] = {
            id: nowId
        };
        line.lineCoordinate(this.flowchart.scrollDistance());
        this.flowchart.lines.push(line);
        this.startModuleId = nowId;
        event.dataTransfer.effectAllowed= 'copy';
        // firefox 需要设置Data否则后续事件不会触发
        event.dataTransfer.setData('startModuleId', nowId);
        this.isLinging = true;
    });

    $(this.flowchart.scrollParent).on('dragover', (event) => {
        if (!this.isLinging) return false;
        event = event.originalEvent;
        // 不阻止默认行为，否则不能drop
        event.preventDefault();
        let scrollDistance = this.flowchart.scrollDistance();
        let x = event.pageX - this.originX + scrollDistance.scrollLeft, y = event.pageY - this.originY + scrollDistance.scrollTop;
        
        let nowId = this.startModuleId;
        if (nowId != this.id) return;
            // 非指定元素上  不能放置
            if ($(event.target).hasClass('leftRect') && !this.contains(nowId, event.target)) {
            event.dataTransfer.dropEffect = 'copy';
        } else {
            event.dataTransfer.dropEffect = 'none';
        }

        this.flowchart.lines.forEach(e => { 
            if (e.isEnd) return;
            if(e.start && e.start.id == nowId) {
                e.update({ex: x, ey: y});
            }
        });
        this.flowchart.drawLines();
    });
    $('body').on('dragend', `#${this.id}>.dragableRect.rightRect`, (event) => {
        // 如果没有降落在合适的位置， 取消该连线
        event = event.originalEvent;
        this.isLinging = false;
        event.preventDefault();
        if (!this.flowchart.lines.find(line => !line.isEnd)) return;
        let myline = this.flowchart.lines.find((line) => {
            if (line.isEnd) return false;
            if (this.id == line.start.id) {
                line.destroy();
                return true;
            }
            return false;
        });
        this.flowchart.lines = this.flowchart.lines.filter((line) => line !== myline )
        this.startModuleId = null;
        this.flowchart.drawLines();
    });
    $('body').on('drop', '.dragableRect.leftRect',(event) => {
        event = event.originalEvent;
        event.preventDefault();

        // 找到设置的id  找到line
        let id = this.startModuleId,
            nowId = $(event.target).parent().attr('id');
        let fmodule = this.flowchart && this.flowchart.modules.find(mod => mod.id == nowId) || {};      
        let x = fmodule.x, y = fmodule.y + fmodule.height/2;
        if (id == nowId) return;
        this.flowchart && this.flowchart.lines.forEach(e => { 
            if (e.isEnd) return;
            if (e.start && e.start.id == id) {
                e.setPoint({
                    end: { id: nowId }
                });
                let mostart = this.flowchart.modules.find(start => start.id == id) || {};
                let monext = this.flowchart.modules.find(next => next.id == nowId) || {};
                mostart.nextId = monext.id;
                e.update({ex: x, ey: y});
            }
        });
        this.flowchart.drawLines();
    });
}
BaseModule.prototype.inScrollParent = function(point) {
    // point 为pagex, pagey相对于整个文档的距离
    // 某个点是否在scrollparent 区域内
    let offset = this.flowchart.scrollParent.offsetValue || this.flowchart.scrollParent.offset(),
        width = this.flowchart.scrollParent.widthValue || this.flowchart.scrollParent.width(),
        height = this.flowchart.scrollParent.heightValue || this.flowchart.scrollParent.height();
    this.flowchart.scrollParent.offsetValue = offset;
    this.flowchart.scrollParent.widthValue = width;
    this.flowchart.scrollParent.heightValue = height;
    // 矩形边界检测
    return offset.left <= point.x && point.x <= offset.left + width &&
            offset.top <= point.y && point.y <= offset.top + height;
}

BaseModule.prototype.moveScroll = function(event) {
    // 处理滚动， 如果已经在滚动不做处理
    if (this.isAutoScroll) return;
    let point = { x: event.pageX, y: event.pageY };
    // 鼠标相隔最近scrollParent的四个方向线段， 并朝该方向滚动
    let offset = this.flowchart.scrollParent.offsetValue || this.flowchart.scrollParent.offset(),
        width = this.flowchart.scrollParent.widthValue || this.flowchart.scrollParent.width(),
        height = this.flowchart.scrollParent.heightValue || this.flowchart.scrollParent.height();
    let left = { dir:'left', start: { x: offset.left, y: offset.top }, end: { x: offset.left, y: offset.top + height }},
        right = { dir:'right',start: { x: offset.left + width, y: offset.top}, end: { x: offset.left + width, y: offset.top + height}},
        top = { dir:'top',start: { x: offset.left, y: offset.top}, end: { x: offset.left + width, y: offset.top }},
        bottom = { dir:'bottom',start: { x: offset.left, y: offset.top + height }, end: { x: offset.left + width, y: offset.top + height }};
    //如果有鼠标点到两条线段的距离相同时，随机选个方向滚动 
    let leftdis = pointToSegDist(point, left.start, left.end),
        rightdis = pointToSegDist(point, right.start, right.end),
        topdis = pointToSegDist(point, top.start, top.end),
        bottomdis = pointToSegDist(point, bottom.start, bottom.end);
    let mindis = Math.min(leftdis, rightdis, topdis, bottomdis);
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
    let stepD = 10; // 每次移动距离
    // 自动进行移动， 如果停止拖拽或者运动抵达距离就停止
    clearInterval(this.timer);
    this.isAutoScroll = true;
    if (dir === 'top' ) {
        this.timer = setInterval(()=> {
            let disTop = this.flowchart.scrollParent.scrollTop();
            this.flowchart.scrollParent.scrollTop(Math.max(disTop - stepD, 0));
            if (disTop <= 0 || !this.isDrag) {
                this.stopScroll();
            };
        }, 60)
    } else if (dir === 'bottom') {
        this.timer = setInterval(()=> {
            let disTop = this.flowchart.scrollParent.scrollTop(),
                scrollParentHeight = this.flowchart.scrollParent.heightValue || this.flowchart.scrollParent.height();
            if (disTop + scrollParentHeight >= this.flowchart.height || !this.isDrag) {
                // 滚动距离加屏幕可显示距离 为整个画布距离时 则滑到底
                this.stopScroll();
            };
            this.flowchart.scrollParent.scrollTop(disTop + Math.min(stepD, this.flowchart.height - scrollParentHeight));
        }, 60)
    } else if (dir === 'left' ) {
        this.timer = setInterval(() => {
            let disLeft = this.flowchart.scrollParent.scrollLeft();
            this.flowchart.scrollParent.scrollLeft(Math.max(disLeft - stepD, 0));
            if (disLeft <= 0 || !this.isDrag) {
                this.stopScroll();
            }
        }, 60)
    } else if (dir === 'right') {
        this.timer = setInterval(() => {
            let disLeft = this.flowchart.scrollParent.scrollLeft(),
                scrollParentWidth = this.flowchart.scrollParent.widthValue || this.flowchart.scrollParent.width();
            if (disLeft + scrollParentWidth >= this.flowchart.width || !this.isDrag) {
                this.stopScroll();
            }
            this.flowchart.scrollParent.scrollLeft(disLeft + Math.min(stepD, this.flowchart.width - scrollParentWidth));
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
    let scrollDistance = this.flowchart.scrollDistance();
    // 鼠标跟随模块的点
    if (position === 'center') {
        this.followPoint = {
            relativeX: this.width /2,
            relativeY: this.height/2
        }
    } else {
        this.followPoint = {
            relativeX: event.pageX - this.originX + scrollDistance.scrollLeft - this.x,
            relativeY: event.pageY - this.originY + scrollDistance.scrollTop - this.y
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
    let scrollDistance = this.flowchart.scrollDistance();
    // originx canvas距离页面左边的距离
    this.x = event.pageX + scrollDistance.scrollLeft - this.originX - this.followPoint.relativeX;
    this.y = event.pageY + scrollDistance.scrollTop - this.originY- this.followPoint.relativeY;
    let width = this.containerWidth || this.width; //暂时没有containerWidth, 预留
    let height = this.containerHeight || this.height;
   
    // 模块可移动区域边界检测
    if (this.x < 0) this.x = 0;
    if (this.x > 0 + this.flowchart.width - width) this.x = this.flowchart.width - width;

    if (this.y < 0) this.y = 0;
    if (this.y > 0 + this.flowchart.height - height) this.y = this.flowchart.height - height;
    this.dragDom();
}
BaseModule.prototype.contains = function(ancestorId, descendant) {
    let ancestor = document.getElementById(ancestorId);
    return ancestor && $.contains(ancestor, descendant);
}
BaseModule.prototype.dragDom = function() {
    // 拖动模块
    this.div.css({
        left: this.x,
        top: this.y
    });
    let dragableRect = Array.from(this.div.find('.dragableRect'));
    dragableRect.length && dragableRect.forEach(rect => {
        this.flowchart.lines.forEach(line => {
            let rectClass = '.'+ rect.className.replace(' ', '.');
            if ($(`#${line.start.id} ${rectClass}`).is($(rect)) || $(`#${line.end.id} ${rectClass}`).is($(rect))) {
                line.lineCoordinate(this.flowchart.scrollDistance());
            } 
        });
    });
    this.flowchart.drawLines();
}
BaseModule.prototype.destroy = function() {
    //  删除相关联的线
    // let line = lines.find((line) => line.start.id == this.id || line.end.id == this.id);
    this.flowchart.deleteRelaLines(this.id, this.children);
    this.div.remove();
    // 还没消除本身对象
    this.flowchart.modules = this.flowchart.modules.filter(item => item.id !== this.id);
}


// 菜单模块
function ContainModule(options={}) {
    let containOpt = {
        id: 'containModule' + new Date().getTime(),
        canbeEnd: true,
        canbeStart: false,
        hasSetting: true,
        childrenGap: 10,
        type: 'branchModule',
        children: []
    }
    Object.assign(this, containOpt, options);
    this.init();
    this.containDraw();
    this.addBranch({id: 'defaultChild', text: '请添加分支', canbeStart: false})
}

ContainModule.prototype = new BaseModule();

ContainModule.prototype.addBranch = function(options) {
    let defaultModule = this.children.length && this.children.find(child => child.id == 'defaultChild');
    if (defaultModule) {
        defaultModule.destroy();
        this.children = this.children.filter(child => child.id != 'defaultChild');
    }
    options = Object.assign(options, { 
        $parent: $(`#${this.id}`),
        flowchart,
        parentId: this.id, 
        parentwidth: this.width, 
        parentHeight: this.height, 
        gap: this.childrenGap, 
        childrenLength: this.children.length,
        originX: this.originX,
        originY: this.originY,
        containerId: this.id
    })
    let mod = new ChildModule(options);
    this.childrenHeight = mod.height;
    this.children.push(mod);
    this.resize();
    return mod;
}
ContainModule.prototype.containDraw = function() {
    $(`#${this.id}`).css({
        boxSizing: 'border-box',
        border: '1px solid #333',
        backgroundColor: 'rgba(255, 255, 255, 0.4)'
    });
}
ContainModule.prototype.resize = function() {
    this.containerHeight = this.height + (this.children.length+1) * this.childrenGap + this.children.length * this.childrenHeight;
    $(`#${this.id}`).css({height: this.containerHeight});
}

ContainModule.prototype.removeChild = function(moduleId) {
    this.children = this.children.filter((child) => {
        if(child.id == moduleId) {
            child.destroy();
        } else {
            return child;
        }
    });
    this.resize();
}
ContainModule.prototype.destroy = function() {
    //  删除相关联的线
    // let line = lines.find((line) => line.start.id == this.id || line.end.id == this.id);
    this.flowchart.deleteRelaLines(this.id, this.children);
    this.div.remove();
    // 还没消除本身对象
    let modules = this.flowchart.modules;
    this.flowchart.modules = this.flowchart.modules.filter(item => item.id !== this.id);
    this.removeChildren();
}

ContainModule.prototype.removeChildren = function() {
    this.children.forEach(item => item.destroy());
    this.children = [];
    this.resize();
}

// 被包含菜单的子模块
function ChildModule(options={}) {
    let childModuleOpt = Object.assign({
        id: `childModule${new Date().getTime()}`,
        className: 'childModule',
        canbeEnd: false,
        canbeStart: true,
        hasDelete: false,
        hasSetting: false,
        canDrag: false,
        gap: 10,
        width: 80,
        height: 20,
        x: 10,
        y: 40,
        type: 'branch'
    }, options);
    childModuleOpt.width = childModuleOpt.parentwidth - childModuleOpt.gap * 2;
    childModuleOpt.height = childModuleOpt.parentHeight - childModuleOpt.gap;
    Object.assign(this, childModuleOpt);
    this.x = childModuleOpt.gap || 10;
    this.y = childModuleOpt.parentHeight + (childModuleOpt.childrenLength + 1) * childModuleOpt.gap + (childModuleOpt.childrenLength * childModuleOpt.height);

    this.init();
    this.childDraw();
}
ChildModule.prototype = new BaseModule();
ChildModule.prototype.childDraw = function() {
    $(`#${this.id}`).css({
        backgroundColor: 'rgba(238, 238, 238, 0.5)'
    })
}

