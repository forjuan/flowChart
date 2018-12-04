// for firfox 刷新后会在原来的滚动位置，但获取滚动值时为0
$('.father').scrollLeft(0);
$('.father').scrollTop(0);
var flowchart = new Flowchart({scrollParent: '.father'});
var currentModule = {};

$('#createModule').on('dragstart', function(event) {
     // 拖动创建普通模块
     var text = $('#moduleName').val();
     var obj = text ? {text}: {};
     console.log('dragStart')
   
     event.originalEvent.dataTransfer.setDragImage(document.getElementById('copyMove'),0,0);
     flowchart.createModule(Object.assign(obj, {
         type: 'normal',
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
        type: 'branchmodule', 
        hasSetting: true,
        hasDelete: true, 
        isDragCreate: true //拖动创建
    }));
     
    //  for firefox 否则drag其他事件无法正常触发
     event.originalEvent.dataTransfer.setData('createModule', {});
})


$('#update').click(function() {
    currentModule.text = $('#updateModule').val();
    flowchart.updateModule(currentModule)
})

$('#addChild').click(function() {
    // 添加子模块, childModule为null则说明没创建对
    let childModule = flowchart.createModule({
        type: 'branch',
        parentId: currentModule.id, //父级模块id 必须
        text: $('#childModule').val()
    })
    let input = $(`<input value=${childModule.text}>`);
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