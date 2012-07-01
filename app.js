//TODOS:
//Display countown after each score #1
//Splash Page
//  - Join a new game


var connections = 0;

var ballLeft = 0, ballTop = 0, ballRadius = 10,
    ballDirectionInRad = .5,
    ballLeftDelta = 3,
    ballTopDelta = 2,
    sendBallPositionTimeInterval = 15,
    courtWidth = 600, courtHeight = 600,
    paddleWidth = 50,
    paddleHeight = 15,
    paddlePosition = 50,
    paddleDelta = 3,
    intervalId = 0,
    activePlayers = [];

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

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

function updateBallPosition() {
  var newBallLeft = ballLeft + ballLeftDelta;
  var newBallTop = ballTop + ballTopDelta;
  if (newBallLeft >= courtWidth) {
    newBallLeft = courtWidth;
    ballLeftDelta = -ballLeftDelta;
  } else if (newBallLeft <= 0) {
    newBallLeft = 0;
    ballLeftDelta = -ballLeftDelta;
  }
  if (newBallTop + ballRadius >= courtHeight - paddleHeight) {
    if ( (newBallLeft > ( (paddlePosition/100) * 600 - paddleWidth / 2) ) &&
       (newBallLeft < ( (paddlePosition/100) * 600 + paddleWidth / 2) ) ) {
        newBallTop = courtHeight - paddleHeight - ballRadius;
        ballTopDelta = -ballTopDelta;
    } else {
       //TODO: #1
       newBallLeft = courtWidth / 2;
       newBallTop = courtHeight / 2;       
    }
  } else if (newBallTop <= 0) {
    newBallTop = 0;
    ballTopDelta = -ballTopDelta;
  }
  ballLeft = newBallLeft;
  ballTop = newBallTop;
  return { left: ballLeft, top: ballTop };
};

var ball = { left: ballLeft, top: ballTop };

setInterval( function(){
  ball = updateBallPosition();
}, sendBallPositionTimeInterval );  

io.sockets.on('connection', function (socket) {
  connections++;
  console.log(connections);
  socket.emit('environment', { court:  {  width:  courtWidth, 
                                          height: courtHeight,
                                       }, 
                               paddle: {  position: paddlePosition,
                                          width: paddleWidth, 
                                          height: paddleHeight,
                                          delta: paddleDelta
                                       },
                               ball: { radius: ballRadius }       
                             } 
              );          
            
  setInterval( function(){
    socket.emit('ball', { position: { left: ball.left, top: ball.top } }); 
  }, sendBallPositionTimeInterval );  
  
  socket.on('paddle', function (data) {
    paddlePosition = data.left;
  });
  
  socket.on('disconnect', function () {
    connections--;
    if ( connections == 0 ) {
        clearInterval( intervalId );
        intervalId = 0;
    }
    console.log('player left');
  });  
});