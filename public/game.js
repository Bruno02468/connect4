// {} w/ <3 by 02468

function htmlspecialchars(text) {
    var map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "\"": "&#039;"
    };
    return text.replace(/[&<>""]/g, function(m) { return map[m]; });
}

var room = null;
var socket = io();
var name;
function setname(change) {
    name = htmlspecialchars(prompt("Enter username").trim());
    while (name.length < 3) {
        name = htmlspecialchars(prompt("actual username pls").trim());
    }
    localStorage["connect4-name"] = name;
    if (change) socket.emit("setname", name);
}

if (localStorage["connect4-name"] == "" || localStorage["connect4-name"] == undefined) {
    setname(false);
} else {
    name = localStorage["connect4-name"];
}
socket.emit("join", name);

var globalwrapper = document.getElementById("globalchat-wrapper");
var roomwrapper = document.getElementById("roomchat-wrapper");
var globalarea = document.getElementById("global-chat");
var globalinput = document.getElementById("globalinput")
function globalchat(string) {
    globalarea.innerHTML += "\n" + htmlspecialchars(string);
    globalarea.scrollTop = globalarea.scrollHeight;
}

socket.on("server-global-message", function(string) {
    globalchat(" ** " + string + " **")
});

function globalkeydown(event) {
    if (event.keyCode == 13) {
        if (globalinput.value == "/setname") {
            setname(true);
        } else {
            socket.emit("global-message", globalinput.value);
        }
        globalinput.value = "";
    }
}

socket.on("user-global-message", function(message) {
    globalchat(message.sender + ": " + message.text);
});

function makeroom() {
    var roomname = htmlspecialchars(prompt("Enter room name").trim());
    while (name.length < 3) {
        roomname = htmlspecialchars(prompt("actual room name pls").trim());
    }
    socket.emit("makeroom", roomname);
}

var amcreator = false;
var mkroom = document.getElementById("mkroom");
socket.on("onroom", function(id) {
    mkroom.style.display = "none";
    socket.emit("joinroom", id);
    amcreator = true;
});

var roomlist = document.getElementById("roomlist");
socket.on("roomlist", function(rooms) {
    roomlist.innerHTML = "";
    for (index in rooms) {
        var room = rooms[index];
        if (room.full) continue;
        var item = document.createElement("div");
        item.className = "room-item";
        item.addEventListener("click", function() { socket.emit("joinroom", room.id); });
        item.innerHTML = "\"" + htmlspecialchars(room.name) + "\", created by " + room.creatorname;
        roomlist.appendChild(item);
    }
});

socket.on("canMakeRoom", function() {
    mkroom.style.display = "inline-block";
});

socket.on("couldntjoin", function(err) {
    alert("Failed to join room: " + err);
});

var noroom = document.getElementById("noroom");
var withroom = document.getElementById("withroom");
var roomname = document.getElementById("room_name");
var opponentname = document.getElementById("opponent_name");
var roomarea = document.getElementById("room-chat");
var roomlinput = document.getElementById("roominput");
var youcolor = document.getElementById("youcolor");
var themcolor = document.getElementById("themcolor");
socket.on("joinsuccess", function(room) {
    noroom.style.display = "none";
    withroom.style.display = "block";
    globalwrapper.style.display = "none";
    roomwrapper.style.display = "block";
    roomname.innerHTML = room.name;
    roomarea.innerHTML = "Room chat for \"" + room.name + "\"";
    if (amcreator) {
        youColor.style.backgroundColor = "yellow";
        themColor.style.backgroundColor = "red";
    } else {
        youColor.style.backgroundColor = "red";
        themColor.style.backgroundColor = "yellow";
    }
});

socket.on("opponent", function(name) {
    opponent_name.innerHTML = name;
});

function roomchat(string) {
    roomarea.innerHTML += "\n" + htmlspecialchars(string);
    roomarea.scrollTop = roomarea.scrollHeight;
}

socket.on("server-room-message", function(string) {
    roomchat(" ** " + string + " **")
});

function roomkeydown(event) {
    if (event.keyCode == 13) {
        socket.emit("room-message", roominput.value);
        roominput.value = "";
    }
}

socket.on("user-room-message", function(message) {
    roomchat(message.sender + ": " + message.text);
});

var yours = document.getElementById("yourwins");
var theirs = document.getElementById("theirwins");
var stales = document.getElementById("stalemates");
var gameout = document.getElementById("game-out");
var turn = document.getElementById("turn");
var drawnRows, drawCols;

function drawGame(board) {
    gameout.innerHTML = "";
    drawnRows = board.length;
    drawnCols = board[0].length;
    for (row_index in board) {
        var row = board[row_index];
        for (col_index in row) {
            var but = document.createElement("span");
            var cell = row[col_index];
            switch (cell) {
                case 0: but.setAttribute("class", "empty"); break;
                case 1: but.setAttribute("class", "creator"); break;
                case 2: but.setAttribute("class", "opponent"); break;
            }
            var col = parseInt(col_index) + 1;
            but.setAttribute("onclick", "socket.emit(\"playAt\", " + col + ")");
            but.setAttribute("id", "cell-" + row_index + "-" + col_index);
            but.setAttribute("onmouseover", "boldColumn(" + col_index + ")");
            but.setAttribute("onmouseout", "unboldColumn(" + col_index + ")");
            gameout.appendChild(but);
        }
        gameout.innerHTML += "<div style=\"height: 44px;\">&nbsp;</span><br>"
    }
}

function boldColumn(column) {
    if (!yourturn) return;
    for (var row = 0; row < drawnRows; row++) {
        var elem = document.getElementById("cell-" + row + "-" + column);
        elem.style.border = "1px solid black";
    }
}

function unboldColumn(column) {
    for (var row = 0; row < drawnRows; row++) {
        var elem = document.getElementById("cell-" + row + "-" + column);
        elem.style.border = "1px solid gray";
    }
}

var yourturn = false;
socket.on("game-status", function (status) {
    yours.innerHTML = status.yourwins;
    theirs.innerHTML = status.theirwins;
    stales.innerHTML = status.stalemates;
    drawGame(status.board);
    yourturn = status.yourturn;
    if (status.yourturn) {
        turn.innerHTML = "<b>Your turn</b>";
    } else {
        turn.innerHTML = "Their turn";
    }
});

socket.on("destroyed", function(message) {
    alert("The room you were in was removed. Reason:\n" + message);
    noroom.style.display = "block";
    withroom.style.display = "none";
    roomarea.innerHTML = "";
    roominput.value = "";
    globalwrapper.style.display = "block";
    roomwrapper.style.display = "none";
    amcreator = false;
});