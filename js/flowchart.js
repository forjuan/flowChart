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
    if(!line) return;
    let allModules = this.modules || [];
    let cMod = allModules.find(item => item.id == line.start.id) || {};
    cMod.nextBid = null;
    cMod.nextId = null;
    this.lines = this.lines.filter((li={}) => li.id &&line.id != li.id);
    let endId = line.end && line.end.id;
    let otherEnd = this.lines.find((li={}) => li.end && endId == li.end.id);
    if (!otherEnd) $(`#${endId} .dragableRect.leftRect`).css({backgroundColor: 'rgba(255, 255, 255, 0.5)'});
    this.drawLines();
}
Flowchart.prototype.deleteRelaLines = function(moduleId, children=[]) {
    let ids = [moduleId],
    delines = [];
    children.forEach(child => ids.push(child.id));
    ids.forEach(id => {
        delines = delines.concat(this.lines.filter(line => line.start.id == id || line.end.id == id));
    });
    delines.forEach(deline => this.deleteLine(deline));
}
 
Flowchart.prototype.drawLines = function() {
    let ratio = this.ratio;
    this.ctx.clearRect(0, 0, this.width * ratio, this.height * ratio);

    this.ctx.strokeStyle = 'green';
    this.lines && this.lines.forEach(line => {
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
    options.isDragCreate = options.isDragCreate || false; //创建模块时是否要拖动
    if (!options.isDragCreate) {
        return this.createRealModule(options);
    } else {
        this.creatingModule = Object.assign(options, { 
            originX: this.originX, 
            originY: this.originY,
            flowchart: this,
            type: options.type
        });
        return this.creatingModule;
    }
}
Flowchart.prototype.createRealModule = function(options, shouldInSave=true) {
    var newmodule = null,
        containModule = null,
        type = options.type || 'normal';
    if (type == 'normal') {
         Object.assign(options, { 
             originX: this.originX, 
             originY: this.originY,
             flowchart: this,
             type
         });
        newmodule = new BaseModule(options);
        newmodule.init();
    } else if (type == 'branchmodule') {
         Object.assign(options, { 
             originX: this.originX, 
             originY: this.originY,
             flowchart: this,
             type
         });
        newmodule = new ContainModule(options);
    } else if (type == 'branch' && options.parentId) {
        // 不应该提供这种创建分支的方法
        let mo = this.modules && this.modules.find(item=> item.id && item.id == options.parentId);
        if (mo && typeof mo.addBranch == 'function') {
            newmodule = mo.addBranch(options);
        }
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
    let mo = this.modules.find(item => item.id === options.id);
    mo.update(options);
}
Flowchart.prototype.removeChildModule = function(parentId, childId) {
    let parent = this.modules.find(item => item.id === parentId);
    parent.removeChild(childId);
}
Flowchart.prototype.removeChildren = function(parentId) {
    let parent = this.modules.find(item => item.id === parentId);
    parent.removeChildren();
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
    // dragenter
   this.scrollParent.on('dragenter', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.type && !self.creatingModule.moveStart) {
            let scrollDistance = self.scrollDistance(),
                x = ev.pageX - self.originX + scrollDistance.scrollLeft,
                y = ev.pageY - self.originY + scrollDistance.scrollTop;
            self.creatingModule = self.createRealModule(Object.assign(self.creatingModule, { x, y }), false);
            self.creatingModule.moveStart(ev, 'center');
            ev.originalEvent.dataTransfer.dropEffect = "move";
        } 
    });
    this.scrollParent.on('dragover', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.moveDrag) {
            self.creatingModule.moveDrag(ev);
            ev.originalEvent.dataTransfer.dropEffect = "move"
        } 
    })
    this.scrollParent.on('drop', function(ev) {
        ev.preventDefault();
        if (self.creatingModule && self.creatingModule.moveEnd) {
            self.creatingModule.moveEnd(ev);
            let obj = Object.assign({}, self.creatingModule);
            delete obj.id;
            // 创建一个Module在modules中， 不能用creatingModule，否则设为null后， modules中的引用也被设置为null
            self.modules.push(self.createRealModule(obj));
            self.creatingModule.destroy();
            self.creatingModule.children && self.creatingModule.children.forEach(item => self.modules.push(item));
            self.creatingModule = null;
        } 
    })
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
        id: item.id,
        nextId: item.nextId,
        parentId: item.parentId,
        text: item.text,
        viewInfo: JSON.stringify({
          type: item.type,
          id: item.id,
          nextId: item.nextId,
          parentId: item.parentId,
          x: item.x,
          y: item.y,
          isFirst: item.isFirst,
          isLast: item.isLast,
          hasDelete: item.hasDelete,
          hasSetting: item.hasSetting,
          settingCallback: item.settingCallback
        })
      };
      mos.push(obj);
    });
    localStorage.setItem('modules', JSON.stringify(mos));
    return mos;
}

Flowchart.prototype.restore = function(modules = []) {
    let lines = [];
    if (!localStorage.getItem('modules')) return;
    modules = JSON.parse(localStorage.getItem('modules'));
    // 先恢复父模块和普通模块
    let childModules = modules.filter(item => item.type === 'branch');
    let otherModules = modules.filter(item => item.type !== 'branch')
    otherModules.forEach(item => moduleRestore.call(this, item));
    childModules.forEach(item => moduleRestore.call(this, item));
    
    function moduleRestore(item) {
        var obj = Object.assign(item, JSON.parse(item.viewInfo));
        let moduleItem = this.createRealModule(obj);
        setTimeout(() => {
            if (obj.nextId) {
                var line = new Baseline({ originX: this.originX, originY: this.originY});
                line.start = { id: obj.id };
                line.end = { id: obj.nextId};
                line.styleEndPonit();
                line.lineCoordinate(this.scrollDistance());
                lines.push(line);
                this.lines = lines;
                this.drawLines();
            }
        }, 200);
    }
}