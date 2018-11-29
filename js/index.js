var flowchart = new Flowchart({scrollParent: '.father'});
var currentModule = {};


$('body').on('click', 'button', function(event) {
    event = event.originalEvent;
    if ($(event.target).is($('#createModule'))) {
        // 创建普通模块
        var text = $('#moduleName').val();
        flowchart.createModule('normal', Object.assign({text, hasSetting: true,hasDelete: true, settingCallback: (smodule)=> {
            currentModule = smodule;
            $('#updateModule').val(currentModule.text);
        }}));
    } else if ($(event.target).is($('#createModuleBranch'))) {
        // 包括分支模块
        var text = $('#branchModuleName').val();
        flowchart.createModule('branchmodule', Object.assign({text, hasDelete: true}));
    }
});

$('#update').click(function() {
    currentModule.text = $('#updateModule').val();
    currentModule.update(currentModule);
})

$('#addChild').click(function() {
    currentModule.addBranch({text: $('#childModule').val()})
})

$('#save').click(function() {
    flowchart.save();
})
$('canvas').on('modulesetting', function(data) {
    currentModule = data.module;
    $('#updateModule').val(currentModule.text);
    if(currentModule.children.length) {
        for(let i=0; i< currentModule.children.length; i++) {
            let child = currentModule.children[i];
            let input = $(`<input value=${child.text}>`);
            input.change(function() {
                child.text = this.value;
                child.update(child);
            })
            $('body').append(input);
        }
    }
    currentModule.removeChildren()
});
flowchart.restore()
if(flowchart.modules.length === 0){
    flowchart.createModule('normal',Object.assign({isFirst: true, hasSetting: true, }));
    flowchart.createModule('normal', Object.assign({isLast: true, text: '结束'}));
}