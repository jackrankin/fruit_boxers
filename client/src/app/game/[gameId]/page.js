"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FruitBoxBoard from "../../components/FruitBoxBoard";

export default function GamePage({ params }) {
  const { gameId } = useParams();
  const [gameUrl, setGameUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [started, setStarted] = useState(false);
  const [board, setBoard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [tempSelectedTiles, setTempSelectedTiles] = useState(new Set());

  const cols = 70;
  const rows = 15;
  const tileSize = 50;

  useEffect(() => {
    if (gameId) {
      setGameUrl(`${window.location.origin}/game/${gameId}`);
    }
  }, [gameId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  useEffect(() => {
    const newBoard = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () =>
        Math.random() > 0.7 ? Math.floor(Math.random() * 9) + 1 : 0
      )
    );
    setBoard(newBoard);
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
    <div className="w-full h-full bg-gray-100">
      {!started && (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="overflow-hidden absolute inset-0 grid gap-1 bg-green-100 rounded-lg select-none"
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
      )}

      <div className="font-mono flex items-center justify-center min-h-screen">
        <div className="rounded-xl p-8 flex flex-col gap-4 items-center">
          {!started && (
            <div
              onClick={copyToClipboard}
              className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-md relative"
            >
              <span className="cursor-pointer text-gray-800 text-sm">
                {gameUrl}
              </span>
              <button
                onClick={copyToClipboard}
                className="bg-blue-500 text-white p-1 rounded-md text-sm hover:bg-blue-600 flex items-center space-x-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>

              {isCopied && (
                <div className="absolute -top-8 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-lg shadow-md animate-fade-in">
                  Copied!
                  <div className="absolute w-2 h-2 bg-blue-500 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <FruitBoxBoard params={{ gameId, setStarted }} />
          </div>
        </div>
      </div>
    </div>
  );
}
