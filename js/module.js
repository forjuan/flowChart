class BaseModule {
    constructor(options) {
        let ratio = getRatio(); //canvas 渲染像素倍率
        let defaultOpt = {
            id: 'module' + new Date().getTime(),
            isFirst: false, //是否为开始模块
            isLast: false, // 是否为结束模块
            $parent: $('body'),
            hasDelete: false,
            hasSetting: false,
            ratio,
            originX: 0,
            originY: 0,
            text: '开始',
            width: 100,
            height: 30,
            deleteWidth: 10,
            color: '#333',
            fontColor: '#000',
            fontSize: 12,
            textX: 5,
            x: options.originX || 0,
            y: options.originY || 0,
            canvasX: 0, //canvas x 坐标
            canvasY: 0,
            containerHeight: 0, //有子模块是整体高度,
            type: 'normal'
        }
        Object.assign(this, defaultOpt, options);
        this.fontSize = this.fontSize * ratio;
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
    init() {
        // 创建一个div元素包含canvas元素
        var div = $(`<div id="${this.id}" class="basemodule ${this.className}" style="position: absolute; z-index: 1;left: ${this.x}px; top: ${this.y}px; width: ${this.width}px; height: ${this.height}px"></div>`);
        var canvas = $(`<canvas id="canvas${this.id}" width=${this.width} height=${this.height}></canvas>`);
        this.div = div;
        
        this.ctx = canvas[0].getContext('2d');
        this.$canvas = canvas;
        resetCanvasRatio(canvas, this.width, this.height, this.ratio);
       
        this.ctx.strokeStyle = this.color;
        this.ctx.strokeWidth = 1 * this.ratio;
        this.ctx.strokeRect(this.canvasX, this.canvasY, this.width * this.ratio, this.height* this.ratio);
        this.ctx.fillStyle = this.fontColor;
        this.ctx.font = this.font;
        this.ctx.fillText(this.text, this.textX, this.textY);

        if (this.canDrag) {
            div.mousedown(this.dragStart.bind(this));
            $('body').mouseup(this.dragEnd.bind(this));
            $('body').mousemove(this.drag.bind(this));
        }
      

        if (this.hasDelete) {
            var width = this.deleteWidth;
            var rx = 10;
            var ty = (this.height - width)/2;
            var $delete = $(`<div id="delete${this.id}"style="position: absolute; right: ${rx}px; top: ${ty}px; width: ${width}px; height: ${width}px"></div>`);
            var canvasDelete = $(`<canvas style="position: absolute; left: 0px; top:0px" width=${width} height=${width}></canvas>`);
            var deletectx = canvasDelete[0].getContext('2d');
            this.delete = $delete;
            resetCanvasRatio(canvasDelete, width, width, this.ratio);
            deletectx.strokeStyle = '#333';
            deletectx.lineWidth = 1 * this.ratio;
            deletectx.beginPath();
            deletectx.moveTo(0, 0);
            deletectx.lineTo(width * this.ratio, width * this.ratio);
            deletectx.moveTo(0, width * this.ratio);
            deletectx.lineTo(this.ratio * width, 0);
            deletectx.stroke();
            $delete.on('click', () => this.destroy())
            $delete.append(canvasDelete);
            div.append($delete);
        }

        // 设置模块
        if (this.hasSetting) {
            if (this.hasDelete) {
                var right = 10 + this.deleteWidth + 10;
            } else {
                var right = 10;
            }
            var top = (this.height - 10)/2;
            var $setting = $(`<div id="setting${this.id}" style="position: absolute; right: ${right}px; top: ${top}px; width: 10px; height: 10px"></div>`);
            $setting.load('setting.svg');
            this.$setting = $setting;
            div.append($setting);
            $('body').on('mousedown', `#setting${this.id}`, (event) => {
                event.originalEvent.stopPropagation();
                console.log('设置');
                console.log(this);
            });
        }
        this.createdragableRect();

        div.append(canvas);
        this.$parent.append(div);
    }
    createdragableRect() {
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
            line = new Baseline({ originX: this.originX, originY: this.originY });
            if ($(event.target).hasClass('leftRect')) {
                elementPro = 'end';
            } else {
                elementPro = 'start';
            }
            line[elementPro] = {
                id: nowId
            };
            line.lineCoordinate();
            this.flowchart.lines.push(line);
            this.startModuleId = nowId;
            event.dataTransfer.effectAllowed= 'copy';
            event.dataTransfer.setData('startModuleId', nowId);

        });

        $(document).on('dragover', (event) => {
            event = event.originalEvent;
            // 不阻止默认行为，否则不能drop
            event.preventDefault();
            let x = event.pageX - this.originX, y = event.pageY - this.originY;
           
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
            // 如果没有降落在合适的位置， 取消
            event = event.originalEvent;
            event.preventDefault();
            let x = event.pageX, y = event.pageY;
            let inNumber = -1;

            if (!this.flowchart.lines.find(line => !line.isEnd)) return;
            let dragableRects = Array.from($('.dragableRect.leftRect'));
            let drop = dragableRects.find(rect => {
                if (this.contains(this.id, rect)) return false;
                let rectOffset = $(rect).offset(),
                    rectWitdh = $(rect).width() + 2;
                if (!(x < rectOffset.left|| x > (rectOffset.left + rectWitdh) || y < rectOffset.top || y > (rectOffset.top + rectWitdh))) {
                    return true;
                } else {
                    return false;
                }
            });
            if (drop) return;
            this.flowchart.lines.find((line, index) => {
                if (line.isEnd) return;

                if (this.id == line.start.id) {
                    line.destroy();
                    inNumber = index;
                }
            });
            this.flowchart.lines.splice(inNumber, 1);
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
            let x = fmodule.x - fmodule.originX, y = fmodule.y - fmodule.originY + fmodule.height/2;
            if (id == nowId) return;
            this.flowchart.lines.forEach(e => { 
                if (e.isEnd) return;
                if (e.start && e.start.id == id) {
                    e.setPoint({
                        end: { id: nowId }
                    });
                    // let startmo = this.flowchart.modules.find(imo => e.start.id == imo.id);
                    // startmo.nextId = 
                    e.update({ex: x, ey: y});
                }
            });
            this.flowchart.drawLines();
        });
    }
    dragStart(event) {
        if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
        this.isDrag = true;
        if (this.isDrag) {
            this.oldmouseX = event.pageX;
            this.oldmouseY = event.pageY;
        }
    }
    dragEnd(event) {
        this.isDrag = false;
    }
    drag(event) {
        if ($(event.target).is(this.$setting) || $(event.target).hasClass('dragableRect')) return;
        if(!this.isDrag) return;
        // 在拖拽过程中
        let offsetX = event.pageX - this.oldmouseX,
            offsetY = event.pageY - this.oldmouseY;
        this.x = this.x + offsetX;
        this.y = this.y + offsetY;
        this.oldmouseX = event.pageX;
        this.oldmouseY = event.pageY;
        let width = this.containerWidth || this.width; //暂时没有containerWidth, 预留
        let height = this.containerHeight || this.height;
        // 边界检测
        if (this.x < this.originX) this.x = this.originX;
        if (this.x > this.originX + this.flowchart.width - width) this.x = this.originX + this.flowchart.width - width;

        if (this.y < this.originY) this.y = this.originY;
        if (this.y > this.originY + this.flowchart.height - height) this.y = this.originY + this.flowchart.height - height;
        this.dragDom();
    }
    contains(ancestorId, descendant) {
        let ancestor = document.getElementById(ancestorId);
        return ancestor && $.contains(ancestor, descendant);
    }

    dragDom() {
        this.div.css({
            left: this.x,
            top: this.y
        });
        let dragableRect = Array.from(this.div.find('.dragableRect'));
        dragableRect.length && dragableRect.forEach(rect => {
            this.flowchart.lines.forEach(line => {
                let parentOffset = $(rect).position();
                let rectClass = '.'+ rect.className.replace(' ', '.');
                if ($(`#${line.start.id} ${rectClass}`).is($(rect)) || $(`#${line.end.id} ${rectClass}`).is($(rect))) {
                    line.lineCoordinate();
                } 
            });
        });
        this.flowchart.drawLines();
    }
    destroy() {
        //  删除相关联的线
        // let line = lines.find((line) => line.start.id == this.id || line.end.id == this.id);
        this.deleteRelaLines(this.id, this.children);
        this.div.remove();
        // 还没消除本身对象
    }

}
class ChildModule extends BaseModule {
    constructor(options) {
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
        childModuleOpt.x = childModuleOpt.gap || 10;
        childModuleOpt.y = childModuleOpt.parentHeight + (childModuleOpt.childrenLength + 1) * childModuleOpt.gap + (childModuleOpt.childrenLength * childModuleOpt.height);

        super(childModuleOpt);
        this.init();
        this.childDraw();
    }
    childDraw() {
        $(`#${this.id}`).css({
            backgroundColor: 'rgba(238, 238, 238, 0.5)'
        })
    }
    // contains(childModuleId, descendant) {
    //     let ancestor = null;
    //     // if ($(`#${childModuleId}`).parent().attr('id') && $(`#${childModuleId}`).parent().attr('id').indexOf('containModule') > -1) return true;
    //     // return false;
    //     // if (childModuleId == this.id) {
    //     //     ancestor = document.getElementById(this.parentId);
    //     // }
    //     return ancestor && $.contains(ancestor, descendant);
    // }
}

class ContainModule extends BaseModule {
    constructor(options) {
        let containOpt = {
            id: 'containModule' + new Date().getTime(),
            canbeEnd: true,
            canbeStart: false,
            hasSetting: true,
            childrenGap: 10,
            type: 'branchModule',
            children: []
        }
        super(Object.assign(containOpt, options));
        this.init();
        this.containDraw();
        this.addBranch({id: 'defaultChild', text: '请添加分支', canbeStart: false})
    }
    addBranch(options) {
        if (this.children.length && this.children.find(child => child.id == 'defaultChild')) {
            this.children = this.children.filter(child => child.id != 'defaultChild');
        }
        options = Object.assign(options, { 
            $parent: $(`#${this.id}`),
            parentId: this.id, 
            parentwidth: this.width, 
            parentHeight: this.height, 
            gap: this.childrenGap, 
            childrenLength: this.children.length,
            originX: this.originX,
            originY: this.originY,
            containerId: this.bid
        })
        let mod = new ChildModule(options);
        this.childrenHeight = mod.height;
        this.children.push(mod);
        this.resize();
        return mod;
    }
    containDraw() {
        $(`#${this.id}`).css({
            boxSizing: 'border-box',
            border: '1px solid #333',
            backgroundColor: 'rgba(255, 255, 255, 0.4)'
        });
    }
    resize() {
        this.containerHeight = this.height + (this.children.length+1) * this.childrenGap + this.children.length * this.childrenHeight;
        $(`#${this.id}`).css({height: this.containerHeight});
    }
}

