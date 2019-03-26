var defaultOpt = {
    isLast: false, // 是否为结束模块
    isFirst: false, //是否为开始模块
    hasDelete: false,
    hasSetting: true,
    text: '标题',
    deleteWidth: 10,
    canvasX: 0, //canvas x 坐标
    canvasY: 0,
    x: 0,
    y: 0,
    containerHeight: 0, //有子模块是整体高度,
    feType: 'normal',
    color: '#333',
    titleIcon: 'icon-shuxingtushouqi',
    position: 'absolute',
    toCenter: false, //创建时坐标再移到模块横向中点
    normalWidth: 162,
    normalHeight: 36,
    smallWidth: 90,
    smallHeight: 36
}
export default defaultOpt;