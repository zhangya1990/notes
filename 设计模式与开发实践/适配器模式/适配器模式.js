//适配器模式主要用来解决两个已有接口之间不匹配的问题，它不考虑这些接口是怎样实现的，也不考虑它们将来可能会如何演化。适配器模式不需要改变已有的接口，就能够使它们协同作用。
var googleMap = {
    show:function(){
        console.log('开始渲染谷歌地图');
    }
};
var baiduMap = {
    display:function(){
        console.log('开始渲染百度地图');
    }
};

var baiduMapAdapter = {
    show:function(){
        return baiduMap.display();
    }
};

var renderMap = function(map){
    if(map.show instanceof Function){
        map.show();
    }
}
renderMap(googleMap);
renderMap(baiduMapAdapter)
