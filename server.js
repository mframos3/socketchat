
var fs = require('fs');

var options = {
    key: fs.readFileSync('etc/letsencrypt/live/socketchat.com/privkey.pem'),
    certificate: fs.readFileSync('etc/letsencrypt/live/socketchat.com/fullchain.pem')

}


var restify = require('restify');
var server = restify.createServer(options);
var io = require('socket.io').listen(server.server);
users = [];
connections = [];

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

    socket.on('disconnect', function () {
        if (!socket.username) return;
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('send message', function (data) {
        var today = new Date();
        var timestamp = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        io.sockets.emit('new message', {
            msg: data,
            user: socket.username,
            time: timestamp
        });
    });

    socket.on('new user', function (data, callback) {
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
    }
});