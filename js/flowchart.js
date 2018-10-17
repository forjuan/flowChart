class Flowchart {
    constructor(options={}) {
        this.lines = [];
        this.modules = [];
        this.ratio = getRatio();
        this.canvas = $(`#${options.canvasId || 'canvas'}`);
        this.ctx = this.canvas[0].getContext('2d');
        this.width = this.canvas.width();
        this.height = this.canvas.height();
        this.originX = this.canvas.offset().left;
        this.originY = this.canvas.offset().top;
        this.init();
        this.initEvent();
    }
    init() {
       resetCanvasRatio(this.canvas, this.width, this.height, this.ratio );
    }
    deleteLine(line) {
       if(!line) return;
       this.lines = this.lines.filter((li={}) => li.id &&line.id != li.id);
       let endId = line.end && line.end.id;
       let otherEnd = this.lines.find((li={}) => li.end && endId == li.end.id);
       if (!otherEnd) $(`#${endId} .dragableRect.leftRect`).css({backgroundColor: 'rgba(255, 255, 255, 0.5)'});
       this.drawLines();
   }
   deleteRelaLines(moduleId, children=[]) {
       let ids = [moduleId],
       delines = [];
       children.forEach(child => ids.push(child.id));
       ids.forEach(id => {
           delines = delines.concat(this.lines.filter(line => line.start.id == id || line.end.id == id));
       });
       delines.forEach(deline => this.deleteLine(deline));
   }
   drawLines() {
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
   createModule(type, options) {
       var newmodule = {},
       containModule = {};
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
           containModule = new ContainModule(options);
        //    newmodule = containModule.addBranch(options2)

       } else if (type == 'branch' && options.containerId) {
           let containModule = this.modules.find(item => item.id == options.containerId);
           newmodule = containModule.addBranch(options)
       }
       newmodule.drawLines = this.drawLines.bind(this);
       newmodule.deleteRelaLines = this.deleteRelaLines.bind(this);
       newmodule.id && this.modules.push(newmodule);
   }
   onLine(event) {
       // 移动到连线上
        event = event.originalEvent;
        let x = event.pageX - this.originX,
            y = event.pageY - this.originY;
        $('#bgcontainer').css({
            cursor: 'default'
        });
        this.lines.forEach(line => {
            if (line.isOnline(x, y)) {
                $('#bgcontainer').css({
                    cursor: 'pointer'
                });
            } 
        });
   }
   onLineClick(event) {
        event = event.originalEvent;
        let x = event.pageX - this.originX,
        y = event.pageY - this.originY;
        //    已有聚焦的线
        this.lines.forEach(line => {line.focus = false; line.lineWidth = 1});
        let online = this.lines.find(line => line.isOnline(x, y));
        if (online) {
            online.focus = true;
            online.lineWidth = 3;
        }
        this.drawLines();
   }
   deleteLineEv(event) {
        if (event.key == 'Backspace') {
            let endId = '';
            let line = this.lines.find((line) => line.focus);
            this.deleteLine(line);
        } 
   }
   initEvent() {
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
   }
   destroy() {
       $('body').off('mousemove', this.onLineBind);
       $('body').off('click', this.onLineClickBind);
       $('body').off('keyup', this.deleteLineBind);
   }
}