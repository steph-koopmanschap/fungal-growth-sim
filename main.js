/*
// NAME: Fungal Growth Sim
// CONTRIBUTORS: Steph Koopmanschap
// VERSION: 1.0
*/

// ====== GLOBAL DECLARATIONS =========

//Screen Settings
var ScreenWidth = 800;
var ScreenHeight = 600;
var MainScreen = null;
var Canvas2D = null;
//Framerate and looping variables
var GameSpeed = 1;
var FPS = 60 * GameSpeed;
var frameRate = (1/FPS)*1000;
var globalCock = null;
//Check if the main loop is running or not
var isRunning = false;
//Debugging mode for verbose logging
//Do note that debugMode slows down the program
var DebugMode = false;
//Verboseness of the debugging log
//level 1 = small
//level 2 = high
//level 3 = extreme (slows down the program more)
var DebugLevel = 2;
var debugClock = null;
//The Grid of Food
//The size of each block in the grid in pixels. (only used for rendering blocks on screen)
var gridBlockSize = 10; 
var gridColumns = 80; //ScreenWidth / gridBlockSize
var gridRows = 60; //ScreenHeight/ gridBlockSize
var SimGrid;
var totalFood = 0;
var averageFood = 0;
var statisticsTimer = null;

// ======  =========

// O+O+O+O+O+O USER INPUT & OUTPUT FUNCTIONS O+O+O+O+O+O+0

const totalFoodOutput = document.getElementById('totalFood');  
const avrgFoodOutput = document.getElementById('avrgFood');  
const renderFoodCheckbox = document.getElementById('foodRenderToggle');

function sproutSpore() {
    console.log("Spore sprouted");
    let randomRow = randIntRange(0, gridRows-1);
    let randomColumn = randIntRange(0, gridColumns-1);
    SimGrid[randomRow][randomColumn].foodValue = 0;
    //SimGrid[randomRow][randomColumn].isFungus = true;
    SimGrid[randomRow][randomColumn].isGrowthTip = true;
}

//nothing
function test() {
    console.log("test");
}

//Give a random food value between 0 and 10 to all Pulsers in the grid
function reset() {
    console.log("RESET");
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            SimGrid[i][j].isFungus = false;
            SimGrid[i][j].isGrowthTip = false;
            SimGrid[i][j].foodValue = randIntRange(0, 10);
        }
    }
    calcStatistics();
}

//Completely disable the mainloop, debug logger, and clear the screen (program restart probably required after this)
function end() {
    console.log("END");
    isRunning = false;
    clearTimeout(globalCock);
    clearInterval(debugClock);
    clearInterval(statisticsTimer);
    clearCanvas();
}

// O+O+O+O+O+O O+O+O+O+O+O+0

//returns a random integer between min and max
function randIntRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function update() {
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            //Render food sources
            if (renderFoodCheckbox.checked === true) {
                //Determine colors of the food values
                if (SimGrid[i][j].foodValue <= 0) {
                    SimGrid[i][j].color = "black";
                } 
                else if (SimGrid[i][j].foodValue >= 1 && SimGrid[i][j].foodValue <= 5) {
                    SimGrid[i][j].color = "red";
                } 
                else if (SimGrid[i][j].foodValue >= 6 && SimGrid[i][j].foodValue <= 9) {
                    SimGrid[i][j].color = "yellow";
                }
                else if (SimGrid[i][j].foodValue >= 10) {
                    SimGrid[i][j].color = "green";    
                }
            } else { //Do not render food sources
                SimGrid[i][j].color = "black";
            }

            //Behaviour when block has fungus, but no growth tip
            if (SimGrid[i][j].isFungus === true) {
                //Fungus blocks are rendered white
                SimGrid[i][j].color = "white";
                //Food value will be set to 0 when it has fungus because the food is consumed
                SimGrid[i][j].foodValue = 0;
            } 
            //Behaviour when block has fungus, and is a growth tip
            if (SimGrid[i][j].isGrowthTip === true) 
            {
                //Growth tips are blue
                SimGrid[i][j].color = "blue";
                SimGrid[i][j].foodValue = 0;
                //Check the neighbouring grid blocks and check which has the highest food source
                //These variable declarations are here so that Math.max still functions
                //even when the neighbour is out of bounds or undefined.
                let top = {foodValue: 0};
                let bottom = {foodValue: 0};
                let left = {foodValue: 0};
                let right = {foodValue: 0};
                //The if statemements below prevent out of bounds errors. 
                //It checks if the neighbour of the this block is outside of the screen and thus outside the array
                //top
                if (!(i-1 < 0)) {
                    top = SimGrid[i-1][j];
                }
                //bottom
                if (!(i+1 > gridRows-1)) {
                    bottom = SimGrid[i+1][j];
                }
                //left
                if (!(j-1 < 0)) {
                    left = SimGrid[i][j-1];
                }
                //right
                if (!(j+1 > gridColumns-1)) {
                    right = SimGrid[i][j+1];
                }
                let highestValue = Math.max(top.foodValue, bottom.foodValue, left.foodValue, right.foodValue);
                
                /* EXPERIMENTAL CODE
                switch(highestValue) {
                    case top.foodValue:
                        //Do nothing if the neighbour is already a fungus or a growth tip
                        if(top.isFungus === true || top.isGrowthTip === true) {
                            return 0;
                        }
                        top.foodValue = 0;
                        top.isFungus = false;
                        top.isGrowthTip = true;
                        break;
                    case bottom.foodValue:
                        //Do nothing if the neighbour is already a fungus or a growth tip
                        if(bottom.isFungus === true || bottom.isGrowthTip === true) {
                            return 0;
                        }
                        bottom.foodValue = 0;
                        bottom.isFungus = false;
                        bottom.isGrowthTip = true;
                        break;
                    case left.foodValue:
                        //Do nothing if the neighbour is already a fungus or a growth tip
                        if(left.isFungus === true || left.isGrowthTip === true) {
                            return 0;
                        }
                        left.foodValue = 0;
                        left.isFungus = false;
                        left.isGrowthTip = true;
                        break;
                    case right.foodValue:
                        //Do nothing if the neighbour is already a fungus or a growth tip
                        if(right.isFungus === true || right.isGrowthTip === true) {
                            return 0;
                        }
                        right.foodValue = 0;
                        right.isFungus = false;
                        right.isGrowthTip = true;
                        break;
                    default:
                        break;
                }
                */

                //Decide which block to grow into a fungus / growth tip. (neighbour with highest food value)
                switch(highestValue) {
                    case top.foodValue:
                        top.foodValue = 0;
                        top.isFungus = false;
                        top.isGrowthTip = true;
                        break;
                    case bottom.foodValue:
                        bottom.foodValue = 0;
                        bottom.isFungus = false;
                        bottom.isGrowthTip = true;
                        break;
                    case left.foodValue:
                        left.foodValue = 0;
                        left.isFungus = false;
                        left.isGrowthTip = true;
                        break;
                    case right.foodValue:
                        right.foodValue = 0;
                        right.isFungus = false;
                        right.isGrowthTip = true;
                        break;
                    default:
                        break;
                }
                //Original one stops being a growth tip and starts being a fungus
                SimGrid[i][j].isGrowthTip = false;
                SimGrid[i][j].isFungus = true;
                //Small chance that the original one keeps being a growth tip. (promote branching) -- EXPERIMENTAL
                if (randIntRange(0, 100) === 50) {
                    SimGrid[i][j].isGrowthTip = true;
                    SimGrid[i][j].isFungus = false;
                }
            }
        }
    }
}

function draw() {
    clearCanvas();
    //Draw the blocks of the grid
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            Canvas2D.fillStyle = SimGrid[i][j].color;
            Canvas2D.fillRect(SimGrid[i][j].screenLocation[0], SimGrid[i][j].screenLocation[1], gridBlockSize, gridBlockSize);
        }
    }
}

//+++ THESE VARIABLES ARE USED IN CHECKING EXECUTION TIMES OF THE PROGRAM +++
//Counts up by 1 for every program cycle. Is reset to o at 1oo program cycles
var hundredCyclesCounter = 0;
const maxCyclesToCount = 100;
//Total looping execution times over a 100 program cycle period (resets to o at 100 cycles)
//(Needed for calculating the average)
var totalMainLoopTime = 0;
var totalUpdateLoopTime = 0;
var totalDrawLoopTime = 0;
//Average looping execution times over a 100 program cycle (re-calculated every 100th cycle)
var avrgMainLoopTime = 0;
var avrgUpdateLoopTime = 0;
var avrgDrawLoopTime = 0;
//+++ +++

function mainLoop() {
    globalCock = setTimeout(() => {
        if (isRunning === true) {
            let mainLoopStartTime = 0;
            let mainLoopEndTime = 0;
            let mainLoopTime = 0;
            let updateLoopStartTime = 0;
            let updateLoopEndTime = 0;
            let updateLoopTime = 0;
            let drawLoopStartTime = 0;
            let drawLoopEndTime = 0;
            let drawLoopTime = 0;
            
            if (DebugMode === true && DebugLevel >= 2) {
                //Check how long it takes for 1 program cycle to execute.
                mainLoopStartTime = performance.now();
                //Check how long it takes for 1 update to execute.
                updateLoopStartTime = performance.now();
            }
            //Main proccesing
            update();
            if (DebugMode === true && DebugLevel >= 2) {
                updateLoopEndTime = performance.now();
                updateLoopTime = updateLoopEndTime - updateLoopStartTime;
            }
            
            //Check how long it takes for 1 draw to execute.
            if (DebugMode === true && DebugLevel >= 2) {
                drawLoopStartTime = performance.now();
            }
            //Draw the screen after updating
            draw();
            
            //=================================================
            //From here on its just checking how fast the program executes to analyze bottlenecks
            //=================================================

            if (DebugMode === true && DebugLevel >= 2) {
                drawLoopEndTime = performance.now();
                drawLoopTime = drawLoopEndTime - drawLoopStartTime;

                mainLoopEndTime = performance.now();
                mainLoopTime = mainLoopEndTime - mainLoopStartTime;
        
                //Add the times of every cycle together
                totalMainLoopTime += mainLoopTime;
                totalUpdateLoopTime += updateLoopTime;
                totalDrawLoopTime += drawLoopTime;
    
                //increment the cycle counter by 1 every cycle
                hundredCyclesCounter += 1;
    
                if(hundredCyclesCounter >= maxCyclesToCount) {
                    //Calculate the average execution times
                    avrgMainLoopTime = totalMainLoopTime / maxCyclesToCount;
                    avrgUpdateLoopTime = totalUpdateLoopTime / maxCyclesToCount;
                    avrgDrawLoopTime = totalDrawLoopTime / maxCyclesToCount;
                    //reset cycle counter
                    hundredCyclesCounter = 0;
    
                    console.log("*****HUNDRETH(100) CYCLE REPORT - START**************");
                    console.log("AVERAGE MAIN LOOP EXECUTION TIME:");
                    console.log(avrgMainLoopTime + " ms");
                    console.log("AVERAGE UPDATE LOOP EXECUTION TIME:");
                    console.log(avrgUpdateLoopTime + " ms");
                    console.log("AVERAGE DRAW LOOP EXECUTION TIME:");
                    console.log(avrgDrawLoopTime + " ms");
                    console.log("*****HUNDRETH(100) CYCLE REPORT - END**************");            
            }
                if(DebugLevel === 3) {
                    console.log("*****SINGLE CYCLE REPORT - START**************");
                    console.log("MAIN LOOP EXECUTION TIME:");
                    console.log(mainLoopTime + " ms");
                    console.log("UPDATE LOOP EXECUTION TIME:");
                    console.log(updateLoopTime + " ms");
                    console.log("DRAW LOOP EXECUTION TIME:");
                    console.log(drawLoopTime + " ms");
                    console.log("*****SINGLE CYCLE REPORT - END**************"); 
                }
            }
        } //end-if (isRunning)
        mainLoop();
    }, frameRate);
}

function calcStatistics() {
    //Reset the previous calculations
    totalFood = 0;
    averageFood = 0;
    //Calculate total
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) { 
            totalFood += SimGrid[i][j].foodValue;
        }
    }
    //Calculate average
    averageFood = Math.floor(totalFood / (gridRows * gridColumns));
    //Output to screen
    totalFoodOutput.innerHTML = totalFood;
    avrgFoodOutput.innerHTML = averageFood;
}

//Do things that should happen only once at the start of the game
function startGame() {
    //Create the Grid 
    SimGrid = new Array(gridRows);
    for (let i = 0; i < gridRows; i++) {
        SimGrid[i] = new Array(gridColumns);
    }
    //Insert 'block' objects into the grid
    //Each 'block' contains the basic info of each cell in the grid.
    let idCounter = 0;
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) { 
            SimGrid[i][j] = {
                id: idCounter,
                foodValue: randIntRange(0, 10),
                isFungus: false,
                isGrowthTip: false,
                gridLocation: [i, j],
                screenLocation: [j*gridBlockSize, i*gridBlockSize],
                color: "black"
            };
            idCounter += 1;
        }
    }
    //Calculate the total energy in the field and the average energy per pulser every 2 seconds
    statisticsTimer = setInterval(calcStatistics, 2000);
    //remove variables no longer needed
    idCounter = null;
}

//Clear the html canvas screen
function clearCanvas() {
    Canvas2D.fillStyle = "black";
    Canvas2D.clearRect(0, 0, ScreenWidth, ScreenHeight);
}

//Create the screen
function initScreen() {
    MainScreen = document.createElement("canvas");
    MainScreen.width = ScreenWidth;
    MainScreen.height = ScreenHeight;
    MainScreen.style.margin = "10px";
    MainScreen.style.border = "4px solid orange";
    MainScreen.style.backgroundColor = "black";
    Canvas2D = MainScreen.getContext("2d");
    document.body.insertBefore(MainScreen, document.body.childNodes[3]);
}

//Initialize and start program
function init() {
    initScreen();
    startGame();

    //Start the logger
    if (DebugMode === true) {
        debugClock = setInterval(function() {
            debugLog();
        }, 1000);
    }

    //Start the main loop
    isRunning = true;
    mainLoop();
}

function debugLog() {
    console.log("======DEBUG LOG - START===========");
    console.log("isRunning: " + isRunning);
    console.log("hundredCyclesCounter: " + hundredCyclesCounter);
    console.log("======DEBUG LOG - END===========");
}

//The first function executed by this program
init();


