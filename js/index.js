// for firfox 刷新后会在原来的滚动位置，但获取滚动值时为0
$('.father').scrollLeft(0);
$('.father').scrollTop(0);
var flowchart = new Flowchart({scrollParent: '.father'});
var currentModule = {};

$('#createModule').on('dragstart', function(event) {
     // 拖动创建普通模块
     var text = $('#moduleName').val();
     var obj = text ? {text}: {};
   
     event.originalEvent.dataTransfer.setDragImage(document.getElementById('copyMove'),0,0);
     flowchart.createModule(Object.assign(obj, {
         feType: 'normal',
         hasSetting: true,
         hasDelete: true, 
         isDragCreate: true
    }));
      
     //  for firefox 否则drag其他事件无法正常触发
      event.originalEvent.dataTransfer.setData('createModule', {});
})

$('#createModuleBranch').on('dragstart', function(event) {
    // 拖动创建普通包含模块
    var text = $('#branchModuleName').val();
    var obj = text ? {text}: {};
    event.originalEvent.dataTransfer.setDragImage(document.getElementById('copyMove'),0,0);
    flowchart.createModule(Object.assign(obj, {
        feType: 'branchmodule', 
        hasSetting: true,
        hasDelete: true, 
        isDragCreate: true, //拖动创建,
        text: '分支模块'
    }));
     
    //  for firefox 否则drag其他事件无法正常触发
     event.originalEvent.dataTransfer.setData('createModule', {});
})
$('#createModuleSpecial').on('dragstart', function(event) {
    // 拖动创建普通包含模块
    var text = $('#branchModuleName').val();
    var obj = text ? {text}: {};
    event.originalEvent.dataTransfer.setDragImage(document.getElementById('copyMove'),0,0);
    flowchart.createModule(Object.assign(obj, {
        feType: 'specialBranch', 
        hasSetting: true,
        hasDelete: true, 
        isDragCreate: true, //拖动创建
        text: '时间模块',
        children: [{
            feType: 'branch',
            text: '工作时间',
            notChange: true,
        }, {
            feType: 'branch',
            text: '非工作时间'
        }]
    }));
    
    //  for firefox 否则drag其他事件无法正常触发
    event.originalEvent.dataTransfer.setData('createModule', {});
});
$('#crateChildren').on('click', function() {
    let children = []
    currentModule.children.forEach(element => {
        children.push(Object.assign({},element))
    });
    let obj = children.shift();
    children.push(obj);
    flowchart.removeChildren(currentModule.feId);
    flowchart.createChildren(currentModule.feId, children);
})


$('#update').click(function() {
    currentModule.text = $('#updateModule').val();
    flowchart.updateModule(currentModule);
    $('#addChild').parent().find('.childInput').remove();
})

$('#addChild').click(function() {
    // 添加子模块, childModule为null则说明没创建对
    let childModule = flowchart.createModule({
        feType: 'branch',
        feParentId: currentModule.feId, //父级模块id 必须
        text: $('#childModule').val()
    })
    let input = $(`<input class="childInput"value=${childModule.text}>`);
    input.change(function() {
        childModule.text = this.value;
        flowchart.updateModule(childModule);
    })
    $('#addChild').parent().append(input)
})

$('#save').click(function() {
    flowchart.save();
})
$('#canvas').on('modulesetting', function(data) {
    currentModule = data.module;
    $('#updateModule').val(currentModule.text);
    if(currentModule.children && currentModule.children.length) {
        for(let i=0; i< currentModule.children.length; i++) {
            let child = currentModule.children[i];
            let input = $(`<input value=${child.text}>`);
            input.change(function() {
                child.text = this.value;
                flowchart.updateModule(child);
            })
            $('#addChild').parent().append(input);
        }
    }
});

flowchart.restore()
if(flowchart.modules.length === 0){
    flowchart.createRealModule(Object.assign({isFirst: true, hasSetting: true, }));
    flowchart.createRealModule(Object.assign({isLast: true, text: '结束'}));
}