


function create(type, options) {
    if (type == 'normal') {
        var module = new BaseModule(options);
        module.init();
        allModules.push(module);
    } else if (type == 'branchmodule') {
        var module = new ContainModule(options);
        Contain = module;
    } else if (type == 'branch') {
        Contain.addBranch(options)
    }
    
} 
function drawLines(lines) {
    bgctx.clearRect(0, 0, Canvas.width, Canvas.height);
    bgctx.strokeStyle = 'green';
    lines && lines.forEach(line => {
        bgctx.beginPath();
        if (line.focus) {
            bgctx.lineWidth = line.lineWidth;
        } else {
            bgctx.lineWidth = 1;
        }
        bgctx.moveTo(line.sx,line.sy);
        bgctx.lineTo(line.ex,line.ey);
        bgctx.closePath();
        bgctx.stroke();
    });
}


var bgCanvas = $("#canvas");
var bgctx = bgCanvas[0].getContext('2d');
var bgOrigin = {
    originX: bgCanvas.offset().left,
    originY: bgCanvas.offset().top,
}
var lines = [];
var Canvas = {
    bgCanvas,
    originX: bgOrigin.originX,
    originY: bgOrigin.originY,
    width: bgCanvas.width(),
    height: bgCanvas.height()
}
var allModules = [];
create('normal',Object.assign({isFirst: true},bgOrigin));
create('normal', Object.assign({isLast: true, text: '结束'}, bgOrigin));

$('body').on('click', 'button', function(event) {
    event = event.originalEvent;
    if ($(event.target).is($('#createModule'))) {
        var text = $('#moduleName').val();
        create('normal', Object.assign({text, hasDelete: true}, bgOrigin));
    } else if ($(event.target).is($('#createModuleBranch'))) {
        var text = $('#branchModuleName').val();
        create('branchmodule', Object.assign({text, hasDelete: true}, bgOrigin));
    } else if ($(event.target).is($('#createBranch'))) {
        var text = $('#branchName').val();
        create('branch', Object.assign({text}), bgOrigin);
    }

});


// 移动到连线上
$('body').on('mousemove', function(event) {
    event = event.originalEvent;
    let x = event.pageX - bgOrigin.originX,
        y = event.pageY - bgOrigin.originY;
    $('#bgcontainer').css({
        cursor: 'default'
    });
    lines.forEach(line => {
        if (line.isOnline(x, y)) {
            $('#bgcontainer').css({
                cursor: 'pointer'
            });
        } 
    });
});

// 聚焦连线
$('body').on('click', function(event) {
    event = event.originalEvent;
    let x = event.pageX - bgOrigin.originX,
        y = event.pageY - bgOrigin.originY;
    lines.forEach(line => {
        if (line.isOnline(x, y)) {
           line.focus = true;
           line.lineWidth = 3;
        } else {
           line.lineWidth = 1;
           line.focus = false;
        }
    });

    drawLines(lines);
});
$('body').on('keyup', function(event) {
    if (event.key == 'Backspace') {
        let endId = '';
        let line = lines.find((line) => line.focus);
        deleteLine(line);
    } 
});

function deleteLine(line) {
    if(!line) return;
    window.lines = lines = lines.filter((li={}) => li.id &&line.id != li.id);
    let endId = line.end && line.end.id;
    let otherEnd = lines.find((li={}) => li.end && endId == li.end.id);
    if (!otherEnd) $(`#${endId} .dragableRect.leftRect`).css({backgroundColor: 'rgba(255, 255, 255, 0.5)'});
    drawLines(lines);
}
function deleteRelaLines(lines, moduleId, children=[]) {
    let ids = [moduleId],
        delines = [];
    children.forEach(child => ids.push(child.id));
    ids.forEach(id => {
        delines = delines.concat(lines.filter(line => line.start.id == id || line.end.id == id));
    });
    delines.forEach(deline => deleteLine(deline));
}


