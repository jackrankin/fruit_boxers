import Link from "next/link";
import { useState, useEffect } from "react";

export default function FruitBoxBoard({ params }) {
  const [board, setBoard] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [tempSelectedTiles, setTempSelectedTiles] = useState(new Set());
  const [ws, setWs] = useState(null);
  const [ready, setReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [awaitingRematch, setAwaitingRematch] = useState(false);
  const [rematchReady, setRematchReady] = useState(false);
  const [sentRematchRequest, setSentRematchRequest] = useState(false);

  const tileSize = 40;
  const rows = 10;
  const cols = 17;

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8080/ws/${params.gameId}`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "player_joined") {
        console.log("A player joined the game");
      } else if (data.type === "ready") {
        setReady(true);
      } else if (data.type === "board") {
        setBoard(data.board);
        setGameStarted(true);
        params.setStarted(true);
      } else if (data.type === "score") {
        setMyScore(data.your_score);
        setOppScore(data.opp_score);
      } else if (data.type === "end") {
        setGameOver(true);
        setTimer(0);
      } else if (data.type === "rematch") {
        if (data.possible === "ready") {
          setRematchReady(true);
        } else if (data.possible == "waiting") {
          setAwaitingRematch(true);
        }
      } else if (data.type === "new_game") {
        setGameOver(false);
        setAwaitingRematch(false);
        setRematchReady(false);
        setSentRematchRequest(false);
        setTimer(60);
        setBoard(data.board);
        setMyScore(0);
        setOppScore(0);
      } else if (data.type === "opponent_left") {
        if (!gameStarted) setReady(false);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer === 1) {
            clearInterval(interval);
            setGameOver(true);
            sendMessage({ type: "end" });
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver]);

  const sendMessage = (data) => {
    if (ws) ws.send(JSON.stringify(data));
  };

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    setSelectedTiles(new Set());
    setTempSelectedTiles(new Set());
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const minX = Math.min(startPos.x, currentPos.x) + rect.left;
    const maxX = Math.max(startPos.x, currentPos.x) + rect.left;
    const minY = Math.min(startPos.y, currentPos.y) + rect.top;
    const maxY = Math.max(startPos.y, currentPos.y) + rect.top;

    const newTempSelectedTiles = new Set();
    document.querySelectorAll(".tile").forEach((tile) => {
      const rect = tile.getBoundingClientRect();
      if (
        rect.left + rect.width * 0.5 >= minX &&
        rect.right - rect.width * 0.5 <= maxX &&
        rect.top + rect.height * 0.5 >= minY &&
        rect.bottom - rect.height * 0.5 <= maxY
      ) {
        newTempSelectedTiles.add(tile.dataset.index);
      }
    });

    setTempSelectedTiles(newTempSelectedTiles);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!startPos || !currentPos) return;

    let s = 0;
    for (let idx of tempSelectedTiles) {
      let [row, col] = idx.split("-").map(Number);
      s += board[row][col];
    }

    if (s == 10) {
      tempSelectedTiles.forEach((index) => {
        let [row, col] = index.split("-").map(Number);
        board[row][col] = 0;
      });

      setBoard(board);
      sendMessage({ type: "board", board: board });
    }

    setSelectedTiles(new Set());
    setTempSelectedTiles(new Set());
  };

  const onStartClick = () => {
    sendMessage({ type: "setup" });
  };

  const onRematchClick = () => {
    console.log("rematch requested");
    setSentRematchRequest(true);
    sendMessage({ type: "rematch" });
  };

  const onRematchStart = () => {
    sendMessage({ type: "new_game" });
  };

  const winner =
    myScore > oppScore ? "YOU" : myScore === oppScore ? "TIE" : "THEY";

  return (
    <div className="">
      {!gameStarted && (
        <div>
          {ready ? (
            <button
              onClick={onStartClick}
              className="mx-3 p-4 bg-green-300 text-black text-xl font-bold rounded-lg shadow-lg hover:bg-green-200 hover:scale-110 transition"
            >
              START
            </button>
          ) : (
            <button className="mx-3 p-3 bg-gray-400 text-black text-md font-bold rounded-lg shadow-lg">
              waiting for opponent
            </button>
          )}
        </div>
      )}
      {gameStarted && (
        <div
          className="relative select-none bg-white p-8 rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="flex flex-row justify-between mb-8">
            <div className="flex flex-row">
              <div className="text-2xl font-semibold">{"YOU: " + myScore}</div>
            </div>
            <div className="flex justify-center text-xl font-semibold">
              Time Left: {timer}s
            </div>
            <div className="flex flex-row">
              <div className="text-2xl font-semibold">
                {"THEM: " + oppScore}
              </div>
            </div>
          </div>
          <div
            className="grid gap-x-1 gap-y-2 relative p-16 bg-green-100 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((num, colIndex) => {
                const index = `${rowIndex}-${colIndex}`;
                return (
                  <img
                    key={index}
                    data-index={index}
                    className={`tile w-[${tileSize}px] h-[${tileSize}px] ${
                      (selectedTiles.has(index) ||
                        tempSelectedTiles.has(index)) &&
                      num
                        ? "bg-green-500 rounded-lg"
                        : ""
                    }`}
                    src={num ? `/capple${num}.png` : `/empty.png`}
                    alt={`${num}`}
                    draggable="false"
                  />
                );
              })
            )}
          </div>

          {isDragging && startPos && currentPos && (
            <div
              className="absolute bg-red-500/20 border-2 border-red-500 pointer-events-none"
              style={{
                left: Math.min(startPos.x, currentPos.x),
                top: Math.min(startPos.y, currentPos.y),
                width: Math.abs(currentPos.x - startPos.x),
                height: Math.abs(currentPos.y - startPos.y),
              }}
            />
          )}
        </div>
      )}
      {gameOver && (
        <div>
          <div className="fixed top-0 left-0 w-full h-full bg-black/80 flex flex-col justify-center items-center text-4xl font-semibold text-white">
            {winner === "YOU"
              ? "YOU WON! 🎱"
              : winner === "TIE"
              ? "you tied 🎀"
              : "they won...🚮"}
            {!awaitingRematch && !rematchReady && !sentRematchRequest ? (
              <button
                onClick={onRematchClick}
                className="m-6 px-6 py-4 bg-white text-black text-xl font-bold rounded-lg shadow-lg hover:bg-gray-200 hover:scale-110 transition"
              >
                REMATCH 🤺
              </button>
            ) : sentRematchRequest && !rematchReady && !awaitingRematch ? (
              <button className="m-6 px-6 py-4 bg-white text-black text-xl font-bold rounded-lg shadow-lg hover:bg-gray-200 hover:scale-110 transition">
                WAITING FOR OPP...
              </button>
            ) : awaitingRematch && !rematchReady && !sentRematchRequest ? (
              <button
                onClick={onRematchClick}
                className="m-6 px-6 py-4 bg-green-300 text-black text-xl font-bold rounded-lg shadow-lg hover:bg-green-200 hover:scale-110 transition"
              >
                ACCEPT REMATCH
              </button>
            ) : (
              <button
                onClick={onRematchStart}
                className="m-6 px-6 py-4 bg-blue-300 text-black text-xl font-bold rounded-lg shadow-lg hover:bg-blue-200 hover:scale-110 transition"
              >
                🏁 START 🏁
              </button>
            )}

            <Link
              href="/"
              className="mt-1 px-6 py-3 bg-gray-800 text-white text-xl font-bold rounded-lg shadow-lg hover:bg-gray-700 hover:scale-95 transition"
            >
              go home 🍗
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
