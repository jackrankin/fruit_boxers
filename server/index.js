import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { parse } from "url";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const games = new Map();

const PORT = 8080;

const rows = 10;
const cols = 17;

const createBoard = () =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * 9) + 1)
  );

const calculateScore = (previous, current) =>
  previous.reduce(
    (score, row, i) =>
      score +
      row.reduce(
        (rowScore, cell, j) => rowScore + (cell !== current[i][j] ? 1 : 0),
        0
      ),
    0
  );

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

wss.on("connection", (ws, req) => {
  const { pathname } = parse(req.url, true);
  const gameId = pathname.split("/")[2];

  if (!gameId) {
    ws.close();
    return;
  }

  let game = games.get(gameId);
  if (!game) {
    game = {
      target: 10,
      gameMode: "default",
      players: [],
      board: null,
      scores: [0, 0],
      rematch: [0, 0],
    };
    games.set(gameId, game);
  }

  if (game.players.length >= 2) {
    ws.close();
    return;
  }

  game.players.push(ws);
  console.log(`Player joined game (PC: ${game.players.length})`, gameId);
  ws.send(JSON.stringify({ type: "player_joined", gameId }));

  if (game.players.length === 2) {
    game.players.forEach((player) =>
      player.send(JSON.stringify({ type: "ready" }))
    );
  }

  ws.on("message", (message) => {
    const data = JSON.parse(message.toString());

    if (data.type === "setup" && !game.board && game.players.length === 2) {
      game.board = createBoard();
      game.players.forEach((player) =>
        player.send(JSON.stringify({ type: "board", board: game.board }))
      );
    } else if (data.type === "board") {
      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i] !== ws) continue;
        game.scores[i] += calculateScore(game.board, data.board);
      }

      for (let i = 0; i < game.players.length; i++) {
        game.players[i].send(
          JSON.stringify({
            type: "score",
            your_score: game.scores[i],
            opp_score: game.scores[(i + 1) % 2],
          })
        );
      }

      game.board = data.board;
      game.players.forEach((player) =>
        player.send(JSON.stringify({ type: "board", board: game.board }))
      );
    } else if (data.type === "end") {
      game.players.forEach((player) =>
        player.send(JSON.stringify({ type: "end" }))
      );
    } else if (data.type === "rematch") {
      console.log("rematch request", gameId);
      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i] !== ws) continue;
        game.rematch[i] ^= 1;
      }

      if (game.rematch.every(Boolean)) {
        game.players.forEach((player) =>
          player.send(JSON.stringify({ type: "rematch", possible: "ready" }))
        );
      } else {
        for (let i = 0; i < game.players.length; i++) {
          if (game.players[i] === ws) continue;
          game.players[i].send(
            JSON.stringify({ type: "rematch", possible: "waiting" })
          );
        }
      }
    } else if (data.type === "new_game") {
      game.board = createBoard();
      game.players.forEach((player) =>
        player.send(JSON.stringify({ type: "new_game", board: game.board }))
      );
      game.scores = [0, 0];
    }
  });

  ws.on("close", () => {
    game.players = game.players.filter((player) => player !== ws);
    game.scores = [0, 0];
    game.rematch = [0, 0];

    console.log(`Player left game (PC: ${game.players.length})`, gameId);

    if (game.players.length === 1) {
      game.players[0].send(JSON.stringify({ type: "opponent_left" }));
    }

    if (game.players.length === 0) {
      games.delete(gameId);
      console.log("Ending game:", gameId);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
