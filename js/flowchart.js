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
    this.scrollParent = options.scrollParent ? $(options.scrollParent) : this.canvas.parent().parent();
    this.allNodesEle = options.allNodesId ? $(options.allNodesId) : $('#allNodes');
    this.connectNodesEle = options.connectNodesId ? $(options.connectNodesId) : $('#connectedNodes');
    this.lineRandomIds = [];
    this.moduleRandomIds = [];

    // 生成一个0-1000的数组，生成一个Id取出一个数，以便line 线段可以生成不重复Id
    for (var i = 0; i<= 1000; i++) {
        i = String(i);
        if (i.length < 4)  {
            var d = 4 - i.length;
            for (var j = 1; j<= d ; j++) {
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
    var self = this;
    var menu = $('<ul class="menu"></ul>'),
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
Flowchart.prototype.initEvent = function() {
    var self = this;
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
        self.lines.forEach(function(line) {
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
            var scrollDistance = self.scrollDistance(),
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
            var obj = Object.assign({}, self.creatingModule);

            //创建module时会根据ratio重新计算
            if (obj.fontSize) obj.fontSize = obj.fontSize / obj.ratio;
            if (obj.textX) obj.textX = obj.textX / obj.ratio; 
            // 重新生成， 否则id相同的元素会被删除
            delete obj.feId;
            self.creatingModule.children && self.creatingModule.children.map(function(item) {
                if (item.isDefaultBranch) {
                    return Object.assign({}, item);
                }
                delete item.feId;
                if (item.fontSize) item.fontSize = item.fontSize / item.ratio;
                if (item.textX) item.textX = item.textX / item.ratio; 
                return Object.assign({}, item);
            })
            // 创建一个Module在modules中， 不能用creatingModule，否则设为null后， modules中的引用也被设置为null
            var newmodule = self.createRealModule(obj);
            self.creatingModule.destroy();
            self.creatingModule = null;
            newmodule.children && newmodule.children.length && newmodule.children.forEach(function(item) { self.modules.push(item)});
            
            // 新增模块， 节点数变化
            self.showNodes();
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
Flowchart.prototype.deleteLine = function(line) {
    // 删除某条连线， 私有方法
    if(!line) return;
    var allModules = this.modules || [];

    var cMod = allModules.find(function(item) {return item.feId == line.start.feId }) || {};
    cMod.feNextId = null;
    this.lines = this.lines.filter(function(li={}) {return li.feId && line.feId != li.feId});
    var endId = line.end && line.end.feId;
    var otherEnd = this.lines.find(function(li={}) {return li.end && endId == li.end.feId});
    if (!otherEnd) $(`#${endId} .dragableRect.leftRect`).css({backgroundColor: 'rgba(255, 255, 255, 0.5)'});
    this.drawLines();
}
Flowchart.prototype.deleteRelaLines = function(moduleId, children=[]) {
    // 删除相关连线， 私有方法
    var ids = [moduleId],
        delines = [],
        self = this;
    children.forEach(function(child) {return ids.push(child.feId) });
    ids.forEach(function(id) {
        delines = delines.concat(self.lines.filter(function(line) {return line.start.feId == id || line.end.feId == id}));
    });
    delines.forEach(function(deline) {return this.deleteLine(deline) });
}
Flowchart.prototype.onLine = function(event) {
    // 移动到连线上
     event = event.originalEvent;
     var scrollDistance = this.scrollDistance(),
         self = this;
     var x = event.pageX - this.originX + scrollDistance.scrollLeft,
         y = event.pageY - this.originY + scrollDistance.scrollTop;
     this.scrollParent.css({
         cursor: 'default'
     });
     this.lines.forEach(function(line) {
         if (line.isOnline(x, y)) {
            self.scrollParent.css({
                 cursor: 'pointer'
             });
         } 
     });
}
Flowchart.prototype.onLineClick = function(event) {
    event = event.originalEvent;
    var scrollDistance = this.scrollDistance();
    var x = event.pageX - this.originX + scrollDistance.scrollLeft,
        y = event.pageY - this.originY + scrollDistance.scrollTop;
    //    已有聚焦的线
    this.lines.forEach(function(line) {line.focus = false; line.lineWidth = 1});
    var online = this.lines.find(function(line) {return line.isOnline(x, y)});
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
    var line = this.lines.find(function(line) {return line.focus});
    this.deleteLine(line);

    // 删除后节点数变化
    this.showNodes();
}
Flowchart.prototype.drawLines = function(scrollDistance) {
    var ratio = this.ratio,
        self = this;
    this.ctx.clearRect(0, 0, this.width * ratio, this.height * ratio);
    scrollDistance = scrollDistance || this.scrollDistance();

    this.ctx.strokeStyle = 'green';
    this.lines && this.lines.forEach(function (line) {
        self.ctx.beginPath();
        if (line.focus) {
         self.ctx.lineWidth = line.lineWidth * ratio;
        } else {
         self.ctx.lineWidth = 1 * ratio;
        }
        self.ctx.moveTo(line.sx * ratio,line.sy * ratio);
        self.ctx.lineTo(line.ex * ratio,line.ey * ratio);
        self.ctx.closePath();
        self.ctx.stroke();
    });
}


// public
Flowchart.prototype.createModule = function(options) {
    // 根据isDragCreate参数判定该模块是否需要真的创建，还是记录参数
    options.isDragCreate = options.isDragCreate || false; //创建模块时是否要拖动
    if (!options.isDragCreate) {
        var relMod = this.createRealModule(options, true)
        // 新增后 重新计算节点数
        this.showNodes();
        return relMod;
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
        var mo = this.modules && this.modules.find(function(item) {return item.feId && item.feId == options.feParentId});
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
        this.modules.push(newmodule);       
    }
    return newmodule;
}
// public
Flowchart.prototype.updateModule = function(options) {
    // 更新某个模块
    var mo = this.modules.find(function(item) {return item.feId === options.feId});
    mo.update(options);
}
// public
Flowchart.prototype.removeChildModule = function(parentId, childId) {
    // 删除某个子模块
    var parent = this.modules.find(function(item) {return item.feId === parentId});
    parent.removeChild(childId);
    // 删除模块后节点会变化
    this.showNodes();
}
// public
Flowchart.prototype.removeChildren = function(parentId) {
    // 删除该模块下的所有子模块
    var parent = this.modules.find(function(item) {return item.feId === parentId});
    parent.removeChildren();

    // 删除模块后节点会变化
    this.showNodes();
}
// public
Flowchart.prototype.createChildren = function(parentId, children=[]) {
    // 批量增加子模块
    var parent = this.modules.find(function(item) {return item.feId === parentId});
    var self = this,
        scrollDistance = this.scrollDistance();
    children.forEach(function(child) {
        var childModule = parent.addBranch(child);
        childModule.initDraw();
        self.moduleLineRestore(childModule, scrollDistance);
        self.modules.push(childModule);
    });
    // 增加子模块 会增加节点数
    self.showNodes();
    this.drawLines();
}

Flowchart.prototype.scrollDistance = function() {
    // 滚动容器距离
    return {
        scrollLeft: this.scrollParent.scrollLeft() || 0,
        scrollTop: this.scrollParent.scrollTop() || 0
    }
}

Flowchart.prototype.destroy = function() {
    $('body').off('mousemove', this.onLineBind);
    $('body').off('click', this.onLineClickBind);
    $('body').off('keyup', this.deleteLineBind);
}

//public  获取节点数
Flowchart.prototype.getAllNodes = function() {
    var nodes = this.scrollParent.find('.dragableRect') || [];
    return nodes.length;
}

// publci 获取已连接节点数
Flowchart.prototype.getConnectedNodes = function() {
    // lines的所有端点去重, 开始节点Id模块与结束节点模块会相同， 需要区分，属于不同节点
    // node {
    //      type: 'start' ,// end  开始还是结束节点
    //      feId: '' //模块Id
    // }
    var nodes = [];
    this.lines.forEach(function(line) {
        nodes.push({ type: 'start', feId: line.start.feId});
        line.end && nodes.push({ type: 'end', feId: line.end.feId });
    })
    // 去重
    var uniqueNodes = [];
    nodes.forEach(function(node) {
        if (!uniqueNodes.find(function(uninode) { return uninode.type === node.type && uninode.feId === node.feId})) {
            uniqueNodes.push(node);
        }
    });
    
    return uniqueNodes.length;
}

// 节点数相关信息显示在页面内容上
Flowchart.prototype.showNodes = function() {
    var allNodes = this.getAllNodes(),
        connectNodes = this.getConnectedNodes();
    this.allNodesEle.html(allNodes);
    this.connectNodesEle.html(connectNodes);
}

// 
Flowchart.prototype.save = function () {
    var mos = [];
    this.modules.forEach(function(item) {
      var obj = {
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
    modules.map(function(item) {return Object.assign(item, JSON.parse(item.viewInfo))});
    var scrollDistance = this.scrollDistance(),
        self = this;
    // 先恢复父模块和普通模块
    console.time('restore');

    var childModules = modules.filter(function(item) {return item.feType === 'branch'}),
        otherModules = modules.filter(function(item) {return item.feType !== 'branch'});
    otherModules.forEach(function(item) {self.moduleRestore(item)});
    console.timeEnd('restore');

    childModules.forEach(function(item) {self.moduleRestore(item)});

    this.lines.forEach(function(line) {
        line.lineCoordinate(scrollDistance);
    })
    this.drawLines();
    // restore后重新计算Nodes;
    this.showNodes();
}
Flowchart.prototype.moduleRestore = function(obj)  {
    var moduleItem = this.createRealModule(Object.assign(obj));
    this.moduleLineRestore(moduleItem);
}
Flowchart.prototype.moduleLineRestore = function(obj, scrollDistance) {
    console.time('restoremodule')
    // 模块连线恢复
    if (obj.feNextId) {
        var random = this.lineRandomIds.shift(0);
        if (!random) console.log('线段超出最大值1000')
        var feId = 'line' + new Date().getTime() + random;
        var line = new Baseline({ originX: this.originX, originY: this.originY, feId });
        line.start = { feId: obj.feId };
        line.end = { feId: obj.feNextId};
        if (scrollDistance) line.lineCoordinate(scrollDistance);
        line.styleEndPonit();
        this.lines.push(line);
    }
    console.timeEnd('restoremodule')
}