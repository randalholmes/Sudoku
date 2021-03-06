/**
    @Author:  Randal Holmes 2021
 
    A Sudoku game Solver and Validater class.

    Generates data for new random games. Provides hints for these games, and
    evaluates submitted solutions for correctness.

    A sudoku solution must satisfy all of the following rules:

        Each of the digits 1-9 must occur exactly once in each row.
        Each of the digits 1-9 must occur exactly once in each column.
        Each of the digits 1-9 must occur exactly once in each of
        the 9 3x3 sub-boxes of the grid.

    The '.' character indicates empty cells.

    Sample Data:

    Input: board =
    [["5","3",".",".","7",".",".",".","."],
    ["6",".",".","1","9","5",".",".","."],
    [".","9","8",".",".",".",".","6","."],
    ["8",".",".",".","6",".",".",".","3"],
    ["4",".",".","8",".","3",".",".","1"],
    ["7",".",".",".","2",".",".",".","6"],
    [".","6",".",".",".",".","2","8","."],
    [".",".",".","4","1","9",".",".","5"],
    [".",".",".",".","8",".",".","7","9"]]


    Output:
    [["5","3","4","6","7","8","9","1","2"],
    ["6","7","2","1","9","5","3","4","8"],
    ["1","9","8","3","4","2","5","6","7"],
    ["8","5","9","7","6","1","4","2","3"],
    ["4","2","6","8","5","3","7","9","1"],
    ["7","1","3","9","2","4","8","5","6"],
    ["9","6","1","5","3","7","2","8","4"],
    ["2","8","7","4","1","9","6","3","5"],
    ["3","4","5","2","8","6","1","7","9"]]
 
**/


class Sudoku {
    constructor() {
        this.board = null;               // A two dimensional array that holds the data for the board.
        this.numberOfStartingNums = 20;  // How many numbers should be pre-filled in for new board.
        this.lastMessage = "";           // Error and other information messages.
        this.startTime = Date.now();     // Used when solving puzzels. If it takes too long, we try a new puzzel.
    }

    // Returns last message generated by a method call.
    getLastMessage() {
        return this.lastMessage;
    }


    // Returns a copy of the current board data.
    getBoard() {
        return this.cloneBoard(this.board);
    }


    // Validates that a board is complete and correctly filled in.
    isCompleteAndValid(board){
        if (!this.isFullBoard(board)) {
            this.lastMessage = "The board contains one or more empty slots.";
            return false;
        }

        return this.isValidSudoku(board);
    }


    // Returns a suggestion for solving a board.
    getHint(board) {
        const hint = {success:false, row:0, col:0, value:null};

        if (!this.isValidSudoku(board)) {
            hint.value = this.lastMessage;
            return hint;
        }

        // Create the inverse of "board". Which will be used to pick a random hint from.
        const tmpBoard = this.cloneBoard(this.board);

        for (let r=0; r<9; ++r) {
            for (let c=0; c<9; ++c) {
                tmpBoard[r][c] = (board[r][c] == ".") ? tmpBoard[r][c] : ".";
            }
        }
        
        // A set of row numbers that we randomly pick from
        const rowNumSet = [0,1,2,3,4,5,6,7,8];

        // Pick a random row to find a value to use as a hint.
        while (rowNumSet.length) {
            let index = this.getRandomInt(0, rowNumSet.length);
            let row = rowNumSet[index];
            rowNumSet.slice(index, 1);

            // Randomize search pattern. left->right or right->left
            if (this.getRandomInt(0,2)) {
                for (let col=0; col<9; ++col) {
                    if (tmpBoard[row][col] !== ".") {
                        hint.success = true;
                        hint.row = row + 1;
                        hint.col = col + 1;
                        hint.value = tmpBoard[row][col];
                        return hint;
                    }
                }
            } else {
                for (let col=8; col > -1; --col) {
                    if (tmpBoard[row][col] !== ".") {
                        hint.success = true;
                        hint.row = row + 1;
                        hint.col = col + 1;
                        hint.value = tmpBoard[row][col];
                        return hint;
                    }
                }
            }

        }

        // If we get this far then the board may be complete
        const valid = this.startSolving(board);
        if (valid) {
            hint.value = "This board is complete and valid. Congrats.";
        } else {
            hint.value = "An unknown error exists. Sorry. Can not help.";
        }

        return hint;
    }


    // Creates the starting configuration for a new game.
    createNewBoard() {
        let board = this.getClearedBoard(); // Data set for a game board with no numbers added.
        let startingBoard = null;           // This is the partially filled board that is returned.

        // Place random numbers 1-9 on board to create a random configuration for a new game.
        let done = false;
        while (!done) {

            // Add a starting set of numbers to the empty board. Place numbers randomly.
            for (let cnt=0; cnt<this.numberOfStartingNums; ++cnt) {
                let num = this.getRandomInt(1, 10);
                let row = this.getRandomInt(0, 9);
                let col = this.getRandomInt(0, 9);
                board[row][col] = num;
            }

            // Verify that no rules were broken in the placement of the numbers.
            done = this.isValidSudoku(board);
            if (!done) {
                // Broke rules. Try again from start.
                board = this.getClearedBoard();
                continue; 
            }

            // Need seperate copy of the board because the call to solveSudoku() below fills 
            // the entire board in, and we do not want to return a reference to private data.
            startingBoard = this.cloneBoard(board);  

            // Verify that the board can be solved.
            done = this.startSolving(board);
            if (!done) {
                board = this.getClearedBoard(); // Can not be solved. Start over with new random set.
            }
        }

        this.board = board;

        return startingBoard;
    }
    
    
    // Create an empty board
    getClearedBoard() {
        const board = [];
        for (let r=0; r<9; ++r) {
            board.push(new Array(9).fill("."));
        }

        return board;
    }


    // Do deep copy with no reference copying.
    cloneBoard(board) {
        const newBoard = [];
        board.forEach(row => newBoard.push([...row])); 
        return newBoard;
    }


    // Check that every slot on the board has a number.
    isFullBoard(board) {
        for (let row of board) {
            if (row.some(num => num === ".")) return false;
        }

        return true;
    }


    // Random number generator
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }
      

    // 
    startSolving(board) {
        if (!this.isValidSudoku(board)) {
            return false;
        }

        this.startTime = Date.now();

        try {
            return this.solveSudoku(board);
        } catch(e) {
            // Catch timeout errors. If it takes too long to solve a puzzle we give up.
            return false;
        }
    }


    // A recursive function that tries to solve a Sudoku puzzle.
    solveSudoku(board) {
        // Iterate through all rows and columns of "board" trying values in
        // the range of 1-9 to see if they will satisfy the constraints of
        // of the puzzle. If a value turns out not to work then backtracking
        // is used to try alternative values.
        for (let r=0; r<9; ++r){
            for (let c=0; c<9; ++c) {
                if (board[r][c] == ".") {  // have an empty slot.
                    // Try the values 1-9 to see if they will work.
                    for (let num=1; num<10; ++num){
                        let val=num.toString();
                        if (this.isValidGuess(board, r, c, val)) {
                            board[r][c] = val;
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                        }
                    }

                    // Kill long running processes
                    if (Date.now() - this.startTime > 3000) {
                        const e = new Error("Solving Sudoku time out error.");
                        e.message = "It is taking too long to solve puzzle. Gave up trying.";
                        throw e;
                    }

                    // Failed to find a value that works in the current board position.
                    // Clear current board position and backtrack.
                    board[r][c] = ".";
                    return false;
                }
            }
        }

        return true; // completed board.
    }
  

    // Verifies that 'val' in position (r,c) meets constraints.
    isValidGuess(board, r, c, val) {
        // Check if val is in row 'r'.
        if (board[r].some(num => num == val)) return false;
    
        // Check if val is in column 'c'
        for (let row=0; row<9; ++row) {
            if (board[row][c] == val) return false
        }
    
        // Check if val is in sub-box.
        const row = Math.floor(r/3) * 3;
        const col = Math.floor(c/3) * 3;
        for (let rDelta=0; rDelta<3; ++rDelta) {
            for (let cDelta=0; cDelta<3; ++cDelta) {
                if (board[row + rDelta][col + cDelta] == val) return false;
            }
        }
    
        return true; // 'val' at position (r,c) meets all constraints.
    }
  

    // Prints 'board' data to console nicely formatted.
    prettyPrint(board) {
        for (let row of board) {
            console.log(row.join(","));
        }
    }
  

    // Verifies that a Sudoku board is correct or not. It ignores empty slots
    isValidSudoku(board) {
        // Set up lists of empty Sets for storing found values in the 'board'.
        const rows = [];  // Rows in board
        const cols = [];  // Columns in board
        const subBs = []; // Sub-boxes in board 

        for (let x=0; x<9; ++x) {
            rows.push(new Set());
            cols.push(new Set());
            subBs.push(new Set());
        }
    
        // Iterate through all values in board and verify they meet constraints.
        for (let r=0; r<9; ++r) {
            for (let c=0; c<9; ++c) {
                let val = board[r][c];

                if (val==".") continue; // Skip over empty slots.
        
                if (rows[r].has(val)) {
                    this.lastMessage = `Row ${r+1} has duplicate ${val}.`;
                    return false;
                }

                rows[r].add(val);
        
                if (cols[c].has(val)) {
                    this.lastMessage =  `Column ${c+1} has duplicate ${val}.`;
                    return false;
                }

                cols[c].add(val);
        
                let BoxNum =(Math.floor(r/3) * 3) + Math.floor(c/3);
                if (subBs[BoxNum].has(val)) {
                    this.lastMessage = `Sub-Box ${BoxNum + 1} has duplicate ${val}.`;
                    return false;
                }

                subBs[BoxNum].add(val);
            }
        }

        this.lastMessage = "This board is valid.";
        return true;
    }
  
  
    test() {
        let board =
        [["5","3",".",".","7",".",".",".","."],
        ["6",".",".","1","9","5",".",".","."],
        [".","9","8",".",".",".",".","6","."],
        ["8",".",".",".","6",".",".",".","3"],
        ["4",".",".","8",".","3",".",".","1"],
        ["7",".",".",".","2",".",".",".","6"],
        [".","6",".",".",".",".","2","8","."],
        [".",".",".","4","1","9",".",".","5"],
        [".",".",".",".","8",".",".","7","9"]];
    
        console.log("\nStarting Board")
        this.prettyPrint(board);
    
        this.solveSudoku(board);
    
        console.log("\n\nSolution to Board")
        this.prettyPrint(board);
        console.log(this.isValidSudoku(board));
     }
  
}