const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const { log } = require("console");
const app = express();

const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
let players = {};
let spectators = [];
let currentPlayer = "w";

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});
io.on("connection", function (uniquesocket) {
  console.log("connected");
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else{
    uniquesocket.emit("spectatorRole");
    spectators.push(uniquesocket.id);
  } 
  uniquesocket.on("disconnect", function () {
    if (players.white === uniquesocket.id) delete players.white;
    if (players.black === uniquesocket.id) delete players.black;

    spectators = spectators.filter((spectator) => spectator !== uniquesocket.id);

     if (!players.white && !players.black) {
      chess.reset(); // Reset the chess game
      currentPlayer = "w"; // Reset the current player to white
      console.log("Game reset: Both players disconnected.");
    }
  });
  uniquesocket.on("move", function(move){
    try {
        if(chess.turn()=="w" && uniquesocket.id!=players.white) return;
        if(chess.turn()=="b" && uniquesocket.id!=players.black) return;

        const result = chess.move(move);
        if(result){
            currentPlayer = chess.turn();
            io.emit("move", move);
            io.emit("boardState", chess.fen()); 
        }
        else{
            console.log("Invalid move:", move);
            uniquesocket.emit("Invalid Move",move);
        }
    } catch (err) {
        console.log(err);
        uniquesocket.emit("Invalid Move",move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
