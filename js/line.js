function Baseline(options={}) {
    var defaultOpts = {
        feId: 'line' + new Date().getTime(),
        originX: 0,
        originY: 0,
        isEnd: false,
        lineRange: 8
    }
    Object.assign(this, defaultOpts, options);
}
Baseline.prototype.setPoint = function (opt={}) {
    this.sx = opt.sx || this.sx;
    this.sy = opt.sy || this.sy;
    if (opt.start) this.start = opt.start;
    if (opt.end) {
        this.end = opt.end;
        this.styleEndPonit();
    };
}
Baseline.prototype.styleEndPonit = function() {
    $(`#${this.end.feId} .dragableRect.leftRect`).css({
        backgroundColor: 'green'
    })
}

Baseline.prototype.update = function(opt={}) {
    this.sx = opt.sx || this.sx;
    this.sy = opt.sy || this.sy;
    this.ex = opt.ex || this.ex;
    this.ey = opt.ey || this.ey;
    
    if (this.start && this.end) {
        this.isEnd = true;
    }
    // 设置
}

Baseline.prototype.lineCoordinate = function(scrollDistance = {}) {
    // 当拖动模块时， 连线端点坐标重新获取
    // 传入滚动元素 以便获取滚动值
    var scrollLeft = scrollDistance.scrollLeft || 0,
        scrollTop = scrollDistance.scrollTop || 0;
    if (this.start) {
        var startRect = $(`#${this.start.feId} .rightRect`)[0],
            offset = $(startRect).offset();
        this.sx = offset.left - this.originX + scrollLeft + $(startRect).width()/2;
        this.sy = offset.top - this.originY + scrollTop + $(startRect).height()/2;
    }
    if (this.end) {
        var endRect = $(`#${this.end.feId} .leftRect`)[0],
            offset = $(endRect).offset();
        this.ex = offset.left - this.originX + scrollLeft + $(endRect).width()/2;
        this.ey = offset.top -  this.originY + scrollTop + $(endRect).height()/2;
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