const net = require('net');
const host = process.argv[2];
const port = Number(process.argv[3]);

let socket = net.connect(port,host);

socket.on('connect',()=>{
    process.stdin.pipe(socket);
    socket.pipe(process.stdout);
    process.stdin.resume();
});
socket.on('end',function(){
    process.stdin.pause();
})