function Flowchart(options={}) {
    this.lines = [];
    this.modules = [];
    this.ratio = getRatio();
    this.canvas = $(`#${options.canvasId || 'canvas'}`);
    this.ctx = this.canvas[0].getContext('2d');
    this.width = this.canvas.width();
    this.height = this.canvas.height();
    this.originX = this.canvas.offset().left;
    this.originY = this.canvas.offset().top;
    this.creatingModule = null;
    this.scrollParent = $(options.scrollParent) || this.canvas.parent().parent();
    this.lineRandomIds = [];
    this.moduleRandomIds = [];

    // 生成一个数组，以便line 线段可以生成不重复Id
    for (let i = 0; i<= 1000; i++) {
        i = String(i);
        if (i.length < 4)  {
            let d = 4 - i.length;
            for (let j = 1; j<= d ; j++) {
                i = '0' + i;
            }
        }
        this.lineRandomIds.push(i);
    }
    // moduleId同理
    this.moduleRandomIds = this.lineRandomIds.concat([]);
    this.init();
    this.initEvent();
}

Flowchart.prototype.init = function() {
    resetCanvasRatio(this.canvas, this.width, this.height, this.ratio);
    // 创建删除连线元素
    let self = this;
    let menu = $('<ul class="menu"></ul>'),
        del = $('<li>删除</li>');
    del.on('click', function(ev) {
        self.deleteFocusLine();
    });
    menu.append(del);
    menu.css({
        display: 'none',
        position: 'fixed'
    })
    $('body').append(menu);
    this.menu = menu;
}
Flowchart.prototype.deleteLine = function(line) {
    // 删除某条连线， 私有方法
    if(!line) return;
    let allModules = this.modules || [];

    let cMod = allModules.find(item => item.feId == line.start.feId) || {};
    cMod.feNextId = null;
    this.lines = this.lines.filter((li={}) => li.feId && line.feId != li.feId);
    let endId = line.end && line.end.feId;
    let otherEnd = this.lines.find((li={}) => li.end && endId == li.end.feId);
    if (!otherEnd) $(`#${endId} .dragableRect.leftRect`).css({backgroundColor: 'rgba(255, 255, 255, 0.5)'});
    this.drawLines();
}
Flowchart.prototype.deleteRelaLines = function(moduleId, children=[]) {
    // 删除相关连线， 私有方法
    let ids = [moduleId],
    delines = [];
    children.forEach(child => ids.push(child.feId));
    ids.forEach(id => {
        delines = delines.concat(this.lines.filter(line => line.start.feId == id || line.end.feId == id));
    });
    delines.forEach(deline => this.deleteLine(deline));
}
 
Flowchart.prototype.drawLines = function() {
    let ratio = this.ratio;
    this.ctx.clearRect(0, 0, this.width * ratio, this.height * ratio);
    let scrollDistance = this.scrollDistance();

    this.ctx.strokeStyle = 'green';
    this.lines && this.lines.forEach(line => {
        line.lineCoordinate(scrollDistance);
        this.ctx.beginPath();
        if (line.focus) {
         this.ctx.lineWidth = line.lineWidth * ratio;
        } else {
         this.ctx.lineWidth = 1 * ratio;
        }
        this.ctx.moveTo(line.sx * ratio,line.sy * ratio);
        this.ctx.lineTo(line.ex * ratio,line.ey * ratio);
        this.ctx.closePath();
        this.ctx.stroke();
    });
}
Flowchart.prototype.createModule = function(options) {
    // 根据isDragCreate参数判定该模块是否需要真的创建，还是记录参数
    options.isDragCreate = options.isDragCreate || false; //创建模块时是否要拖动
    if (!options.isDragCreate) {
        return this.createRealModule(options, true);
    } else {
        this.creatingModule = Object.assign(options, { 
            originX: this.originX, 
            originY: this.originY,
            flowchart: this,
            feType: options.feType
        });
        this.creatingModule;
    }
}
Flowchart.prototype.createRealModule = function(options, shouldInSave=true) {
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
        let mo = this.modules && this.modules.find(item=> item.feId && item.feId == options.feParentId);
        if (mo && typeof mo.addBranch == 'function') {
            newmodule = mo.addBranch(options);
            newmodule.initDraw();
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
        newmodule.drawLines = this.drawLines.bind(this);
        newmodule.deleteRelaLines = this.deleteRelaLines.bind(this);
    }
    if (shouldInSave && newmodule) {
        this.modules.push(newmodule)
    }
    return newmodule;
}
Flowchart.prototype.updateModule = function(options) {
    // 更新某个模块
    let mo = this.modules.find(item => item.feId === options.feId);
    mo.update(options);
}
Flowchart.prototype.removeChildModule = function(parentId, childId) {
    // 删除某个子模块
    let parent = this.modules.find(item => item.feId === parentId);
    parent.removeChild(childId);
}
Flowchart.prototype.removeChildren = function(parentId) {
    // 删除该模块下的所有子模块
    let parent = this.modules.find(item => item.feId === parentId);
    parent.removeChildren();
}
Flowchart.prototype.createChildren = function(parentId, children=[]) {
    // 批量增加子模块
    let parent = this.modules.find(item => item.feId === parentId);
    let self = this;
    children.forEach(function(child) {
        let childModule = parent.addBranch(child);
        childModule.initDraw();
        self.moduleLineRestore(childModule);
        self.modules.push(childModule);
    });
    this.drawLines();
}

Flowchart.prototype.onLine = function(event) {
    // 移动到连线上
     event = event.originalEvent;
     let scrollDistance = this.scrollDistance();
     let x = event.pageX - this.originX + scrollDistance.scrollLeft,
         y = event.pageY - this.originY + scrollDistance.scrollTop;
     this.scrollParent.css({
         cursor: 'default'
     });
     this.lines.forEach(line => {
         if (line.isOnline(x, y)) {
            this.scrollParent.css({
                 cursor: 'pointer'
             });
         } 
     });
}
Flowchart.prototype.onLineClick = function(event) {
    event = event.originalEvent;
    let scrollDistance = this.scrollDistance();
    let x = event.pageX - this.originX + scrollDistance.scrollLeft,
        y = event.pageY - this.originY + scrollDistance.scrollTop;
    //    已有聚焦的线
    this.lines.forEach(line => {line.focus = false; line.lineWidth = 1});
    let online = this.lines.find(line => line.isOnline(x, y));
    if (online) {
        online.focus = true;
        online.lineWidth = 3;
        var l, t;
        l = event.clientX;
        t = event.clientY;
        
        this.menu.css({
            left: l + 'px',
            display: 'block',
            top: t + 'px'
        }) 
    } else {
        this.menu.css({
            display: 'none'
        }) 
    }
                 
    this.drawLines();
}
Flowchart.prototype.deleteLineEv = function(event) {
    // 删除操作事件
    if (event.key == 'Backspace') {
       this.deleteFocusLine();
    } 
}
Flowchart.prototype.deleteFocusLine = function(event) {
    let line = this.lines.find((line) => line.focus);
    this.deleteLine(line);
}


Flowchart.prototype.scrollDistance = function() {
    return {
        scrollLeft: this.scrollParent.scrollLeft() || 0,
        scrollTop: this.scrollParent.scrollTop() || 0
    }
}
Flowchart.prototype.initEvent = function() {
    let self = this;
    this.onLineBind = this.onLine.bind(this);
    this.onLineClickBind = this.onLineClick.bind(this);
    this.deleteLineBind = this.deleteLineEv.bind(this);
    // 移动到连线上
    $('body').on('mousemove', this.onLineBind);
    // 聚焦连线
    $('body').on('click', this.onLineClickBind);
    //删除连线
    $('body').on('keyup', this.deleteLineBind);
    // window resize change
    $(window).on('resize', function () {
        self.originX = self.canvas.offset().left;
        self.originY = self.canvas.offset().top;
        // module使用flowchart的originX ,line需要重新设置
        self.lines.forEach(line => {
            line.originX = self.originX;
            line.originY = self.originY;
        })

        // scrollParent宽高可能更改
        this.flowchart.scrollParent.widthValue = this.flowchart.scrollParent.width();
        this.flowchart.scrollParent.heightValue = this.flowchart.scrollParent.height();
    })

    // dragenter  拖拽进画布
   this.scrollParent.on('dragenter', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.feType && !self.creatingModule.moveStart) {
            let scrollDistance = self.scrollDistance(),
                x = ev.pageX - self.originX + scrollDistance.scrollLeft,
                y = ev.pageY - self.originY + scrollDistance.scrollTop;
            self.creatingModule = self.createRealModule(Object.assign(self.creatingModule, { x, y }), false);
            self.creatingModule.moveStart(ev, 'center');
            ev.originalEvent.dataTransfer.dropEffect = "move";
        } 
    });
    // 拖拽时移动
    this.scrollParent.on('dragover', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.moveDrag) {
            self.creatingModule.moveDrag(ev);
            ev.originalEvent.dataTransfer.dropEffect = "move"
        } 
    })

    // 拖拽完成后， 删除临时模块， 创建新模块。
    this.scrollParent.on('drop', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.moveEnd) {
            self.creatingModule.moveEnd(ev);
            let obj = Object.assign({}, self.creatingModule);

            //创建module时会根据ratio重新计算
            if (obj.fontSize) obj.fontSize = obj.fontSize / obj.ratio;
            if (obj.textX) obj.textX = obj.textX / obj.ratio; 
            // 重新生成， 否则id相同的元素会被删除
            delete obj.feId;
            if (obj.children) obj.children = [];
            self.creatingModule.children && self.creatingModule.children.map(item => {
                if (item.isDefaultBranch) {
                    return Object.assign({}, item);
                }
                delete item.feId;
                if (item.fontSize) item.fontSize = item.fontSize / item.ratio;
                if (item.textX) item.textX = item.textX / item.ratio; 
                return Object.assign({}, item);
            })
            // 创建一个Module在modules中， 不能用creatingModule，否则设为null后， modules中的引用也被设置为null
            let newmodule = self.createRealModule(obj);
            self.creatingModule.destroy();
            self.creatingModule = null;
            newmodule.children.length && newmodule.children.forEach(item =>  self.modules.push(item));
        } 
    })

    // 完成拖拽时，若没在画布区域内放置， 清除临时模块
    $('body').on('dragend', function(ev) {
        if (self.creatingModule) {
            self.creatingModule.destroy();
            self.creatingModule = null;
        }
    })
}
Flowchart.prototype.destroy = function() {
    $('body').off('mousemove', this.onLineBind);
    $('body').off('click', this.onLineClickBind);
    $('body').off('keyup', this.deleteLineBind);
}

// 
Flowchart.prototype.save = function () {
    let mos = [];
    this.modules.forEach(item => {
      let obj = {
        feId: item.feId,
        feNextId: item.feNextId,
        feParentId: item.feParentId,
        text: item.text,
        type: item.type,
        data: item.data,
        viewInfo: JSON.stringify({
          feType: item.feType,
          feId: item.feId,
          feNextId: item.feNextId,
          feParentId: item.feParentId,
          x: item.x,
          y: item.y,
          isFirst: item.isFirst,
          isLast: item.isLast,
          canbeStart: item.canbeStart,
          canbeEnd: item.canbeEnd,
          hasDelete: item.hasDelete,
          hasSetting: item.hasSetting,
          settingCallback: item.settingCallback,
          isDefaultBranch: item.isDefaultBranch
        })
      };
      mos.push(obj);
    });
    localStorage.setItem('modules', JSON.stringify(mos));
    return mos;
}

Flowchart.prototype.restore = function(modules = []) {
    // 恢复模块
    if (!localStorage.getItem('modules')) return;
    modules = JSON.parse(localStorage.getItem('modules'));
    modules.map(item => Object.assign(item, JSON.parse(item.viewInfo)));

    // 先恢复父模块和普通模块
    let childModules = modules.filter(item => item.feType === 'branch'),
        otherModules = modules.filter(item => item.feType !== 'branch');
    otherModules.forEach(item => this.moduleRestore(item));
    childModules.forEach(item => this.moduleRestore(item));
    this.drawLines();
}
Flowchart.prototype.moduleRestore = function(obj)  {
    let moduleItem = this.createRealModule(Object.assign(obj));
    this.moduleLineRestore(moduleItem);
}
Flowchart.prototype.moduleLineRestore = function(obj) {
    // 模块连线恢复
    if (obj.feNextId) {
        let random = this.lineRandomIds.shift(0);
        if (!random) console.log('线段超出最大值1000')
        let feId = 'line' + new Date().getTime() + random;
        var line = new Baseline({ originX: this.originX, originY: this.originY, feId });
        line.start = { feId: obj.feId };
        line.end = { feId: obj.feNextId};
        line.styleEndPonit();
        this.lines.push(line);
    }
}