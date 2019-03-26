import Flowchart from './flowchart';
import { removeObjectByKey } from './utils';

// flowchart 可用方法

// public 保存所有模块
Flowchart.prototype.save = function (saveInLocal = false) {
    var mos = [];
    this.modules.forEach(function (item) {
      let moduleNodePos = item.moduleElement.moduleNode.getBBox();
      var obj = {
        feId: item.feId,
        feNextId: item.feNextId,
        feParentId: item.feParentId,
        text: item.text,
        type: item.type,
        data: item.data,
        viewInfo: JSON.stringify({
          feType: item.feType,
          feId: item.feId,
          feNextId: item.feNextId,
          feParentId: item.feParentId,
          titleIcon: item.titleIcon,
          x: moduleNodePos.x,
          y: moduleNodePos.y,
          isFirst: item.isFirst,
          isLast: item.isLast,
          canbeStart: item.canbeStart,
          canbeEnd: item.canbeEnd,
          hasDelete: item.hasDelete,
          hasSetting: item.hasSetting,
          settingCallback: item.settingCallback,
          isDefaultBranch: item.isDefaultBranch,
          childIndex: item.childIndex
        })
      };
      mos.push(obj);
    });
    if (saveInLocal) {
      localStorage.setItem('modules', JSON.stringify(mos));
    }
    return mos;
  }
  
  // public 恢复所有模块
  Flowchart.prototype.restore = function (modules = []) {
    // 恢复模块
    if (!modules.length) {
      if (!localStorage.getItem('modules')) return;
      modules = JSON.parse(localStorage.getItem('modules'));
    }
    modules.map(function (item) { return Object.assign(item, JSON.parse(item.viewInfo)) });
    var scrollDistance = this.scrollDistance(),
        self = this;
    // 先恢复父模块和普通模块
  
    var childModules = modules.filter(function (item) { return item.feType === 'branch' }),
        otherModules = modules.filter(function (item) { return item.feType !== 'branch' });
    otherModules.forEach(function (item) { self.moduleRestore(item) });
    childModules.forEach(function (item) { self.moduleRestore(item) });
    this.modules.forEach(item => this.moduleLineRestore(item))
    // restore后重新计算Nodes;
    this.showNodes();
  }

  //public  获取节点数
Flowchart.prototype.getAllNodes = function () {
   return this._getAllNodes()
  }
  
  // publc 获取已连接节点数
  Flowchart.prototype.getConnectedNodes = function () {
   return this._getConnectedNodes()
  }

  // public
Flowchart.prototype.createModule = function (options) {
    // 根据isDragCreate参数判定该模块是否需要真的创建，还是记录参数
    options.isDragCreate = options.isDragCreate || false; //创建模块时是否要拖动
    if (!options.isDragCreate) {
      var relMod = this.createRealModule(options, true)
      // 新增后 重新计算节点数
      this.showNodes();
      return relMod;
    } else {
      this.creatingModule = Object.assign(options, {
        originX: this.originX,
        originY: this.originY,
        flowchart: this,
        feType: options.feType
      });
    }
  }

  // public
Flowchart.prototype.updateModule = function (options) {
  // 更新某个模块
  var mo = this.modules.find(function (item) { return item.feId === options.feId });
  mo.update(options);
}
// public
Flowchart.prototype.removeChildModule = function (parentId, childId) {
  // 删除某个子模块
  var parent = this.modules.find(function (item) { return item.feId === parentId });
  // removeObjectByKey(this.modules, 'feId', childId)
  parent.removeChild(childId);
  // 删除模块后节点会变化
  this.showNodes();
}
// public
Flowchart.prototype.removeChildren = function (parentId) {
  // 删除该模块下的所有子模块
  var parent = this.modules.find(function (item) { return item.feId === parentId });
  parent.removeChildren();

  // 删除模块后节点会变化
  this.showNodes();
}
// public
Flowchart.prototype.createChildren = function (parentId, children = []) {
  // 批量增加子模块
  var parent = this.modules.find(function (item) { return item.feId === parentId });
  var self = this,
    scrollDistance = this.scrollDistance();
  children.forEach(function (child) {
    var childModule = parent.addBranch(child);
    childModule.initDraw();
    self.moduleLineRestore(childModule, scrollDistance);
    self.modules.push(childModule);
  });
  parent.initEvent()
  // 增加子模块 会增加节点数
  self.showNodes();
}

export default Flowchart;
