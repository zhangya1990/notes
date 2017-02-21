//中介者模式的作用就是解除对象与对象之间的紧密耦合关系。增加一个中介者对象后，所有的相关对象都可以通过中介者对象来通信，而不是相互引用，所以当一个对象发生改变之后，只需要通知中介者对象即可。中介者使各对象之间耦合松散，而且可以独立地改变他们之间的交互。中介者模式使网状的多对多关系变成了相对简单的一对多关系。

//泡泡堂
function Player(name,teamColor){
    this.name = name;
    this.teamColor = teamColor;
    this.state = 'alive';
}
Player.prototype.win  = function(){
    console.log(this.name + 'win');
};
Player.prototype.lose = function(){
    console.log(this.name + 'lose')
};
Player.prototype.die = function(){
    this.state = 'dead';
    playerDirector.ReceiveMessage('playerDead',this);
};
Player.prototype.remove = function(){
    playerDirector.ReceiveMessage('removePlayer',this);
};
Player.prototype.changeTeam = function(color){
    playerDirector.ReceiveMessage('changeTeam',this,color);
};

var playerFactory = function(name,teamColor){
    var newPlayer = new Player(name,teamColor);
    playerDirector.ReceiveMessage('addPlayer',newPlayer);
    return newPlayer;
};

var playerDirector = (function(){
    var players = {};
    var operations = {};

    operations.addPlayer = function(player){
        var teamColor = player.teamColor;
        players[teamColor] = players[teamColor] || [];
        players[teamColor].push(player);
    };
    operations.removePlayer = function(player){
        var teamColor = player.teamColor;
        var teamPlayers = players[teamColor] || [];
        for(var i = teamPlayers.length-1;i>=0;i--){
            if(teamPlayers[i] === player){
                teamPlayers.splice(i,1);
            }
        }
    };
    operations.changeTeam = function(player,newTeamColor){
        operations.removePlayer(player);
        player.teamColor = newTeamColor;
        operations.addPlayer(player);
    };
    operations.playerDead = function(player){
        var teamColor = player.teamColor;
        var teamPlayers = players[teamColor];

        var all_dead = true;
        for(var i = 0,player;player = teamPlayers[i++];){
            if(player.state !== 'dead'){
                all_dead = false;
                break;
            }
        }
        if(all_dead){
            for(var i = 0,player;player = teamPlayers[i++];){
                player.lose();
            }
            for(var color in players){
                if(color !== teamColor){
                    var teamPlayers = players[color];
                    for(var i = 0,player;player = teamPlayers[i++];){
                        player.win();
                    }
                }
            }
        }
    };

    var ReceiveMessage = function(){
        var message = Array.prototype.shift.call(arguments);
        operations[message].apply(this,arguments);
    };

    return {
        ReceiveMessage:ReceiveMessage
    }
})();

var player1 = playerFactory('pidan1','red');
var player2 = playerFactory('pidan2','red');
var player3 = playerFactory('pidan3','red');
var player4 = playerFactory('pidan4','red');

var player5 = playerFactory('shourouzhou1','blue');
var player6 = playerFactory('shourouzhou2','blue');
var player7 = playerFactory('shourouzhou3','blue');
var player8 = playerFactory('shourouzhou4','blue');

player1.die();
player2.die();
player3.die();
player4.die();