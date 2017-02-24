const fs = require('fs');
const request = require('request');
const htmlparser = require('htmlparser');
let configFileName = './rss';

function checkForRSSFile(){
    fs.exists(configFileName,(exists)=>{
        if(!exists)
            return next(new Error('Missing RSS file: '+configFileName));
        next(null,configFileName);
    });
}
function readRSSFile(configFileName){
    fs.readFile(configFileName,(err,data)=>{
        if(err)
            return next(err);
        let feedList = data.toString().replace(/^\s+|\s+$/g,'').split('\n');
        next(null,feedList[1]);
    });
}
function downloadRSSFeed(feedUrl){
    request({url:feedUrl},(err,res,body)=>{
        if(err)return next(err);
        if(res.statusCode !== 200)
            return next(new Error('Abnormal response status code!'));
        next(null,body);
    });
}
function parserRSSFeed(rss){
    let handler = new htmlparser.RssHandler();
    let parser = new htmlparser.Parser(handler);
    parser.parseComplete(rss);
    console.log(handler)
    if(!handler.dom.length){
        return next(new Error('No RSS items found'));
        let item = handler.dom.shift();
        console.log(item.title);
        console.log(item.link);
    }
}
let tasks = [checkForRSSFile,readRSSFile,downloadRSSFeed,parserRSSFeed];
function next(err,result){
    if(err) throw err;
    let currentTask = tasks.shift();
    if(currentTask){
        currentTask(result);
    }
}
next();