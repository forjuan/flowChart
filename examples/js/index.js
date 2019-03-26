
new Vue({
    el: '#flowchart-wraper',
    data: function() {
        return {
            scale: 0.1,
            currentModule: {}
        }
    },
    template: `<div>
                    <span class="button" v-on:click="createModule">创建模块</span>
                    <span class="button" v-on:click="createContainModule">创建分支模块</span>
                    <span class="button" v-on:click="createSpecialModule">创建特殊分支模块</span>
                    <p><label>放大/缩小</label><input v-on:change="changeScale" type="range" min=0 max= 0.2 step=0.02 v-model="scale"></p>
                    <span class="button" v-on:click="save">保存</span>
                    <div class='flowchart'></div>
                </div>`,
    mounted: function() {
            // 初始化整个流程图
        let flowchart = this.flowchart = new Flowchart({
            wraper: '.flowchart', 
            showNodesWraper: true,
            deleteIcon: 'icon-IVR-shanchu',
            deleteLineIcon: 'icon-IVR-shanchu'
        });

        // 恢复流程图
        flowchart.restore()
        if(flowchart.modules.length === 0){
            flowchart.createModule(Object.assign({isFirst: true, hasSetting: true, isDragCreate: false, x: 0, y:10}));
            flowchart.createModule(Object.assign({isLast: true, text: '结束', isDragCreate: false, x: 100, y:80}));
        }
        // // 设置
        $('.flowchart').on('modulesetting', (data) =>{
            this.moduleSetting(data.module)
        });
    },
    methods: {
        createModule() {
            this.flowchart.createModule({
                feType: 'normal',
                hasSetting: true,
                hasDelete: true, 
                isDragCreate: false,
                text: '普通模块'
            });
        },
        createContainModule() {
            this.flowchart.createModule({
                feType: 'branchmodule', 
                hasSetting: true,
                hasDelete: true, 
                isDragCreate: false, //拖动创建,
                text: '包含模块'
            });
        },
        createSpecialModule() {
            this.flowchart.createModule({
                feType: 'specialBranch', 
                hasSetting: true,
                hasDelete: true, 
                isDragCreate:false, //拖动创建
                text: '时间模块',
                titleIcon: 'icon-IVR-gongzuoshijian',
                children: [{
                    feType: 'branch',
                    text: '工作时间',
                    notChange: true,
                }, {
                    feType: 'branch',
                    text: '非工作时间'
                }]
            });
        },
        changeScale() {
            this.flowchart.changeScale(this.scale * 10)
        },
        save() {
            this.flowchart.save(true);
        },
        moduleSetting(currentModule) {
            this.currentModule = currentModule;
            content="<div id='setting-module-wraper'></div>";

            layer.open({
                type: 0, 
                title: '编辑模块',
                content, //这里content是一个普通的String
                yes: (index, layero) => {
                    this.flowchart.updateModule(currentModule)
                    layer.close(index);
                }
              });

            new Vue({
                el:'#setting-module-wraper',
                template: `<div><module-setting :currentModule="currentModule" :flowchart="flowchart"></module-setting></div>`,
                data: { currentModule: this.currentModule, flowchart: this.flowchart }
            })
        }
    }
})


// 设置模块组件
var settingComponent = Vue.component('module-setting', {
    data: function() {
        return {
            showAddInput: false,
            newChild: {}
        } 
    },
    props: ['currentModule', 'flowchart'],
    template: `<div><label> 标题:</label><input id="text" v-model="currentModule.text"/>
                <h1 v-if="currentModule.children">子模块</h1>
                <ul v-if="currentModule.children">
                    <li v-for="item in currentModule.children">
                        <input v-model="item.text"> <span v-on:click="removeChild(item)" title="删除">-</span>
                    </li>
                </ul>
                <div v-if="currentModule.feType!=='normal' && !showAddInput" v-on:click="showAddInput = true">+添加子模块</div>
                <input v-if="showAddInput" v-model="newChild.text" v-on:change="addChild(currentModule.feId)">
              </div>
             `,
    methods: {
        removeChild: function (item) {
            this.flowchart.removeChildModule(item.feParentId, item.feId)
        },
        addChild: function(feParentId) {
            this.flowchart.createModule({
                feType: 'branch',
                feParentId: feParentId, //父级模块id 必须
                text: this.newChild.text
            })
            this.showAddInput = false
        }
    }
})


