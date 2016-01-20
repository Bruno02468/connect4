// {} w/ <3 by 02468

function Game(columns, rows, goal) {
    this.columns = columns;
    this.rows = rows;
    this.goal = goal;
    this.board = [];
}

Game.prototype.initBoard = function() {
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

Game.prototype.canPlay = function(column) {
    return getAt(1, column) === 0;
};

Game.prototype.play = function(player, column) {
    if (this.canPlay(column)) {
        var row = 1;
        while (this.getAt(row+1, column) === 0) row++;
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

Game.prototype.getDiagonals = function() {
    for (var colAdder = 1; colAdder >= -1; colAdder -= 2) {
        // todo
    }
};

module.exports = {
    default_columns: 7,
    default_rows: 6,

    empty: 0,
    creator: 1,
    opponent: 2,

    Game: Game
};