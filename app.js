//TODOS:
//Display countown after each score #1
//Splash Page
//  - Join a new game
// move javascript to client.js
// move code to server to test multiple players
// have different colors for the paddles based on player position

var constants = { court: { width: 600, height: 600 }, 
                  paddle: { width: 50, height: 15, delta: 3 },
                  ball: { radius: 10, deltaLeft: 3, deltaTop: 2, interval: 30 }
                };                         

var state = { paddles: {},
              ball: { left: 0, top: 0 },
              bottomPaddle: 0,
              topPaddle: 0,
              leftPaddle: 0,
              rightPaddle: 0
            };
       
var serverState = { intervalId: 0, 
                    connections: 0
                  };

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs');

app.listen(80);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function readfile_callback(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        }
    );
};

function calculateBallPosition() {
    var left = state.ball.left + constants.ball.deltaLeft;
    var top = state.ball.top + constants.ball.deltaTop;

    if (left >= constants.court.width) {
        left = constants.court.width;
        constants.ball.deltaLeft = -constants.ball.deltaLeft;
    } else if (left <= 0) {
        left = 0;
        constants.ball.deltaLeft = -constants.ball.deltaLeft;
    }
    if (top + constants.ball.radius >= constants.court.height - constants.paddle.height) {
        if (state.bottomPaddle) {
            console.log(state.bottomPaddle);
            var leftPositionOfBottomPaddle = state.paddles[state.bottomPaddle];
            console.log(leftPositionOfBottomPaddle);
            if (left > ( (leftPositionOfBottomPaddle/100) * 600 - constants.paddle.width / 2) &&
                (left < ( (leftPositionOfBottomPaddle/100) * 600 + constants.paddle.width / 2) ) ) {
              top = constants.court.height - constants.paddle.height - constants.ball.radius;
              constants.ball.deltaTop = -constants.ball.deltaTop;
            }
        } else {
            //TODO: #1
            left = constants.court.width / 2;
            top = constants.court.height / 2;       
        }
    } else if (top <= 0) {
        top = 0;
        constants.ball.deltaTop = -constants.ball.deltaTop;
    }
    state.ball.left = left;
    state.ball.top = top;
};

io.sockets.on('connection', function (socket) {

    var paddleAdded = false;
    if (!state.bottomPaddle) {
        state.bottomPaddle = socket.id;
    } else if (!state.topPaddle) {
        state.topPaddle = socket.id;
    } else if (!state.leftPaddle) {
        state.leftPaddle = socket.id;
    } else if (!state.rightPaddle) {
        state.rightPaddle = socket.id;
    } else {
      // placeholder for fifth player
      return;
    }
    
    state.paddles[socket.id] = 50;
    
    socket.emit('environment', { court:  {  width:  constants.court.width, 
                                            height: constants.court.height,
                                         }, 
                                 paddle: {  width: constants.paddle.width, 
                                            height: constants.paddle.height,
                                            delta: constants.paddle.delta
                                         },
                                 ball: { radius: constants.ball.radius },
                                 player: { id: socket.id }
    });
    
    if ( !serverState.intervalId ) {
        serverState.intervalId = setInterval( function(){
            calculateBallPosition();
        }, constants.ball.interval );  
    }
    
    socket.intervalId = setInterval( function(){
        socket.emit('ball', { position: { left: state.ball.left, top: state.ball.top } }); 
        socket.emit('paddles', { positions: state.paddles, sides: {bottom: state.bottomPaddle, top: state.topPaddle, left: state.leftPaddle, right: state.rightPaddle }});
    }, constants.ball.interval );  
    
    socket.on('paddle', function (data) {
        state.paddles[socket.id] = data.left;
    });
    
    socket.on('disconnect', function () {
        serverState.connections--;
        clearInterval( socket.intervalId );
        delete state.paddles[socket.id];
        // todo: need to give back the side so someone else can take it.
        if ( serverState.connections == 0 ) {
            clearInterval( serverState.intervalId );
            serverState.intervalId = 0;
        }
        console.log('player left');
    });  
    
    console.log(serverState.connections);
    serverState.connections++;
});