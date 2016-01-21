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

socket.on("onroom", function(id) {
    document.getElementById("mkroom").style.display = "none";
    socket.emit("joinroom", id);
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

var yours = document.getElementById("yourwins");
var theirs = document.getElementById("theirwins");
var stales = document.getElementById("stalemates");
var gameout = document.getElementById("game-out");

function drawGame(board) {
    gameout.innerHTML = "";
    for (row_index in board) {
        var tr = document.createElement("tr");
        var row = board[row_index];
        for (col_index in row) {
            var td = document.createElement("td");
            var cell = row[col_index];
            td.className = "gamecell ";
            switch (cell) {
                case 0: td.className += "empty"; break;
                case 1: td.className += "creator"; break;
                case 2: td.className += "opponent"; break;
            }
            var col = parseInt(col_index) + 1;
            td.setAttribute("onclick", "socket.emit(\"playAt\", " + col + ")");
            td.innerHTML = "[  ]";
            tr.appendChild(td);
        }
        gameout.appendChild(tr);
    }
}

socket.on("game-status", function (status) {
    yours.innerHTML = status.yourwins;
    theirs.innerHTML = status.theirwins;
    stales.innerHTML = status.stalemates;
    drawGame(status.board);
    console.log(function(arr) {
        var res = "";
        for (index in arr) {
            res += arr[index].join("");
            res += index < (arr.length - 1) ? "\n" : "";
        }
        return res;
    }(status.board));
});

socket.on("couldntjoin", function(err) {
    alert("Failed to join room: " + err);
});

var noroom = document.getElementById("noroom");
var withroom = document.getElementById("withroom");
var roomname = document.getElementById("room_name");
var opponentname = document.getElementById("opponent_name");
var roomarea = document.getElementById("room-chat");
var roomlinput = document.getElementById("roominput")
socket.on("joinsuccess", function(room) {
    noroom.style.display = "none";
    withroom.style.display = "inline-block";
    roomname.innerHTML = room.name;
    roomarea.innerHTML = "Room chat for \"" + room.name + "\"";
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

socket.on("destroyed", function(message) {
    alert("The room you were in was removed. Reason:\n" + message);
    noroom.style.display = "inline-block";
    withroom.style.display = "none";
    roomarea.innerHTML = "";
    roominput.value = "";
});