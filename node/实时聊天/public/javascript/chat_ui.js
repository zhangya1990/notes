function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}

function divSystemContentElement(message){
    return $('<div></div>').html('<i>'+message+'</i>');
}

//处理用户输入
function processUserInput(chatApp){
    let message = $('#send-message').val();
    let systemMessage;
    if(message.charAt(0) === '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}

//初始化客户端socket.io事件
let socket = io('http://localhost:3000');
$(document).ready(function(){
    let chatApp = new Chat(socket);
    socket.on('nameResult',(result)=>{
        let message;
        if(result.success){
            message = 'You are now known as '+result.name+'.';
        }else{
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });
    socket.on('joinResult',(result)=>{
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });
    socket.on('message',function(message){
        let newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement)
    });
    socket.on('rooms',(rooms)=>{
        console.log(rooms)
        $('#room-list').empty();
        for(let room in rooms){
            room = room.substring(1,room.length);
            if(room != ''){
                $('#room-list').append(divSystemContentElement(room));
            }
        }
        $('#room-list div').click(()=>{
            chatApp.processCommand('/join '+$(this).text());
            $('#send-message').focus();
        })
    });
    $('#send-message').focus();
    $('#send-form').submit(()=>{
        processUserInput(chatApp,socket);
        return false
    })
    socket.emit('rooms')
});