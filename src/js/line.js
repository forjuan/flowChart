import { drawLine } from './svg.drawShape'
// 连线
function Baseline(options = {}) {
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


Baseline.prototype.destroy = function () {
  this.isEnd = true;
  this.isDestroy = true;
}

export { svgLine, comLinePosition, updateLine }

function svgLine(chart, start, end) {
  let line = {
    start: {
      feId: start.feId,
      node: start.lineNode,
    },
    end: {
      feId: end.feId,
      node: end.lineNode,
    }
  }

  line.updateLine = updateLine.bind(line)
  line.updateLine(chart)

  line.pathLine.attr({
    'cursor': 'pointer'
  }).click(function (event) {

    chart.deleteLineEle.show();
    chart.lines.forEach(element => {
      element.isFocus = false;
      element.pathLine.attr({
        'stroke-width': 2
      });
    });
    line.pathLine.attr({
      'stroke-width': 4
    });
    chart.showDeleteLine(event, line)

    line.isFocus = true;
  })

  return line;
}

function updateLine(chart, start, end) {
  let pos = {}
  if (!start && !end) {
    pos = comLinePosition(this)
  } else {
    pos.sx = start.x;
    pos.sy = start.y;
    pos.ex = end.x;
    pos.ey = end.y
  }
  if (this.pathLine) {
    try {
      this.pathLine.attr({
        path: `M${pos.sx} ${pos.sy}L${pos.ex} ${pos.ey}`,
        'stroke-width': 2,
        'arrow-end': 'block-wide-long'
      })
    } catch(e) {
      console.log('箭头宽度大于线段长度', e)
    }
  } else {
    Object.assign(this, drawLine(chart, {x: pos.sx, y: pos.sy}, {x: pos.ex, y: pos.ey}))
    try {
      this.pathLine.attr({
        'stroke-width': 2,
        'arrow-end': 'block-wide-long'
      })
    } catch(e) {
      console.log('箭头宽度大于线段长度', e)
    }
  }
}

function comLinePosition(line) {
  Object.assign(line.start, getNodeInfo(line.start.node));
  Object.assign(line.end, getNodeInfo(line.end.node));
  let sx = line.start.cx + line.start.r / 2 + 2, // 圆心加半径加border
    sy = line.start.cy,
    ex = line.end.cx - line.end.r / 2 - 2, // 圆心减半径减border
    ey = line.end.cy;
  function getNodeInfo(node) {
    return {
      cx: node.attr('cx'),
      cy: node.attr('cy'),
      r: node.attr('r')
    }
  }
  return { sx, sy,  ex, ey }
}
