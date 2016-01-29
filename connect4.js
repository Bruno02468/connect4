// {} w/ <3 by 02468

function Game(rows, columns, goal) {
    this.columns = columns;
    this.rows = rows;
    this.goal = goal;
    this.initBoard();
}

Game.prototype.initBoard = function() {
    this.board = [];
    for (var row = 1; row <= this.rows; row++) {
        this.board.push([]);
        for (var i = 1; i <= this.columns; i++)
            this.board[row-1].push(0);
    }
};

Game.prototype.getAt = function(row, column) {
    return this.board[row-1][column-1];
};

Game.prototype.setAt = function(row, column, player) {
    this.board[row-1][column-1] = player;
};

Game.prototype.canPlayAt = function(column) {
    return this.getAt(1, column) === 0;
};

Game.prototype.playAt = function(column, player) {
    if (this.canPlayAt(column)) {
        var row = 1;
        while (this.getAt(row + 1, column) === 0) {
            row++;
            if (row == this.rows) break;
        }
        this.setAt(row, column, player);
    }
};

Game.prototype.getColumns = function() {
    var columns = [];
    for (var column = 1; column <= this.columns; column++) {
        columns.push([]);
        for (var row = 1; row <= this.rows; row++)
            columns[column-1].push(this.getAt(row, column));
    }
    return columns;
};

Game.prototype.mirror = function() {
    for (var index in this.board) {
        this.board[index].reverse();
    }
};

Game.prototype.getLTRDiagonals = function() {
    var diagonals = [];
    var startRow = this.rows;
    var startCol = 1;
    var endRow = 1;
    var endCol = this.columns;
    while (startCol !== endCol) {
        var diagonal = [];
        var currRow = startRow;
        var currCol = startCol;
        while (currRow <= this.rows && currCol <= this.columns) {
            diagonal.push(this.getAt(currRow, currCol));
            currRow++;
            currCol++;
        }
        if (startRow !== endRow) startRow--;
        else if (startCol !== endCol) startCol++;
        diagonals.push(diagonal);
    }
    return diagonals;
};

Game.prototype.getDiagonals = function() {
    var ltr = this.getLTRDiagonals();
    this.mirror();
    var rtl = this.getLTRDiagonals();
    this.mirror();
    return ltr.concat(rtl);
};

Game.prototype.playable = function() {
    return this.board[0].indexOf(0) > -1;
};

Game.prototype.joinInLines = function(arr) {
    var res = "";
    for (index in arr) {
        res += arr[index].join("");
        res += index < (arr.length - 1) ? "\n" : "";
    }
    return res;
};

Game.prototype.winner = function() {
    for (var player = 1; player <= 2; player++) {
        var find = "";
        while (find.length < this.goal) find += player;
        var horizontal = this.joinInLines(this.board);
        var vertical = this.joinInLines(this.getColumns());
        var diagonal = this.joinInLines(this.getDiagonals());
        if (horizontal.indexOf(find) > -1
            || vertical.indexOf(find) > -1
            || diagonal.indexOf(find) > -1) return player;
    }
    return this.playable() ? 0 : 3;
};

module.exports = {
    default_columns: 7,
    default_rows: 6,
    default_goal: 4,

    empty: 0,
    creator: 1,
    opponent: 2,

    Game: Game
};