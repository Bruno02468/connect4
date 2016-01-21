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
    var creator = getSocketById(room.creator);
    var opponent = getSocketById(room.opponent);
    if (stillAlive(room.creator)) {
        creator.emit("destroyed", message);
        creator.emit("roomlist", rooms);
    }
    if (stillAlive(room.opponent)) {
        opponent.emit("destroyed", message);
        opponent.emit("roomlist", rooms);
    }
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

function emitGameStatus(id) {
    var room = getRoomById(id);
    var game = games[id];
    var status = {
        board: game.board,
        yourturn: room.creatorTurn,
        yourwins: room.creatorWins,
        theirwins: room.opponentWins,
        stalemates: room.stalemates
    }
    getSocketById(room.creator).emit("game-status", status);
    status.yourturn = !status.yourturn;
    status.yourwins = room.opponentWins;
    status.theirwins = room.creatorWins;
    getSocketById(room.opponent).emit("game-status", status);
}

var games = [];

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
            full: false,
            creatorStarting: true,
            creatorTurn: true,
            creatorWins: 0,
            opponentWins: 0,
            stalemates: 0,
            playing: false
        };
        rooms.push(room);
        games[roomid] = new connect4.Game(connect4.default_rows, connect4.default_columns, connect4.default_goal);
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
                setRoomAttribute(id, "playing", true);
                emitGameStatus(id);
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

    socket.on("playAt", function(column) {
        var id = getSocketRoom(socket.id);
        var room = getRoomById(id);
        if (!room.playing) return;
        var currentTurn = room.creatorTurn ? room.creator : room.opponent;
        if (socket.id !== currentTurn) return;
        if (!games[id].canPlayAt(column)) return;
        var amCreator = socket.id == room.creator;
        var player = amCreator ? 1 : 2;
        games[id].playAt(column, player);
        var winner = games[id].winner();
        switch (winner) {
            case 0: setRoomAttribute(id, "creatorTurn", !room.creatorTurn); break;
            case 1: setRoomAttribute(id, "creatorWins", room.creatorWins + 1); break;
            case 2: setRoomAttribute(id, "opponentWins", room.opponentWins + 1); break;
            case 3: setRoomAttribute(id, "stalemates", room.stalemates + 1); break;
        }
        if (winner > 0) {
            setRoomAttribute(id, "creatorStarting", !room.creatorStarting);
            setRoomAttribute(id, "creatorTurn", room.creatorStarting);
            games[id].initBoard();
        }
        emitGameStatus(id);
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
                games[room.id] = undefined;
            }
        }
        io.emit("server-global-message", socket.name + " has left");
    });
});

http.listen(9991, function(){
    console.log('Server now listening on localhost:9991');
});