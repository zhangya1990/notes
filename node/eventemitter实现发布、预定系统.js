const events = require('events');
const net = require('net');
let channel = new events.EventEmitter();
channel.clients = {};
channel.subscriptions = {};

channel.on('join',function(id,client){
    this.clients[id] = client;
    this.subscriptions[id] = function(senderId,message){
        if(id !== senderId){
            this.clients[id].write(message);
        }
    };
    this.on('broadcast',this.subscriptions[id]);
});
channel.on('leave',(id)=>{
    channel.removeListener('boradcast',this.subscriptions[id]);
    channel.emit('broadcast',id,id+' has left the chat. \n');
});


let server = net.createServer((client)=>{
    let id = client.remoteAddress + ':' + client.remotePort;
    channel.emit('join',id,client);
    client.on('data',(data)=>{
        data = data.toString();
        channel.emit('broadcast',id,data);
    });
    client.on('close',()=>{
        channel.emit('leave',id)
    })
});
server.listen(8888,()=>{
    console.log('正在监听8888端口')
});