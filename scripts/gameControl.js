// Game Control for a Sudoku Game

// @Author:  Randal Holmes 2021


// Initialize/Setup the game.
function init() {
    const gc = new GameControl();
    gc.addButtonClickEvents();
    gc.addNumberPickerEvents();
    gc.addBackgroundDropEvent();
    gc.addGridNumberEventsAndStyles();
    gc.newGame();
}


class GameControl {
    constructor() {
        this.sudoku = new Sudoku();
        this.gameGrid = this.getGrid();              // A two dimensional array of DOM elements that make up the game grid.
        this.numberPicker = this.getNumberPicker();  // An array of DOM elements that make up the number picker row.
        this.messageBox = this.getMessageBox();      // Message display box element.
        this.lastDraggedElm = null;                  // The last DOM element that was dragged or is currently being dragged.
        
    }

    // Returns message box DOM element.
    getMessageBox() {
        const mBox = document.querySelector("#messageDisplay");
        return mBox;
    }


    /***  NUMBER PICKER  ***/

    getNumberPicker() {
        const numPick = Array.from(document.querySelector(".numberPicker").children);
        return numPick;
    }

    addNumberPickerEvents() {
        this.numberPicker.forEach(num => {
            num.draggable = true;
            num.addEventListener("dragstart", e => this.dragStart(num, e));
        });
    }

    
    /***  GRID NUMBERS  ***/

    // Record references to all number elements of the game grid for later use.
    getGrid() {
        const gridElm = document.querySelector(".gameGrid");
        const grid = [];
        Array.from(gridElm.children).forEach(child => {
            grid.push(Array.from(child.children));
        });

        return grid;
    }

    // Returns the current state of the game grid in a format that "this.sudoku" understands.
    getBoardData() {
        const board = this.sudoku.getClearedBoard();
        for (let row=0; row<9; ++row) {
            for (let col=0; col<9; ++col) {
                board[row][col] = (this.gameGrid[row][col].innerHTML == "&nbsp;") ? "." : this.gameGrid[row][col].innerHTML;
            }
        }

        return board;
    }

    // Adds events and styles to game grid numbers.
    addGridNumberEventsAndStyles() {
        for (let row of this.gameGrid) {
            for (let num of row) {
                num.draggable = true;
                num.dropZone = true;
                num.style.cursor = "grab";
                num.style.color = "black";
                num.addEventListener("dragstart", e => this.dragStart(num, e));
                num.addEventListener("dragover", e => this.dragOver(num, e));
                num.addEventListener("drop", e => this.dragDrop(num, e));
            }
        }
    }

    // Make it possible to drop dragged elements onto background.
    addBackgroundDropEvent() {
        // Both of the following events are required to make an element accept drop events.
        const background = document.querySelector("body");
        background.addEventListener("dragover", e => this.dragOver(background, e));
        background.addEventListener("drop", e => this.dragDrop(background, e));
    }


    // Event handler for the beginning of an element drag event.
    dragStart(elm, event) {
        this.lastDraggedElm = elm;
    }


    // Event handler for an element being dragged over another element that
    // is open to a drop event. 
    dragOver(elm, event) {
        event.preventDefault();
    }


    // Event handler for dropping one element onto another.
    // Multiple different actions are required depending upon what element is 
    // being dropped on.
    dragDrop(elm, event) {
        event.preventDefault();

        // Do nothing if dropping on self.
        if (elm === this.lastDraggedElm) return;

        // If elm does not accept drops then leave.
        if (elm.dropZone === false) return;

        // If elm is background/html body, then remove number from last dragged element.
        // This provides a way for players to remove numbers from the board.
        if (elm.tagName === "BODY" && !this.lastDraggedElm.parentNode.className === "numberPicker") {
            this.lastDraggedElm.innerHTML = "&nbsp";
            return;
        }

        // Elm is a grid number that accepts dropped numbers. Copy value over.
        if (elm.className === "number") {
            elm.innerHTML = this.lastDraggedElm.innerHTML;
        }
        
        // if dragged element is a grid element then clear that element's value/number.
        if (this.lastDraggedElm.parentNode.className === "numberRow") {
            this.lastDraggedElm.innerHTML = "&nbsp";
        }

        // If we get this far we do not want the event to bubble up to gameBoard.
        event.stopPropagation();
    }


    /*******************/
    /***   BUTTONS   ***/
    /*******************/
    addButtonClickEvents() {
        const btns = Array.from(document.getElementById("buttons").children);
        btns.forEach(btn => {
            btn.addEventListener("click", e => this.handleButtons(btn));
        });
    }


    // Event handler for all buttons
    handleButtons(btn) {
        switch (btn.value) {
            case "New Game":
                this.newGame();
                break;
            case "Hint" :
                this.hint();
                break;
            case "Validate":
                this.validate();
                break;
            case "Cheat":
                this.cheat();
                break;
            default:
                console.log("Unhandled button click for button: " + btn.value);
        }
    }


    // Start a new random game
    newGame() {
        const board = this.sudoku.createNewBoard();

        // Copy board data over to game grid; tweaking properties as needed.
        for (let r=0; r<9; ++r) {
            for (let c=0; c<9; ++c) {
                let numElm = this.gameGrid[r][c];

                // Fill each position on the board with a blank space or the appropiate number.
                // Numbered elements are not interactive.
                if (board[r][c] == ".") {
                    // Turn on interactivity.
                    numElm.innerHTML = "&nbsp";
                    numElm.draggable = true;
                    numElm.dropZone = true;
                    numElm.style.cursor = "grab";
                    numElm.style.color = "black";
                } else {
                    // Turn off interactivity.
                    numElm.innerHTML = board[r][c];
                    numElm.draggable = false;
                    numElm.dropZone = false;
                    numElm.style.cursor = "default";
                    numElm.style.color = "DeepPink";
                }
 
            }
        }

        this.messageBox.innerHTML = "Start Game!";
    }


    // Provide a helpfull message to the player.
    hint() {
        const boardData = this.getBoardData();
        const hint = this.sudoku.getHint(boardData);
        if (hint.success) {
            this.messageBox.innerHTML = `Try a ${hint.value} at row ${hint.row} and column ${hint.col}.`;
        } else {
            this.messageBox.innerHTML = hint.value;
        }
    }

    
    // Determine if the game grid is filled in correctly.
    validate() {
        const boardData = this.getBoardData();
        if (this.sudoku.isCompleteAndValid(boardData)) {
            this.messageBox.innerHTML = "Congrats! The board is complete and correct."
        } else {
            this.messageBox.innerHTML = `There is a problem with the board: ${this.sudoku.getLastMessage()}`
        }
    }

    // Used for manual testing. To use: Add a button element to the "Buttons" div in the 
    // file "Sudoku.html" with value="Cheat".
    cheat() {
        const board = this.sudoku.getBoard();
        for (let row=0; row<9; ++row) {
            for (let col=0; col<9; ++col) {
                this.gameGrid[row][col].innerHTML = (board[row][col] == ".") ? "&nbsp" : board[row][col];
            }
        }
    }
}

init();