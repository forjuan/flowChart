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
    this.scrollParent = $(options.scrollParent) || this.canvas.parent().parent();
    this.init();
    this.initEvent();
}

Flowchart.prototype.init = function() {
    resetCanvasRatio(this.canvas, this.width, this.height, this.ratio );
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

Flowchart.prototype.createModule = function(type, options) {
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
    } else if (type == 'branch') {
        let mo = this.get('modules') && this.get('modules').find(item=> item.bid == options.parentBid);
        mo.addBranch(options);
    }
    newmodule.drawLines = this.drawLines.bind(this);
    newmodule.deleteRelaLines = this.deleteRelaLines.bind(this);
}
Flowchart.prototype.onLine = function(event) {
    // 移动到连线上
     event = event.originalEvent;
     let scrollDistance = this.scrollDistance();
     let x = event.pageX - this.originX + scrollDistance.scrollLeft,
         y = event.pageY - this.originY + scrollDistance.scrollTop;
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
    }
    this.drawLines();
}
Flowchart.prototype.deleteLineEv = function(event) {
    if (event.key == 'Backspace') {
        let endId = '';
        let line = this.lines.find((line) => line.focus);
        this.deleteLine(line);
    } 
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
        type: item.type,
        bid: item.bid,
        nextBid: item.nextBid,
        parentBid: item.parentBid,
        text: item.text,
        viewInfo: JSON.stringify({
          id: item.id,
          nextId: item.nextId,
          parentBid: item.parentBid,
          x: item.x,
          y: item.y,
          isFirst: item.isFirst,
          isLast: item.isLast,
          hasDelete: item.hasDelete,
          hasSetting: item.hasSetting
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
    modules.forEach(async item => {
        var obj = Object.assign(item, JSON.parse(item.viewInfo));
        this.createModule(item.type, obj, false);
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
        
    });
    
}