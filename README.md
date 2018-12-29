# flowChart
ivr 拖拽配置，特殊流程图， canvas + dom, 依赖jquery

# 安装
方式一

```javascript
npm install flow-chart-ivr --save
```
方式二

直接引入dist中的flowchart.min.js和flowchart.min.css

# install
```
npm install 
```

# useage
```
实例化一个Flowchart new Flowchart(options)
optiongs参数说明
{
    wraper: '',// jquery selector，放置流程画布容器
    canvasWidth: 1800, // 画布宽度， 可以超过容器宽度， 超出滚动
    canvasHeight: 1500, //画布高度， 可以超过容器高度， 超出滚动
    deleteIcon: '', // 删除模块图标icon class，
    deleteLineIcon: '' // 删除连线图标，若不设置与模块删除图标相同 icon class
    showNodesWraper: '' //是否显示连接结点数， 默认为true
}
```
# 实例方法
```
createModule(options) 创建模块
options参数说明
{
    isDragCreate: false //是否为拖动创建（drag),默认为false
    feType: 'normal', //模块类型，normal:正常模块，branchmodule: 普通包含子模块的包含模块，branch: 包含模块的子模块, specialBranch: 特殊模块，可以自定义子模块，此时传入children有效
    isLast: false,//是否为结束模块
    isFirst: false, //是否开始模块
    hasDelete: true, //是否能删除
    hasSetting: true, //是否能设置
    text: '标题'，//标题内容
    titleIcon: '',//模块Icon class
    feId: '', //模块唯一Id, 若不传，默认生成唯一ID
    children: [{  //当feType为specialBranch时才生效
        text: '子模块1'
        ...
    }, {
        text: '子模块2'
        ...
    }]
    
    ... //其他参数， 会保留
}

updateModule(options) 更新模块
options 参数说明
{
    text: '' 
    titleIcon: ''
    ... //其他参数，如附带的数据， 会保留
}

removeChildModule(parentId, childId) 删除子模块
parentId: 父模块的feId
childId: 子模块的feId


removeChildren(parentId) 删除父模块下的所有子模块
parentId: 父模块的feId


createChildren(parentId, children=[]) 创建子模块
parentId: 父模块的feId
children: [{
    text: '子模块1'
    ...//其他参数
}], 子模块参数

getAllNodes() 获取所有结点数个数

getConnectedNodes() 获取已连接的节点个数

save(saveInLocal) 保存所有创建的模块，及附带参数, 并返回所有模块对象
参数`saveInLocal`，默认false, 是否保存在localstorage中
return modules

restore(modules) 恢复所有模块， 
参数说明modules Array, 所有模块
```

# 事件
modulesetting, 回调参数的module属性包含当前模块的数据
```
$(wraper).find('.flowchart-canvas').on('modulesetting', function(data){
    currentModule = data.module
})
```

# example
```
node servers.js 
```
或者
```
npm run server

```
visit [http://localhost:8000/](http://localhost:8000/)
