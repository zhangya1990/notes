process.on('message',(msg)=>{
    let sendmsg;
    switch (msg.cmd){
        case 0:
            sendmsg = 'lalala';
            break;
        case 1:
            sendmsg = 'hahah';
            break;
        case 2:
            sendmsg = 'wawawa';
            break;
        default:
            sendmsg = 'jiushigan'
    }
    process.send(sendmsg)
});
