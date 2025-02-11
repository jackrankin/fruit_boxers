"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const cols = 60;
  const rows = 11;
  const tileSize = 45;

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [tempSelectedTiles, setTempSelectedTiles] = useState(new Set());
  const [board, setBoard] = useState(() => {
    const initialBoard = new Array(rows);
    for (let i = 0; i < rows; i++) {
      initialBoard[i] = new Array(cols).fill(0);
    }
    return initialBoard;
  });
  const [gameId, setGameId] = useState("");

  useEffect(() => {
    const filledBoard = board.map((row) =>
      row.map(() => (Math.random() > 0.7 ? (Math.random() * 9 + 1) | 0 : 0))
    );
    setBoard(filledBoard);
  }, []);

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
    }

    setSelectedTiles(new Set());
    setTempSelectedTiles(new Set());
  };

  return (
    <div className="font-mono flex items-center justify-center min-h-screen">
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="absolute inset-0 grid gap-1 bg-green-100 rounded-lg select-none overflow-hidden "
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
        }}
      >
        {board
          ? board.map((row, rowIndex) =>
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
            )
          : null}
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

      <div className="relative bg-gray-100 z-10 px-8 py-6 flex flex-col items-center rounded-lg shadow-lg">
        <header className="text-4xl p-6 text-red-500">🍎 fruitboxers 🍏</header>
        <button
          onClick={() => {
            const gameId = crypto.randomUUID().substring(0, 5);
            window.location.href = `/game/${gameId}`;
          }}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 hover:scale-105 transition"
        >
          challenge someone
        </button>
        <p className="pt-4">or</p>
        <input
          type="text"
          placeholder="Enter game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && gameId.trim()) {
              window.location.href = `/game/${gameId.trim()}`;
            }
          }}
          className="mt-4 p-2 border rounded-lg text-center"
        />
        <p className="pt-4 text-xs">
          try tracing boxes over apples in the bg that sum to 10!
        </p>
      </div>
    </div>
  );
}
