'use client';

import React, { useState, useEffect, useCallback } from 'react';

// 테트리스 보드 크기
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// 테트로미노 모양 정의
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'bg-cyan-400'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-400'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-purple-400'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'bg-green-400'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-red-400'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-blue-400'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-orange-400'
  }
};

type TetrominoType = keyof typeof TETROMINOES;
type Board = (string | null)[][];

// 빈 보드 생성
const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

// 랜덤 테트로미노 생성
const getRandomTetromino = (): TetrominoType => {
  const types = Object.keys(TETROMINOES) as TetrominoType[];
  return types[Math.floor(Math.random() * types.length)];
};

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 현재 떨어지는 블록
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    shape: number[][];
    position: { x: number; y: number };
    color: string;
  } | null>(null);

  // 다음 블록
  const [nextPiece, setNextPiece] = useState<TetrominoType>(getRandomTetromino());

  // 충돌 검사
  const checkCollision = useCallback((shape: number[][], position: { x: number; y: number }, testBoard?: Board) => {
    const currentBoard = testBoard || board;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          // 경계 체크
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          // 다른 블록과의 충돌 체크
          if (newY >= 0 && currentBoard[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  // 라인 클리어
  const clearLines = useCallback((boardToCheck: Board) => {
    const newBoard = [...boardToCheck];
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++; // 같은 줄 다시 체크
      }
    }
    
    if (linesCleared > 0) {
      setBoard(newBoard);
      setLines(prev => prev + linesCleared);
      
      // 점수 계산 (1줄: 100, 2줄: 300, 3줄: 500, 4줄: 800)
      const lineScores = [0, 100, 300, 500, 800];
      const points = lineScores[linesCleared] * level;
      setScore(prev => prev + points);
      
      // 레벨 업 (10줄마다)
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);
    }
  }, [level, lines]);

  // 블록을 보드에 배치
  const placePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });
    
    setCurrentPiece(null);
    
    // 라인 클리어 체크
    clearLines(newBoard);
  }, [currentPiece, board, clearLines]);

  // 블록 회전
  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const rotated = currentPiece.shape[0].map((_, colIndex) =>
      currentPiece.shape.map(row => row[colIndex]).reverse()
    );
    
    if (!checkCollision(rotated, currentPiece.position)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated } : null);
    }
  }, [currentPiece, checkCollision]);

  // 블록 이동
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece) return false;
    
    const newPosition = {
      x: currentPiece.position.x + dx,
      y: currentPiece.position.y + dy
    };
    
    if (!checkCollision(currentPiece.shape, newPosition)) {
      setCurrentPiece(prev => prev ? { ...prev, position: newPosition } : null);
      return true;
    }
    
    // 아래로 이동할 수 없으면 블록 배치
    if (dy > 0) {
      placePiece();
    }
    
    return false;
  }, [currentPiece, checkCollision, placePiece]);

  // 하드 드롭
  const hardDrop = useCallback(() => {
    if (!currentPiece) return;
    
    let newY = currentPiece.position.y;
    while (!checkCollision(currentPiece.shape, { ...currentPiece.position, y: newY + 1 })) {
      newY++;
    }
    
    setCurrentPiece(prev => prev ? { ...prev, position: { ...prev.position, y: newY } } : null);
    placePiece();
  }, [currentPiece, checkCollision, placePiece]);

  // 새로운 블록 생성
  const createNewPiece = useCallback(() => {
    const type = nextPiece;
    const tetromino = TETROMINOES[type];
    const newPiece = {
      type,
      shape: tetromino.shape,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
      color: tetromino.color
    };
    
    // 게임 오버 체크
    if (checkCollision(newPiece.shape, newPiece.position)) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }
    
    setCurrentPiece(newPiece);
    setNextPiece(getRandomTetromino());
  }, [nextPiece, checkCollision]);

  // 게임 시작
  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    createNewPiece();
  };

  // 게임 일시정지/재개
  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPlaying || gameOver || isPaused) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          rotatePiece();
          break;
        case ' ':
          event.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, isPaused, movePiece, rotatePiece, hardDrop]);

  // 자동 낙하
  useEffect(() => {
    if (!isPlaying || gameOver || isPaused || !currentPiece) return;

    const dropSpeed = Math.max(100, 1000 - (level - 1) * 100); // 레벨이 높을수록 빠르게
    const dropInterval = setInterval(() => {
      movePiece(0, 1);
    }, dropSpeed);

    return () => clearInterval(dropInterval);
  }, [isPlaying, gameOver, isPaused, currentPiece, level, movePiece]);

  // 게임 시작할 때 첫 번째 블록 생성
  useEffect(() => {
    if (isPlaying && !currentPiece && !gameOver) {
      createNewPiece();
    }
  }, [isPlaying, currentPiece, gameOver, createNewPiece]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 게임 보드와 사이드 패널 */}
      <div className="flex space-x-8">
        {/* 게임 보드 */}
        <div className="relative">
          <div className="grid grid-cols-10 gap-px bg-gray-800 p-2 border-4 border-gray-600 rounded-lg">
            {board.map((row, y) =>
              row.map((cell, x) => {
                // 현재 떨어지는 블록 표시
                let displayColor = cell || 'bg-gray-900';
                
                if (currentPiece) {
                  const pieceX = x - currentPiece.position.x;
                  const pieceY = y - currentPiece.position.y;
                  
                  if (
                    pieceY >= 0 &&
                    pieceY < currentPiece.shape.length &&
                    pieceX >= 0 &&
                    pieceX < currentPiece.shape[pieceY].length &&
                    currentPiece.shape[pieceY][pieceX]
                  ) {
                    displayColor = currentPiece.color;
                  }
                }
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-6 h-6 border border-gray-700 ${displayColor}`}
                  />
                );
              })
            )}
          </div>
          
          {/* 게임 오버 오버레이 */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">GAME OVER</h2>
                <p className="text-xl mb-4">Final Score: {score}</p>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* 일시정지 오버레이 */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold">PAUSED</h2>
                <p className="text-lg mt-2">Press P to resume</p>
              </div>
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 점수 표시 */}
          <div className="bg-gray-800 p-4 rounded-lg text-white min-w-[150px]">
            <h3 className="text-lg font-bold mb-2">Score</h3>
            <p className="text-2xl font-mono">{score.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg text-white">
            <h3 className="text-lg font-bold mb-2">Level</h3>
            <p className="text-2xl font-mono">{level}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg text-white">
            <h3 className="text-lg font-bold mb-2">Lines</h3>
            <p className="text-2xl font-mono">{lines}</p>
          </div>

          {/* 다음 블록 미리보기 */}
          {nextPiece && (
            <div className="bg-gray-800 p-4 rounded-lg text-white">
              <h3 className="text-lg font-bold mb-2">Next</h3>
              <div className="grid gap-px p-2 bg-gray-900 rounded">
                {TETROMINOES[nextPiece].shape.map((row, y) => (
                  <div key={y} className="flex gap-px">
                    {row.map((cell, x) => (
                      <div
                        key={x}
                        className={`w-4 h-4 ${
                          cell ? TETROMINOES[nextPiece].color : 'bg-gray-900'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex space-x-4">
        {!isPlaying ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg"
          >
            Start Game
          </button>
        ) : (
          <button
            onClick={togglePause}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-lg"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>

      {/* 조작법 안내 */}
      <div className="bg-gray-800 p-4 rounded-lg text-white text-sm max-w-md">
        <h3 className="font-bold mb-2">Controls:</h3>
        <div className="grid grid-cols-2 gap-2">
          <span>← → : Move</span>
          <span>↑ : Rotate</span>
          <span>↓ : Soft Drop</span>
          <span>Space : Hard Drop</span>
          <span>P : Pause</span>
        </div>
      </div>
    </div>
  );
}