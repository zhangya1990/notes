//享元模式要求将对象的属性划分为内部状态与外部状态。享元模式的目标是尽量减少共享对象的数量。
//内部状态存储于对象内部
//内部状态可以被一些对象共享
//内部状态独立于具体的场景，通常不会改变
//外部状态取决于具体的场景，并根据场景而变化，外部状态不能被共享



//一般模式文件上传
/*var id = 0;
window.startUpload = function(uploadType,files){
    for(var i = 0,file;file = files[i++];){
        var uploadObj = new Upload(uploadType,file.fileName,file.fileSize);
        uploadObj.init(id++);
    }
};

var Upload = function(uploadType,fileName,fileSize){
    this.uploadType = uploadType;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.dom = null;
};
Upload.prototype.init = function(id){
    var that = this;
    this.id = id;
    this.dom = document.createElement('div');
    this.dom.innerHTML = `<span>文件名称:${this.fileName} 文件大小${this.fileSize}</span>
                            <button class="delFile">删除</button>`;
    this.dom.querySelector('.delFile').onclick = function(){
        that.delFile();
    }
};
Upload.prototype.delFile = function(){
    if(this.fileSize < 3000){
        return this.dom.parentNode.removeChild(this.dom);
    }
    if(window.confirm('确定要删除该文件吗? '+this.fileName)){
        return this.dom.parentNode.removeChild(this.dom);
    }
};

startUpload('plugin',[
    {
        fileName:'1.txt',
        fileSize:1000
    },
    {
        fileName:'2.txt',
        fileSize:2000
    },
    {
        fileName:'3.txt',
        fileSize:3000
    }
]);
startUpload('flash',[
    {
        fileName:'4.txt',
        fileSize:1000
    },
    {
        fileName:'5.txt',
        fileSize:2000
    },
    {
        fileName:'6.txt',
        fileSize:3000
    }
]);*/


//享元模式文件上传
var Upload = function(uploadType){
    this.uploadType = uploadType;
};
Upload.prototype.delFile = function(id){
    uploadManager.setExternalState(id,this);

    if(this.fileSize<3000){
        return this.dom.parentNode.removeChild(this.dom);
    }
    if(window.confirm(`确定要删除该文件吗? ${this.fileName}`)){
        return this.dom.parentNode.removeChild(this.dom);
    }
};

var UploadFactory = (function(){
    var createdFlyWeightObj = {};

    return {
        create:function(uploadType){
            if(createdFlyWeightObj[uploadType]){
                return createdFlyWeightObj[uploadType];
            }
            return createdFlyWeightObj[uploadType] = new Upload(uploadType);
        }
    }
})();

var uploadManager = (function(){
    var uploadDatabase = {};

    return {
        add:function(id,uploadType,fileName,fileSize){
            var flyWeightObj = UploadFactory.create(uploadType);
            var dom = document.createElement('div');
            dom.innerHTML = `
                            <span>文件名称:${fileName}, 文件大小:${fileSize}</span>
                            <button class="delFile">删除</button>`;
            document.querySelector('.delFile').onclick = function(){
                flyWeightObj.delFile(id);
            };
            document.body.appendChild(dom);
            uploadDatabase[id] = {
                fileName:fileName,
                fileSize:fileSize,
                dom:dom
            };
            return flyWeightObj
        },
        setExternalState:function(id,flyWeightObj){
            var uploadData = uploadDatabase[id];
            for(var i in uploadData){
                flyWeightObj[i] = uploadData[i];
            }
        }
    }
})();

var id = 0;
window.startUpload = function(uploadType,files){
    for(var i = 0,file;file = files[i++];){
        var uploadObj = uploadManager.add(++id,uploadType,file.fileName,file.fileSize);
    }
};

startUpload('plugin',[
    {
        fileName:'1.txt',
        fileSize:1000
    },
    {
        fileName:'2.txt',
        fileSize:2000
    },
    {
        fileName:'3.txt',
        fileSize:3000
    }
]);
startUpload('flash',[
    {
        fileName:'1.txt',
        fileSize:1000
    },
    {
        fileName:'2.txt',
        fileSize:2000
    },
    {
        fileName:'3.txt',
        fileSize:3000
    }
]);

//享元模式重构之前的代码一共创建了6个upload对象，而通过享元模式创建了2个对象，而且如果需求更改为同时上传2000个文件，需要创建的upload对象数量依然是2个