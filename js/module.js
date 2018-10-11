class BaseModule {
    constructor(options) {
        this.id = 'module' + new Date().getTime(); 
        this.isFirst = options.isFirst || false;
        this.isLast = options.isLast || false;
        this.canbeStart = this.isLast ? false : options.canbeStart || true;
        this.canbeEnd = this.isFirst ? false : options.canbeEnd || true;
        this.$parent = options.$parent || $('body');
        this.canDrag = options.canDrag === undefined ? true : options.canDrag;

        this.hasDelete = options.hasDelete || false;
        this.hasSetting = options.hasSetting || false;
        this.originX = options.originX; //画布
        this.originY = options.originY; 
        this.text = options.text || '开始';
    
        this.x = (options.x || 0) + options.originX;
        this.y = (options.y || 0) + options.originY;
        this.shapeX = options.x || 0;
        this.shapeY = options.y || 0;
        this.width = options.width || 100;
        this.height = options.height || 30;
        this.deleteWidth = 10;
        this.shape = 'rect';
        this.color = '#333';
        this.fontSize = 12;
        this.fontColor = '#000';
        this.font = `${this.fontSize}px Microsoft Yahei`;
        this.textX = 5;
        this.textY = this.height - (this.height - this.fontSize)/2; //canvas 以文字底端算y距离
    }
    init() {
        // 创建一个div元素包含canvas元素
        var div = $(`<div id="${this.id}" class="basemodule" style="position: absolute; z-index: 1;left: ${this.x}px; top: ${this.y}px; width: ${this.width}px; height: ${this.height}px"></div>`);
        var canvas = $(`<canvas id="canvas${this.id}" width=${this.width} height=${this.height}></canvas>`);
        this.div = div;
        
        this.ctx = canvas[0].getContext('2d');
        this.ctx.strokeStyle = this.color || '#eee';
        this.ctx.strokeWidth = 1;
        this.ctx.strokeRect(this.shapeX, this.shapeY, this.width, this.height);
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
            var $delete = $(`<div id="delete${this.id}" style="position: absolute; right: ${rx}px; top: ${ty}px; width: ${width}px; height: ${width}px"></div>`);
            var canvasDelete = $(`<canvas style="position: absolute; left: 0px; top:0px" width=${width} height=${width}></canvas>`);
            var deletectx = canvasDelete[0].getContext('2d');
            this.delete = $delete;
            this.strokeStyle = '#333';
            deletectx.beginPath();
            deletectx.moveTo(0, 0);
            deletectx.lineTo(width, width);
            deletectx.moveTo(0, width);
            deletectx.lineTo(width, 0);
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

        $('body').on('dragstart', `#${this.id} .dragableRect.rightRect`, (event) => {
            event = event.originalEvent;
            // 连线只能从模块右边开始连线
            let nowId = $(event.target).parent().attr('id');
            let line = lines.find(e => e.start && nowId == e.start.id);
            if (line) return ;

            var elementPro = '';
            line = new Baseline(bgOrigin);
            if ($(event.target).hasClass('leftRect')) {
                elementPro = 'end';
            } else {
                elementPro = 'start';
            }
            line[elementPro] = {
                id: nowId
            };
            line.lineCoordinate();
            lines.push(line);
            // event.dataTransfer.effectAllowed= 'all';
            event.dataTransfer.setData('text', nowId);
        });
        $('body').on('drag', '.dragableRect.rightRect', (event) => {
            event = event.originalEvent;
            let x = event.pageX - this.originX, y = event.pageY - this.originY;
            let nowId = $(event.target).parent().attr('id');
            lines.forEach(e => { 
                if (e.isEnd) return;
                if(e.start && e.start.id == nowId) {
                    e.update({ex: x, ey: y});
                }
            });
            // event.dataTransfer.effectAllowed= 'all';
            drawLines(lines);
        });
        $('body').on('dragover',`.dragableRect.leftRect`, (event) => {
            event = event.originalEvent;
            // 不阻止默认行为，不能drop
            event.preventDefault();
            // if ($(event.target)$('#bgcontainer'))
            let noEndline = lines.find(line => !line.isEnd) || {};
            if (noEndline.start && noEndline.start.id == $(event.target).parent().attr('id')) {
    
            }
            
        });
        $('body').on('dragend', `#${this.id} .dragableRect.rightRect`, (event) => {
            // 如果没有降落在合适的位置， 取消
            event = event.originalEvent;
            let x = event.pageX, y = event.pageY;
            let inNumber = -1;
            if (!lines.find(line => !line.isEnd)) return;
            let dragableRects = Array.from($('.dragableRect.leftRect'));
            let drop = dragableRects.find(rect => {
                if (this.id == $(rect).parent().attr('id')) return false;
                let rectOffset = $(rect).offset(),
                    rectWitdh = $(rect).width() + 2;
                if (!(x < rectOffset.left|| x > (rectOffset.left + rectWitdh) || y < rectOffset.top || y > (rectOffset.top + rectWitdh))) {
                    return true;
                } else {
                    return false;
                }
            });
            if (drop) return;
            lines.find((line, index) => {
                if (line.isEnd) return;

                if (this.id == line.start.id) {
                    line.destroy();
                    inNumber = index;
                }
            });
            lines.splice(inNumber, 1);
            drawLines(lines);
        });
        $('body').on('drop', '.dragableRect.leftRect',(event) => {
            event = event.originalEvent;
            event.preventDefault();

            // 找到设置的id  找到line
            let id = event.dataTransfer.getData('text'),
                nowId = $(event.target).parent().attr('id');
            let module = allModules.find(module => module.id == nowId) || {};      
            let x = module.x - module.originX, y = module.y - module.originY + module.height/2;
            if (id == nowId) return;
           
            lines.forEach(e => { 
                if (e.isEnd) return;
                if (e.start && e.start.id == id) {
                    e.setPoint({
                        end: { id: nowId, x: this, y: y}
                    });
                    e.update({ex: x, ey: y});
                }
            });
            drawLines(lines);
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
        if (this.x < this.originX) this.x = this.originX;
        if (this.x > this.originX + Canvas.width - this.width) this.x = this.originX + Canvas.width - this.width;

        if (this.y < this.originY) this.y = this.originY;
        if (this.y > this.originY + Canvas.height - this.height) this.y = this.originY + Canvas.height - this.height;
        this.dragDom();
    }
    dragDom() {
        this.div.css({
            left: this.x,
            top: this.y
        });
        let dragableRect = Array.from(this.div.find('.dragableRect'));
        dragableRect.length && dragableRect.forEach(rect => {
            lines.forEach(line => {
                let parentOffset = $(rect).position();
                let rectClass = '.'+ rect.className.replace(' ', '.');
                if ($(`#${line.start.id} ${rectClass}`).is($(rect)) || $(`#${line.end.id} ${rectClass}`).is($(rect))) {
                    line.lineCoordinate();
                } 
            });
        });
        drawLines(lines);
    }
    destroy() {
        //  删除相关联的线
        // let line = lines.find((line) => line.start.id == this.id || line.end.id == this.id);
        deleteRelaLines(lines, this.id, this.children);
        this.div.remove();
        // 还没消除本身对象
    }

}
class ChildModule extends BaseModule {
    constructor(options) {
        super(options);
        this.id = 'childModule' + new Date().getTime();
        this.canbeEnd = false;
        this.canbeStart = true;
        this.hasDelete = false;
        this.hasSetting = false;
        this.width = options.parentwidth - options.gap * 2;
        this.height = options.parentHeight - options.gap;
        this.x = options.gap || 10;
        this.y = options.parentHeight + (options.childrenLength + 1) * options.gap + (options.childrenLength * this.height);
        this.canDrag = false;
        this.textY = this.height - (this.height - this.fontSize)/2; //canvas 以文字底端算y距离
        this.init();
        this.childDraw();
    }
    childDraw() {

    }
}

class ContainModule extends BaseModule {
    constructor(options) {
        super(options);
        this.id = 'containModule' + new Date().getTime();
        this.canbeEnd = true;
        this.canbeStart = false;
        this.childrenGap = options.childrenGap || 10;
        this.children = [];
        this.init();
        this.containDraw();
    }
    addBranch(options) {
        options = Object.assign(options, { $parent: $(`#${this.id}`), parentwidth: this.width, parentHeight: this.height, gap: this.childrenGap, childrenLength: this.children.length})
        let module = new ChildModule(options);
        this.childrenHeight = module.height;
        this.children.push(module);
        this.resize();
    }
    containDraw() {
        $(`#${this.id}`).css({
            boxSizing: 'border-box',
            border: '1px solid #333'
        });
    }
    resize() {
        this.containerHeight = this.height + (this.children.length+1) * this.childrenGap + this.children.length * this.childrenHeight;
        $(`#${this.id}`).css({height: this.containerHeight});
    }
}

