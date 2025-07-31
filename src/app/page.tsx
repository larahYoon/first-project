'use client';

import TetrisGame from '../components/TetrisGame';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
          🎮 TETRIS
        </h1>
        <p className="text-xl text-gray-300 mb-8">Classic Tetris Game</p>
        <TetrisGame />
      </div>
    </div>
  );
}
