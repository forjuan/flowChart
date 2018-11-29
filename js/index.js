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
        flowchart.createModule('branchmodule', Object.assign({text, hasDelete: true, settingCallback: function(smodule) {
            currentModule = smodule;
            $('#updateModule').val(currentModule.text);
        }}));
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

flowchart.restore()
if(flowchart.modules.length === 0){
    flowchart.createModule('normal',Object.assign({isFirst: true, hasSetting: true, }));
flowchart.createModule('normal', Object.assign({isLast: true, text: '结束'}));

} 