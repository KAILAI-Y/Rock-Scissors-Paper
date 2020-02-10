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
    io.emit('user enter', players);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('disconnect', function(data) {
      let findIndex = players.findIndex(function(player){
        return player.name == socket.username;
      })

      if(findIndex > -1){
        players.splice(findIndex, 1);
      }
      io.emit('user left', socket.username, players);
      connections.splice(connections.indexOf(socket), 1);

      io.emit('disconnected', socket.username);
      console.log('Disconnected: %s sockets connected', connections.length);    
    });

    socket.on('send message', function(data) {
        io.sockets.emit('new message', {msg: data, user: socket.username});
    });

    socket.on('add user', function(data, callback) {
        socket.username = data;
        if(players.length >= 2){
          callback({
            status: 2,
            message: 'room full'
          })
          return
        }

        let findIndex = players.findIndex(function(player){
          return player.name == socket.username;
        })
        

        if(findIndex > -1){
          callback({
            status: 1,
            message: 'A same name has been joined'
          })
          return
        }

        players.push({
          name: socket.username,
          choice: ''
        })  

        io.emit('user join', socket.username, players);
        if (players.length == 2){
            io.emit('game start');
        }
        callback({
          status: 0,
          message: 'joined'
        })
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
                            io.emit('game over', players, {winner: null});
                            break;

                        case 'paper':
                            io.emit('game over', players, {winner: players[1]});               
                            break;
        
                        case 'scissors':
                            io.emit('game over', players, {winner: players[0]});  
                            break;

                        default:
                            break;
                    }
                    break;

                case 'paper':
                    switch (players[1].choice)
                    {
                        case 'rock':
                            io.emit('game over', players, {winner: players[0]});   
                            break;

                        case 'paper':
                            io.emit('game over', players, {winner: null});
                            break;
        
                        case 'scissors':
                            io.emit('game over', players, {winner: players[1]}); 
                            break;

                        default:
                            break;
                    }
                break;

                case 'scissors':
                    switch (players[1].choice)
                    {
                        case 'rock':
                            io.emit('game over', players, {winner: players[1]});   
                            break;

                        case 'paper':
                            io.emit('game over', players, {winner: players[0]}); 
                            break;
        
                        case 'scissors':
                            io.emit('game over', players, {winner: null});
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