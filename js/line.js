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