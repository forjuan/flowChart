var flowchart = new Flowchart({scrollParent: '.father'});

flowchart.createModule('normal',Object.assign({isFirst: true}));
flowchart.createModule('normal', Object.assign({isLast: true, text: '结束'}));

$('body').on('click', 'button', function(event) {
    event = event.originalEvent;
    if ($(event.target).is($('#createModule'))) {
        var text = $('#moduleName').val();
        flowchart.createModule('normal', Object.assign({text, hasDelete: true}));
    } else if ($(event.target).is($('#createModuleBranch'))) {
        var text = $('#branchModuleName').val();
        flowchart.createModule('branchmodule', Object.assign({text, hasDelete: true}));
    } else if ($(event.target).is($('#createBranch'))) {
        var text = $('#branchName').val();
        let container = flowchart.modules.find(type => type instanceof ContainModule);
        flowchart.createModule('branch', Object.assign({text, containerId: container.id}));
    }

});

