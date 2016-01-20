// {} w/ <3 by 02468

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var connect4 = require("./connect4");

app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/game.css", function(req, res){
    res.sendFile(__dirname + "/public/game.css");
});

app.get("/game.js", function(req, res){
    res.sendFile(__dirname + "/public/game.js");
});

var online = 0;
var rooms = [];
var roomid = 0;

function getRoomById(id) {
    for (var index in rooms)
        if (rooms[index].id === id) return rooms[index];
}

function setRoomAttribute(id, name, value) {
    for (var index in rooms)
        if (rooms[index].id === id)
            rooms[index][name] = value;
}

function getSocketById(id) {
    return io.sockets.connected[id];
}

function stillAlive(id) {
    return getSocketById(id) !== undefined;
}

function destroyRoom(id, message) {
    var room = getRoomById(id);
    if (stillAlive(room.creator))
        getSocketById(room.creator).emit("destroyed", message);
    if (room.opponent)
        if (stillAlive(room.opponent))
            getSocketById(room.opponent).emit("destroyed", message);
}

function emitToRoom(id, type, obj) {
    var room = getRoomById(id);
    getSocketById(room.creator).emit(type, obj);
    if (room.opponent) getSocketById(room.opponent).emit(type, obj);
}

function getSocketRoom(id) {
    for (var index in rooms) {
        var room = rooms[index];
        if (room.creator === id || room.opponent === id) return room.id;
    }
    return null;
}

io.on('connection', function(socket) {
    online++;
    io.emit("usercount", online);

    socket.on("join", function(msg) {
        socket.name = msg;
        io.emit("server-global-message", msg + " has joined");
        socket.emit("roomlist", rooms);
    });

    socket.on("setname", function(msg) {
        var oldname = socket.name;
        socket.name = msg;
        io.emit("server-global-message", oldname + " has changed name to " + msg);
    });

    socket.on("global-message", function(msg) {
        io.emit("user-global-message", {sender: socket.name, text: msg});
    });

    socket.on("makeroom", function(msg) {
        roomid++;
        var room = {
            creator: socket.id,
            creatorname: socket.name,
            name: msg,
            id: roomid,
            full: false
        };
        rooms.push(room);
        socket.emit("onroom", room.id);
        io.emit("roomlist", rooms);
    });

    socket.on("listrooms", function() {
        socket.emit("roomlist", rooms);
    });

    socket.on("joinroom", function(id) {
        var room = getRoomById(id);
        if (room.full) {
            socket.emit("couldntjoin", "room is full");
            socket.emit("roomlist", rooms);
        } else {
            socket.emit("joinsuccess", room);
            if (socket.id === room.creator) {
                socket.emit("opponent", "<i>waiting for someone</i>");
            } else {
                socket.emit("opponent", room.creatorname);
                setRoomAttribute(id, "opponent", socket.id);
                getSocketById(room.creator).emit("opponent", socket.name);
                setRoomAttribute(id, "full", true);
            }
            emitToRoom(id, "server-room-message", socket.name + " has joined this room.");
        }
    });

    socket.on("room-message", function(msg) {
        var room_id = getSocketRoom(socket.id);
        if (room_id) {
            var room = getRoomById(room_id);
            emitToRoom(room_id, "user-room-message", {sender: socket.name, text: msg});
        }
    });

    socket.on('disconnect', function() {
        online--;
        io.emit("usercount", online);
        for (var index in rooms) {
            var room = rooms[index];
            if (room.creator == socket.id || room.opponent == socket.id) {
                destroyRoom(room.id, "The other player left.");
                rooms.splice(index, 1);
                socket.emit("roomlist", rooms);
            }
        }
        io.emit("server-global-message", socket.name + " has left");
    });
});

http.listen(9991, function(){
    console.log('Server now listening on localhost:9991');
});