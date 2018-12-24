/**
 * DEVELOPED BY
 * alice.luojuan@qq.com
 *
 * WORKS WITH:
 * IE8*, IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+, BESEN, Rhino 1.7+
 * For IE8 (and other legacy browsers) WatchJS will use dirty checking  
 *
 * FORK:
 * https://github.com/forjuan/flowChart
 *
 * LICENSE: MIT
 */

"use strict";
(function (factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        window.Flowchart = factory;
    }
}((function () {
    // flowchart , for create flowchart
    function Flowchart(options={}) {
        this.lines = [];
        this.modules = [];
        this.ratio = getRatio();
        this.width = options.canvasWidth || 1400, //
        this.height =  options.canvasHeight ||1000, 
        this.themeColor = '#12d2cb';
        this.creatingModule = null;
        this.rectWidth = 12;
        this.showNodesWraper = true;
        
        this.deleteIcon = 'icon-IVR-shanchu';
        this.lineRandomIds = [];
        this.moduleRandomIds = [];
        this.clickLineOnModule = false; //是否点击到线上
        
        this.$wraper = options.wraper ? $(options.wraper) : $('body')
    
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

        // 创建canvas容器元素
        var scrollParent = $('<div class="flowchart-father" style="position: relative;overflow: auto; width: 100%; height: 100%"></div');
        this.scrollParent = scrollParent;
        this.$parent = $('<div class="bgcontainer"></div>')
        this.canvas = $('<canvas class="flowchart-canvas" ></canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.$wraper.append(this.scrollParent)

        if (this.showNodesWraper) {
            this.$nodesWraper = $('<div class="nodes"><span class="all-nodes">总节点数：<span class="J-allNodes"></span></span><span class="connected-nodes">已连接节点数：<span class="J-connectedNodes"></span></span></div>')
            this.scrollParent.append(this.$nodesWraper);
            this.allNodesEle = this.scrollParent.find('.J-allNodes');
            this.connectNodesEle = this.scrollParent.find('.J-connectedNodes');
        }
        this.$parent.append(this.canvas);
        this.scrollParent.append(this.$parent)
        this.ctx = this.canvas[0].getContext('2d');
        this.originX = this.scrollParent.offset().left;
        this.originY = this.scrollParent.offset().top;

        resetCanvasRatio(this.canvas, this.width, this.height, this.ratio);
        // 创建删除连线元素
        var self = this;
        var $deLineIcon = $('<i class="'+ this.deleteIcon + ' delete-line"></i>');
        // 根据设计图而来
        $deLineIcon.widthValue = 23;
        $deLineIcon.on('click', function(ev) {
            self.deleteFocusLine();
        });
        $deLineIcon.css({
            display: 'none',
        })
        this.$copyMove = $('<div id="copyMove">1</div>');
        this.scrollParent.append($deLineIcon);
        this.scrollParent.append(this.$copyMove);
        this.$deLineIcon = $deLineIcon;
    }
    Flowchart.prototype.initEvent = function() {
        var self = this;
        this.onLineBind = this.onLine.bind(this);
        this.onLineClickBind = this.onLineClick.bind(this);
        this.deleteLineBind = this.deleteLineEv.bind(this);
        // 移动到连线上
        this.scrollParent.on('mousemove', this.onLineBind);
        // 聚焦连线
        this.scrollParent.on('click', this.onLineClickBind);
        //删除连线
        $('body').on('keyup', this.deleteLineBind);
        // window resize change
        $(window).on('resize', function () {
            self.originX = self.scrollParent.offset().left;
            self.originY = self.scrollParent.offset().top;
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
                self.creatingModule = self.createRealModule(Object.assign(self.creatingModule, { x, y, toCenter: true }), false);
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
    
                // 重新生成， 否则id相同的元素会被删除
                delete obj.feId;
                delete obj.$title;
                delete obj.$icon;
                delete obj.$content;
                delete obj.toCenter;
                self.creatingModule.children && self.creatingModule.children.map(function(item) {
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
                newmodule.children && newmodule.children.length && newmodule.children.forEach(function(item) { self.modules.push(item)});
                
                // 新增模块， 节点数变化
                self.showNodes();
            } 
        })
    
        // 完成拖拽时，若没在画布区域内放置， 清除临时模块
        $('body').on('dragend', function(ev) {
            if (self.creatingModule) {
                self.creatingModule.moveEnd && self.creatingModule.moveEnd(ev);
                self.creatingModule.destroy && self.creatingModule.destroy();
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
        $('#' + line.start.feId + '>.title-wraper>.dragableRect.start').removeClass('connected');
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
        delines.forEach(function(deline) {return self.deleteLine(deline) });
    }
    Flowchart.prototype.onLine = function(event) {
        // 移动到连线上
         event = event.originalEvent;
         var scrollDistance = this.scrollDistance(),
             self = this;
         var x = event.pageX - this.originX + scrollDistance.scrollLeft,
             y = event.pageY - this.originY + scrollDistance.scrollTop;
        //  重置
         this.scrollParent.css('cursor', 'default');
         $('.basemodule:hover').css('cursor', 'move');
         
         this.lines.forEach(function(line) {
             if (line.isOnline(x, y)) {
                if($(event.target).parents().hasClass('basemodule')) {
                    $('.basemodule:hover').css('cursor', 'pointer');
                }
                self.scrollParent.css('cursor', 'pointer');
             } 
         });
    }
    Flowchart.prototype.onLineClick = function(event) {
        // 如果不是点击在canvas上 而是点在模块上，不操作
        event = event.originalEvent;
        var scrollDistance = this.scrollDistance();
        var x = event.pageX - this.originX + scrollDistance.scrollLeft,
            y = event.pageY - this.originY + scrollDistance.scrollTop;
        this.cancelFocusLine();
    
        // 重置标识
        this.clickLineOnModule = false;
        //    已有聚焦的线
        var online = this.lines.find(function(line) {return line.isOnline(x, y)});
        if (online) {
            // 如果点击的是在模块上，又在线上，添加标识， 以便区分模块自身点击
            if($(event.target).parents().hasClass('basemodule')) {
                this.clickLineOnModule = true;
            }
            online.focus = true;
            online.lineWidth = 3;
            this.showDelteLineIcon(event, scrollDistance, online)
        } else {
            this.$deLineIcon.hide();
        }
        this.drawLines();
    }
    Flowchart.prototype.cancelFocusLine = function(shouldRedraw) {
        this.lines.forEach(function(line) {line.focus = false; line.lineWidth = 1});
        if (shouldRedraw) {
            this.drawLines();
            this.$deLineIcon.hide();
        }
    }
    Flowchart.prototype.showDelteLineIcon = function(event,scrollDistance, line) {
        // 显示在线段的垂直平分线上，距离线段中点的距离distance
        var left, top, width = this.$deLineIcon.widthValue + 3,
            allWidth = this.width,
            allHeight = this.height,
            distance = 8,
            k,//垂直平分线段的斜率,
            b, // y=kx+b的b
            point = {x: -100, y: -100}, //需要显示的点位置
            linePoint = { x: event.pageX - this.originX + scrollDistance.scrollLeft, y: event.pageY - this.originY + scrollDistance.scrollTop };
        if (line.sx === line.ex) {
            linePoint.x = line.ex;
            // 斜率不存在时
            point.x = linePoint.x - distance - width;
            point.y = linePoint.y;
            if (!this.inCanvas(point, width, width)) {
                point.x = linePoint.x - distance;
            }
        } else if (line.sy === line.ey) {
            // 根据直线方程求鼠标的点
            linePoint.y = line.ey;
            // 斜率为0时
            point.x = linePoint.x;
            point.y = linePoint.y- distance - width;
            if (!this.inCanvas(point, width, width)) {
                point.y = linePoint.y + distance;
            }
        } else {
            // 存在斜率且不为0
            k = -(line.ex - line.sx)/(line.ey - line.sy);
            b = linePoint.y - k * linePoint.x;
            // 过鼠标的点垂直于线段的交点为linePoint.
            // 根据二元一次方程
            // ①(y1-y)/(x1-x) = -k; （x1,y1）为鼠标的点
            // ②y=kx+b;
            // 得 x = (y1+kx1-b)/2k;
            // linePoint.x = (linePoint.y + kl * linePoint.x - bl)/ (2 * kl);
            // linePoint.y = kl*linePoint.x + bl;
            var points = this.getLinePoints(k, b, linePoint, distance);
            point = points.point1;
            //  x<鼠标x时， 距离应算上自身距离
             if (points.point1.x < linePoint.x) {
                point.x = point.x - width;
            }
            // y<鼠标y时， 距离应算上自身距离
            if (points.point1.y < linePoint.y ) {
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
            if (points.y < linePoint.y ) {
                point.y = point.y - width;
            }

    
        }
        
        this.$deLineIcon.css({
            display: 'block',
            left: point.x + 'px',
            top: point.y + 'px'
        }) 
    }
    // 根据k(不为0)以及，b以及其中一个点，求解两个点
    Flowchart.prototype.getLinePoints = function(k, b, point, l) {
        // 第二步：求得在直线y=kx+b上，距离当前坐标距离为L的某点
        // 一元二次方程Ax^2+Bx+C=0中,
        // 一元二次方程求根公式：
        // 两根x1,x2= [-B±√(B^2-4AC)]/2A
        // ①(y-y0)^2+(x-x0)^2=L^2;
        // ②y=kx+b;
        // 式中x,y即为根据以上lenthUnit单位长度(这里就是距离L)对应点的坐标
        // 由①②表达式得到:(k^2+1)x^2+2[(b-y0)k-x0]x+[(b-y0)^2+x0^2-L^2]=0， x0,y0即point的坐标
        var A = k * k +1,
            B = 2*((b-point.y) * k - point.x),
            C = Math.pow(b - point.y,2) + Math.pow(point.x, 2) - Math.pow(l, 2);
        var x1 = (-B-Math.sqrt(Math.pow(B, 2) - 4 * A * C))/(2*A),
            y1 = x1*k + b,
            x2 = (-B+Math.sqrt(Math.pow(B, 2) - 4 * A * C))/(2*A),
            y2 = x2*k +b;
        return {
            point1: {x: x1, y: y1},
            point2: {x: x2, y: y2}
        }
    
    }
    Flowchart.prototype.inCanvas = function(point, width, height) {
        // 矩形边界检测
        return  0 < point.x && point.x + width < this.width &&
                0 < point.y && point.y + height < this.height;
    }
    Flowchart.prototype.inScrollParent = function(point, d) {
        // point 为pagex, pagey相对于整个文档的距离
        // 某个点是否在scrollparent 区域内
        // d 比区域小d的边界区域
        var offset = this.scrollParent.offsetValue || this.scrollParent.offset(),
            width = this.scrollParent.widthValue || this.scrollParent.width(),
            height = this.scrollParent.heightValue || this.scrollParent.height();
        this.scrollParent.offsetValue = offset;
        this.scrollParent.widthValue = width;
        this.scrollParent.heightValue = height,
        d = d || 0;
        // 矩形边界检测
        return offset.left + d < point.x && point.x < offset.left + width - d &&
                offset.top + d < point.y && point.y < offset.top + height - d;
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
        this.$deLineIcon.hide();
    
        // 删除后节点数变化
        this.showNodes();
    }
    Flowchart.prototype.drawLines = function(scrollDistance) {
        var ratio = this.ratio,
            self = this;
        this.ctx.clearRect(0, 0, this.width * ratio, this.height * ratio);
        scrollDistance = scrollDistance || this.scrollDistance();
    
        this.ctx.strokeStyle = this.themeColor;
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
        this.scrollParent.off('mousemove', this.onLineBind);
        this.scrollParent.off('click', this.onLineClickBind);
        $('body').off('keyup', this.deleteLineBind);
    }
    
    //public  获取节点数
    Flowchart.prototype.getAllNodes = function() {
        var nodes = this.scrollParent.find('.dragableRect') || [];
        return nodes.length;
    }
    
    // publc 获取已连接节点数
    Flowchart.prototype.getConnectedNodes = function() {
        // 结点连接后有connected的标识
        var nodes = this.scrollParent.find('.dragableRect.connected') || [];
        return nodes.length;
    }
    
    // 节点数相关信息显示在页面内容上
    Flowchart.prototype.showNodes = function() {
        var allNodes = this.getAllNodes(),
            connectNodes = this.getConnectedNodes();
        this.allNodesEle.html(allNodes);
        this.connectNodesEle.html(connectNodes);
    }
    
    // public 保存所有模块
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
              titleIcon: item.titleIcon,
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
    
    // public 恢复所有模块
    Flowchart.prototype.restore = function(modules = []) {
        // 恢复模块
        if(!modules.length) {
            if (!localStorage.getItem('modules')) return;
            modules = JSON.parse(localStorage.getItem('modules'));
        }
        modules.map(function(item) {return Object.assign(item, JSON.parse(item.viewInfo))});
        var scrollDistance = this.scrollDistance(),
            self = this;
        // 先恢复父模块和普通模块
    
        var childModules = modules.filter(function(item) {return item.feType === 'branch'}),
            otherModules = modules.filter(function(item) {return item.feType !== 'branch'});
        otherModules.forEach(function(item) {self.moduleRestore(item)});
    
        childModules.forEach(function(item) {self.moduleRestore(item)});
    
        this.lines.forEach(function(line) {
            line.styleEndPonit();
            line.lineCoordinate(scrollDistance, self.rectWidth);
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
        // 模块连线恢复
        if (obj.feNextId) {
            var random = this.lineRandomIds.shift(0);
            if (!random) console.log('线段超出最大值1000')
            var feId = 'line' + new Date().getTime() + random;
            var line = new Baseline({ originX: this.originX, originY: this.originY, feId });
            line.setPoint({
                start: { feId: obj.feId },
                end: { feId: obj.feNextId}
            });
            if (scrollDistance) line.lineCoordinate(scrollDistance, this.rectWidth);
            this.lines.push(line);
        }
    }





    // 连线
    function Baseline(options={}) {
        var defaultOpts = {
            feId: 'line' + new Date().getTime(),
            originX: 0,
            originY: 0,
            isEnd: false,
            lineRange: 8, // 移到线周围相距的距离
            themeColor: '#12d2cb'
        }
        Object.assign(this, defaultOpts, options);
    }
    Baseline.prototype.setPoint = function (opt={}) {
        // 有端点后设置值
        this.sx = opt.sx || this.sx;
        this.sy = opt.sy || this.sy;
        if (opt.start) this.start = opt.start;
        if (opt.end) {
            this.end = opt.end;
        };
        if (this.start && this.end) {
            this.isEnd = true;
            this.styleEndPonit();
        }
    }
    Baseline.prototype.styleEndPonit = function() {
        if (this.isEnd) {
            $('#'+this.end.feId + '>.title-wraper>.dragableRect.end,' + '#' +this.start.feId + '>.title-wraper>.dragableRect.start').addClass('connected');
        } else {
            $('#'+this.end.feId + '>.title-wraper>.dragableRect.end').removeClass('connected');
        }
    }
    
    Baseline.prototype.update = function(opt={}) {
        // 拖动时 没有端点时更新
        if (opt.dir === 'start') {
            this.sx = opt.x || this.sx;
            this.sy = opt.y || this.sy;
        } else if (opt.dir === 'end') {
            this.ex = opt.x || this.ex;
            this.ey = opt.y || this.ey;
        }
        
        if (this.start && this.end) {
            this.isEnd = true;
            this.styleEndPonit();
        }
        // 设置
    }
    Baseline.prototype.reconnected = function(deleteDir, alllines) {
        this.isEnd = false;
        this.focus = false;
        var self = this;
        var otherEnd = alllines.find(function (line) { return line.feId != self.feId && line.end.feId === self.end.feId });
        if(!otherEnd) {
            this.styleEndPonit();
        }
        $('#' + this.start.feId + ' .start').removeClass('connected');
        this[deleteDir] = null;
    }
    
    Baseline.prototype.lineCoordinate = function(scrollDistance = {}, rectWidth) {
        // 当拖动模块时， 连线端点坐标重新获取
        // 传入滚动元素 以便获取滚动值
        var scrollLeft = scrollDistance.scrollLeft || 0,
            scrollTop = scrollDistance.scrollTop || 0;
        if (this.start) {
            var startRect = $(`#${this.start.feId} .start`)[0],
                offset = $(startRect).offset() || {};
            this.sx = offset.left - this.originX + scrollLeft + rectWidth/2;
            this.sy = offset.top - this.originY + scrollTop + rectWidth/2;
        }
        if (this.end) {
            var endRect = $(`#${this.end.feId} .end`)[0],
                offset = $(endRect).offset();
            this.ex = offset.left - this.originX + scrollLeft + rectWidth/2;
            this.ey = offset.top -  this.originY + scrollTop + rectWidth/2;
        }
    }
    
    Baseline.prototype.isOnline = function(x, y) {
        // 近似垂直线， 斜率为0
        var miny = Math.min(this.ey, this.sy),
            maxy = Math.max(this.ey, this.sy);
        if (Math.abs(this.ex - this.sx) <= this.lineRange && (x + this.lineRange > this.ex && x - this.lineRange < this.ex) && y >=miny && y <=maxy) return true;
        
        // 直线
        var k = (this.ey - this.sy) / (this.ex - this.sx);
        var b = this.ey - k * this.ex;
        var minx = Math.min(this.ex, this.sx),
            maxx = Math.max(this.ex, this.sx);
        if (k * x + b + this.lineRange > y && k * x + b - this.lineRange < y && x >= minx && x <= maxx) {
            return true;
        } else {
            return false;
        }
    }
    
    Baseline.prototype.destroy = function() {
        this.isEnd = true;
        this.isDestroy = true;
    }
    
    Baseline.prototype._lineHover = function(evt) {
        console.log('line hover');
    }
    Baseline.prototype._lineClick = function(evt) {
        console.log('line click');
    }

    // 模块
    function BaseModule (options = {}) {
        var ratio = getRatio(); //canvas 渲染像素倍率
        // this这样属性才能被继承
        this.isLast = false; // 是否为结束模块
        this.isFirst = false; //是否为开始模块
        this.hasDelete = false;
        this.hasSetting = true;
        this.ratio = ratio;
        this.text = '标题';
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
        this.titleIcon = 'icon-shuxingtushouqi';
        this.position = 'absolute';
        this.toCenter = false; //创建时坐标再移到模块横向中点
        Object.assign(this, options);
        this.className = options.className ? options.className : '' + ' flowBaseModule';
        this.fontSize = this.fontSize * ratio;
        this.text = options.text ? options.text : this.isFirst ? '开始': (this.isLast ? '结束': '标题');
        this.textX = this.textX * ratio;
        this.$icon = undefined;
        this.$title = undefined;
    
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
        this.font = `${this.fontSize}px Microsoft Yahei`;
        this.textY = this.height* this.ratio - (this.height* this.ratio - this.fontSize)/2; //canvas 以文字底端算y距离
    }
    BaseModule.prototype.update = function(newModule) {
        Object.assign(this, newModule);
        this.drawModule();
    }
    BaseModule.prototype.drawModule = function() {
        // 更新后可能更改的dom
        var i, title, titleClass;
        if (!this.$icon && this.titleIcon) {
            i = $('<i class="' + this.titleIcon + ' ivricon "></i>');
            this.$icon = i;
            this.titleWraper.append(i);
        } else if(this.$icon) {
            this.$icon.removeClass().addClass(this.titleIcon + ' ivricon');
        }
        if (!this.$title) {
            titleClass = this.titleIcon ? 'title-text hasLeftSepa' : 'title-text hasLeftMargin';
            title = $('<span class="'+ titleClass + '" title="' + this.text + '">'+ this.text +'</span>');
            this.$title = title;
            this.titleWraper.append(title);
        } else {
            this.$title.html(this.text);
        }
    }
    BaseModule.prototype.init = function() {
        this.$parent = this.$parent || (this.flowchart && this.flowchart.$parent)
        var self = this;
        this.rectWidth = this.flowchart.rectWidth;
        if (!this.feId) {
            var random = this.flowchart.moduleRandomIds.shift(0);
            if (!random) console.log('模块数量超出最大值1000')
            this.feId = 'module' + new Date().getTime() + random;
        }
        var div = $('<div id="' +this.feId+'" class="basemodule ' + this.className +'" style="position:' + this.position +'"></div>');
       
      
        this.div = div;
        this.titleWraper = $('<div class="title-wraper"></div>');
        if (this.canDrag) {
            div.mousedown(this.moveStart.bind(this));
            $('body').mousemove(this.moveDrag.bind(this));
            $('body').mouseup(this.moveEnd.bind(this));
            $('html').mouseleave(this.moveEnd.bind(this));
        }
        
        if (this.hasDelete) {
            var width = this.deleteWidth;
            var rx = 10;
            var ty = (this.height - width)/2;
            var $delete = $('<div class="module-delete" id="delete' + this.feId +'"><i class="'+ this.flowchart.deleteIcon + '"></i></div>');
            this.delete = $delete;
            $delete.on('mousedown', function(event) {
                event.stopPropagation();
                self.destroy();
                // 删除后节点数变化
                self.flowchart.showNodes();
            })
            this.titleWraper.append($delete);
        }
        this.drawModule();
        div.append(this.titleWraper);
        this.$parent.append(div);
        if (this.toCenter) {
            var divWidth = this.width || this.div.width(),
                divTitleHeight = this.titleHeight || this.titleWraper.height();
            this.x -= divWidth/2;
            this.y -= divTitleHeight/2;
        }
        if (this.position === 'absolute') {
            div.css({
                left: this.x + 'px',
                top: this.y + 'px'
            })
        }
        this.createdragableRect();
    
    }
    BaseModule.prototype.createdragableRect = function() {
        var self = this;
        // 创建连接点
        if (this.canbeEnd) {
            var leftdiv = $('<div class="dragableRect leftRect end" draggable="true"></div>');
            this.titleWraper.append(leftdiv);
        }
        if (this.canbeStart) {
            var rightdiv = $('<div class="dragableRect rightRect start" draggable="true"></div>');
            this.titleWraper.append(rightdiv);
        }
        $('#' + this.feId +'>.title-wraper>.dragableRect').on('mousedown', function(event) {
            event.stopPropagation();
        })
    
        $('body').on('dragstart', '#' + this.feId +'>.title-wraper>.dragableRect', function(event)  {
            event = event.originalEvent;
            // 连线只能从模块右边开始连线
            var nowId = $(event.target).parent().parent().attr('id'),
                dir = $(event.target).hasClass('start') ? 'start' : 'end',
                otherdir = dir === 'start' ? 'end' : 'start';
    
            
            // 如果是聚焦的线上的点， 要重新连接
            var focuesLine = self.flowchart.lines.find(function(line) { return line.focus && line[dir].feId === nowId });
            if (focuesLine) {
                // 重新开始
                focuesLine.reconnected(otherdir, self.flowchart.lines);
                self.flowchart.$deLineIcon.hide();
            }
    
            // 同一起点只能连线一次
            if (dir == 'start' && $(event.target).hasClass('connected')) return;
            event.dataTransfer.setDragImage(event.target,0,0);
    
            if (!focuesLine) {
                var elementPro = '',
                    line;
                line = new Baseline({ originX: self.flowchart.originX, originY: self.flowchart.originY});
                
                line[dir] = {
                    feId: nowId
                };
                line.lineCoordinate(self.flowchart.scrollDistance(), self.rectWidth);
                self.flowchart.lines.push(line);
            }
           
            // for dragover access this data, 拖拽开始点
            var linefirstPoint = dir + ' ' + nowId
            self.flowchart.currentDragStartModuleId = linefirstPoint;
            event.dataTransfer.effectAllowed= 'copy';
    
            // firefox 需要设置Data否则后续事件不会触发
            event.dataTransfer.setData('dragStartModuleId', linefirstPoint);
        });
    
        // 防止绑定多次同一个函数
        this.flowchart.canvas.parent().unbind('dragover.BaseModuleNode');
        this.flowchart.canvas.parent().bind('dragover.BaseModuleNode', function(event) {
            event = event.originalEvent;
            // 不阻止默认行为，否则不能drop
            event.preventDefault();
            var linefirstPoint = self.flowchart.currentDragStartModuleId;
            if (!linefirstPoint) return; // 不是连线触发的
            var linefirst = linefirstPoint.split(' '),
                dir = linefirst[0],
                otherdir = dir == 'start' ? 'end': 'start',
                nowId = linefirst[1];
             // 如果鼠标在可视区外指定距离，模块不被拖动, 如果能滚动则自动滚动画布
            if (!self.flowchart.inScrollParent({x: event.pageX, y: event.pageY}, 40)) {
                self.moveScroll(event);
            } else {
                self.stopScroll()
            }
            // 当鼠标不在区域内才不计算
            if (!self.flowchart.inScrollParent({x: event.pageX, y: event.pageY})) return;
            var scrollDistance = self.flowchart.scrollDistance();
            var x = event.pageX - self.flowchart.originX + scrollDistance.scrollLeft, y = event.pageY - self.flowchart.originY + scrollDistance.scrollTop;
            
            // 不能放置在相同属性的端点上， 如start  不能放置在start上, 且 如果是是end 放置的start不能连线
            if ($(event.target).hasClass(otherdir) && !(otherdir === 'start' && $(event.target).hasClass('connected'))) {
                event.dataTransfer.dropEffect = 'copy';
            } else {
                event.dataTransfer.dropEffect = 'none';
            }
            self.flowchart.lines.forEach(function(line) { 
                if (line.isEnd) return;
                if(line[dir] && line[dir].feId == nowId) {
                    line.update({dir: otherdir, x, y});
                    line.lineCoordinate(scrollDistance, self.rectWidth);
                }
            });
            self.flowchart.drawLines(scrollDistance);
        });
        $('body').on('dragend', '#'+ this.feId + '>.title-wraper>.dragableRect', function(event) {
            // 如果没有降落在合适的位置， 取消该连线
            event = event.originalEvent;
            self.isLinging = false;
            event.preventDefault();
            self.stopScroll()
            // 没有两个端点的连线
            if (!self.flowchart.lines.find(function (line){ return !line.isEnd})) return;
            var myline = self.flowchart.lines.find(function(line) {
                if (line.isEnd) return false;
                if (line.start && self.feId == line.start.feId || (line.end && self.feId == line.end.feId )) {
                    line.destroy();
                    return true;
                }
                return false;
            });
            self.flowchart.lines = self.flowchart.lines.filter(function(line){return line !== myline })
            self.startModuleId = null;
            self.flowchart.drawLines();
            self.flowchart.showNodes();
        });
    
        // bind事件命名空间， 防止多次重复触发
        $('body').unbind('drop.BaseModuleNode')
        $('body').bind('drop.BaseModuleNode', '.dragableRect', function(event) {
            event = event.originalEvent;
            event.preventDefault();
            self.stopScroll()
            // 找到设置的id  找到line
            var linefirstPoint = event.dataTransfer.getData('dragStartModuleId');
            if (!linefirstPoint) return;
    
            // 起点只能有一个
            if ($(event.target).hasClass('start') && $(event.target).hasClass('connected')) return;
    
            var linefirst = linefirstPoint.split(' '),
                id = linefirst[1],
                dir = linefirst[0],
                otherdir = dir ==='start'? 'end': 'start',
                nowId = $(event.target).parent().parent().attr('id'),
                scrollDistance = self.flowchart.scrollDistance();
            var fmodule = self.flowchart && self.flowchart.modules.find(function(mod) {return mod.feId == nowId}) || {};      
            var x = fmodule.x, y = fmodule.y + fmodule.height/2;
    
            self.flowchart && self.flowchart.lines.forEach(function(line) { 
                if (line.isEnd) return;
                // 只有一个端点的
                if (!line[otherdir]) {
                    var obj = {};
                    obj[otherdir] =  { feId: nowId }
                    line.setPoint(obj);
                    line.lineCoordinate(scrollDistance, self.rectWidth)
                    var mostart = self.flowchart.modules.find(function (start) { return start.feId == line.start.feId}) || {};
                    var monext = self.flowchart.modules.find(function (next) { return next.feId == line.end.feId }) || {};
                    mostart.feNextId = monext.feId;
                    line.isEnd = true;
                } 
            });
            self.flowchart.drawLines();
            // 增加连线后节点数变化
            self.flowchart.showNodes();
        });
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
        // 设置标记， 点击在模块上， 以便连线点击的区分
        // 取消聚焦的线, 并重新绘画线
        this.flowchart.cancelFocusLine(true);
    
        if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
        this.isDrag = true;
        //聚焦连线清除
        this.flowchart.onLineClickBind(event);
        this.stopScroll()
        // 开始点
        this.startmouseX = event.pageX;
        this.startmouseY = event.pageY;
        this.width = this.width || this.div.width();
        this.height = this.height || this.div.height();
        this.titleHeight = this.titleHeight || this.div.find('> .title-wraper').height();
        var scrollDistance = this.flowchart.scrollDistance();
        // 鼠标跟随模块的点
        if (position === 'center') {
            this.followPoint = {
                relativeX: this.width /2,
                relativeY: this.titleHeight/2
            }
        } else {
            this.followPoint = {
                relativeX: event.pageX - this.flowchart.originX + scrollDistance.scrollLeft - this.x,
                relativeY: event.pageY - this.flowchart.originY + scrollDistance.scrollTop - this.y
            }
        }
        this.div.addClass('isMoving');
    }
    BaseModule.prototype.moveEnd = function(event) {
        if(!this.isDrag) return;
        this.isDrag = false;
    
        // 如果点击到线上不处理
        if(this.flowchart.clickLineOnModule) {
            this.flowchart.clickLineOnModule = false;
            return
        };
        this.div.removeClass('isMoving');
        var scrollDistance = this.flowchart.scrollDistance(),
            self = this;
            this.height = $('#' + this.feId).height();
        var mousePoint = { x: event.pageX - this.originX + scrollDistance.scrollLeft, y: event.pageY - this.originY + scrollDistance.scrollTop}
        // 如果鼠标停留在元素上，则显示删除图标
        if(this.x < mousePoint.x && mousePoint.x < this.x + this.width && 
           this.y < mousePoint.y && mousePoint.y < this.y + this.height) {
            this.div.find('.module-delete').show();
        }
       
        // 如果是点击 则是设置
        if (event.pageX == this.startmouseX && event.pageY == this.startmouseY && this.hasSetting) {
            var e = $.Event('modulesetting', { module: Object.assign(this)})
            this.flowchart.canvas.triggerHandler(e)
        }
        this.stopScroll()
    }
    BaseModule.prototype.moveDrag = function(event) {
        if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
        if(!this.isDrag) return;
        this.div.find('.module-delete').hide();
    
        // 如果鼠标在可视区外指定距离，模块不被拖动, 如果能滚动则自动滚动画布
        if (!this.flowchart.inScrollParent({x: event.pageX, y: event.pageY}, 20)) {
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
        var self = this;
       
        // 模块可移动区域边界检测
        if (this.x < 0) this.x = 0;
        if (this.x > 0 + this.flowchart.width - width) this.x = this.flowchart.width - width;
    
        if (this.y < 0) this.y = 0;
        if (this.y > 0 + this.flowchart.height - height) this.y = this.flowchart.height - height;
        this.dragDom();
        this.flowchart.lines.forEach(function(line) {
            // 如果连线的断点在该模块上或者其子模块上再更新坐标值， 减少计算量
            // 子模块只能做为开始节点
            if (line.start.feId === self.feId || line.end.feId === self.feId || (self.children && self.children.find(function(item){return item.feId === line.start.feId}))) {
                line.lineCoordinate(scrollDistance, self.rectWidth)
            }
        })
        this.flowchart.drawLines();
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
        var self = this;
        this.flowchart.deleteRelaLines(this.feId, this.children);
        this.div.remove();
        this.stopScroll();
        // 消除本身对象
        this.flowchart.modules = this.flowchart.modules.filter(function(item) {return item.feId !== self.feId });
    }
    
    
    // 菜单模块
    function ContainModule(options={}) {
        this.canbeEnd = true;
        this.canbeStart = false;
        this.hasSetting = true;
        this.childrenGap = 10;
        this.feType = 'branchmodule';
        this.children = [];
        this.className = 'hasChildren';
    
        Object.assign(this, options);
        this.$icon = undefined;
        this.$title = undefined;
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
            $parent: this.$content,
            flowchart: this.flowchart,
            feParentId: this.feId, 
            parentwidth: this.width, 
            parentHeight: this.height, 
            gap: this.childrenGap, 
            childrenLength: this.children.length,
            containerId: this.feId
        })
        var mod = new ChildModule(options);
        this.children.push(mod);
        return mod;
    }
    ContainModule.prototype.containDraw = function() {
        if(!this.$content) {
            this.$content = $('<div class="children-wraper"></div>');
            this.div.append(this.$content);
        }
    }
    
    ContainModule.prototype.removeChild = function(moduleId) {
        this.children = this.children.filter(function(child) {
            if(child.feId == moduleId) {
                child.destroy();
            } else {
                return child;
            }
        });
    }
    ContainModule.prototype.destroy = function() {
        //  删除相关联的线
        this.flowchart.deleteRelaLines(this.feId, this.children);
        this.div.remove();
        // 还没消除本身对象
        var modules = this.flowchart.modules,
            self = this;
        this.flowchart.modules = this.flowchart.modules.filter(function(item) {return item.feId !== self.feId});
        this.removeChildren();
    }
    
    ContainModule.prototype.removeChildren = function() {
        this.children.forEach(function(item) {return item.destroy()});
        this.children = [];
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
    ChildModule.prototype.initDraw = function() {
        if (!this.feId) {
            var random = this.flowchart.moduleRandomIds.shift(0);
            if (!random) console.log('模块数量超出最大值1000')
            this.feId = 'childModule' + new Date().getTime() + random;
        }
       
        this.init();
    }
    
    
    // 指定子模块的初始模块
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

    return Flowchart
}())))