var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//users = [];
connections = [];
//players = [];
var players = [];


server.listen(process.env.PORT || 3000);
console.log('Sever running...');

app.get('/', function(rer, res) {
    res.sendFile(__dirname + '/index.html')
});

app.use(express.static(__dirname+'/public'));

io.sockets.on('connection', function(socket) {
    connections.push(socket);
    io.emit('user enter', users);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('disconnect', function(data) {
        var findIndex = users.indexOf(socket.username);
        if(findIndex >= 0){
          users.splice(users.indexOf(socket.username), 1);
        }
        io.emit('user left', socket.username, users);
        console.log('user left...');

        //updateUsernames();
        connections.splice(connections.indexOf(socket), 1)

        var findIndex = -1;
        for(var i in players){
          if(players[i].user == socket.username){
            findIndex = i;
            break;
          }
        }
        if(findIndex > -1){
          players.splice(findIndex, 1)
        }

        io.emit('disconnected', socket.username);
        console.log('Disconnected: %s sockets connected', connections.length);    
    });

    socket.on('send message', function(data) {
        io.sockets.emit('new message', {msg: data, user: socket.username});
    });

    socket.on('add user', function(data, callback) {
        socket.username = data;
        let findIndex = -1;
        for(let i in players){
          if(players[i].name == socket.username){
            findIndex = i;
            break;
          }
        }
        if(findIndex > -1){
          callback(false)
        }else{
          players.push({
            name: socket.username,
            choice: ''
          })   
            io.emit('user join', socket.username, players);
            callback(true);
            if (players.length == 2)
            {
                io.emit('game start');
            }
        }
    });


    socket.on('player choice', function (username, choice) {
        for(let i in players){
          if(players[i].name == username){
            players[i].choice = choice
          }
        }
        console.log('%s chose %s.', username, players);

        io.emit('user choice', socket.username, players);
        
        if(players.length == 2) 
        {
            console.log('[socket.io] Both players have made choices.');

            switch (players[0].choice)
            {
                case 'rock':
                    switch (players[1].choice)
                    {
                        case 'rock': 
                            io.emit('tie', players);
                            break;

                        case 'paper':
                            io.emit('player 2 win', players);               
                            break;
        
                        case 'scissors':
                            io.emit('player 1 win', players);
                            break;

                        default:
                            break;
                    }
                    break;

                case 'paper':
                    switch (players[1].choice)
                    {
                        case 'rock':
                            io.emit('player 1 win', players);     
                            break;

                        case 'paper':
                            io.emit('tie', players);
                            break;
        
                        case 'scissors':
                            io.emit('player 2 win', players);
                            break;

                        default:
                            break;
                    }
                break;

                case 'scissors':
                    switch (players[1].choice)
                    {
                        case 'rock':
                            io.emit('player 2 win', players);    
                            break;

                        case 'paper':
                            io.emit('player 1 win', players); 
                            break;
        
                        case 'scissors':
                            io.emit('tie', players);
                            break;

                        default:
                            break;
                    }
                    break;

                default:
                    break;
            }
        }
    });
});