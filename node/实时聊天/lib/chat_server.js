const io = require('socket.io')();
let guestNumber = 1,nickNames = {},namesUsed = [],currentRoom = {};

exports.listen = function(server){
    io.listen(server);
    // io.set('log level',1);
    io.on('connection',(socket)=>{
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
        joinRoom(socket,'Libby');
        handleMessageBroadcasting(socket,nickNames);
        handleNameChangeAttempts(socket,nickNames,namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms',()=>{
            console.log(io.sockets.adapter)
            socket.emit('rooms',io.sockets.adapter.rooms);
        });
        handleClientDisconnection(socket,nickNames,namesUsed);
    })
};

//处理新用户的昵称，当用户第一次连接到服务器上时，用户被分配到一个Lobby聊天室，并调用assignGuestName给他们分配一个昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    let name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber+1;
}

//进入聊天室
function joinRoom(socket,room){
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{
        room:room
    });
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id] + 'has joined' + room + '.'
    });
    let usersInRoom;
    io.sockets.clients((err,clients)=>{
        usersInRoom = clients;
        if(usersInRoom.length>1){
            let usersInRoomSummary = 'Users currently in '+room+': ';
            console.log(usersInRoom)
            for(let index in usersInRoom){
                let userSocketId = usersInRoom[index].id;
                if(userSocketId != socket.id){
                    if(index>0){
                        usersInRoomSummary += ', ';
                    }
                    usersInRoomSummary += nickNames[userSocketId];
                }
            }
            usersInRoomSummary += '.';
            socket.emit('message',{text:usersInRoomSummary})
        }
    });

}

//处理昵称变更请求
function handleNameChangeAttempts(socket,nickNames,namesUsed){
    socket.on('nameAttempt',(name)=>{
        if(name.indexOf('Guest') === 0){
            socket.emit('nameResult',{
                success:false,
                message:'Names cannot begin with "Guest"'
            });
        }else{
            if(namesUsed.indexOf(name) === -1){
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName+' is now known as '+name+'.'
                });
            }else{
                socket.emit('nameResult',{
                    success:false,
                    message:'That name is already in use'
                })
            }
        }
    })
}

//发送聊天消息
function handleMessageBroadcasting(socket){
    socket.on('message',(msg)=>{
        socket.broadcast.to(msg.room).emit('message',{
            text:nickNames[socket.id] + ': '+msg.text
        });
    });
}

//切换房间
function handleRoomJoining(socket){
    socket.on('join',(room)=>{
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}

//用户断开连接
function handleClientDisconnection(socket){
    socket.on('disconnect',()=>{
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id]
    })
}