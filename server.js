var restify = require('restify');
var server = restify.createServer();
var request = require('request');
var io = require('socket.io').listen(server.server);
var log = require('log-to-file');
users = [];
connections = [];
trivia = "";

function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

server.listen(process.env.PORT || 3000);

server.get('/*', restify.plugins.serveStatic({
    directory: __dirname,
    default: 'index.html'
}));



io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);
    log('Socket connected successfully', 'connections.log');
    socket.on('disconnect', function () {
        if (!socket.username) return;
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
	log('Disconnected: sockets disconnected','connections.log');
    });

    socket.on('send message', function (data) {
	console.log(data);
        var today = new Date();
        var timestamp = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        io.sockets.emit('new message', {
            msg: data,
            user: socket.username,
            time: timestamp
        });
    });

    socket.on('new user', function (data, callback) {
        request.get("http://numbersapi.com/random/trivia", (err, res, body) =>
        {
        trivia = body;
        });

        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
        io.sockets.emit('get trivia', trivia);
    }
});