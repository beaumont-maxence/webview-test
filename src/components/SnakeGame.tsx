import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';

declare global {
  interface Window {
    Unity?: {
      call: (msg: string) => void;
    };
  }
}

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 200;

type Position = { x: number; y: number };

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateFood = useCallback(() => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const checkCollision = useCallback((head: Position, snakeBody: Position[]) => {
    // Self collision (no wall collision in toric world)
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      // Wrap around for toric world
      if (head.x < 0) head.x = BOARD_SIZE - 1;
      if (head.x >= BOARD_SIZE) head.x = 0;
      if (head.y < 0) head.y = BOARD_SIZE - 1;
      if (head.y >= BOARD_SIZE) head.y = 0;

      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        setIsPlaying(false);
        // Send score to Unity
        const message = JSON.stringify({ event: 'snake_game_over', data: { score } });
        if (window.Unity && window.Unity.call) {
          window.Unity.call(message);
        } else {
          console.log('Unity not available, message:', message);
        }
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPlaying, score, checkCollision, generateFood]);

  const changeDirection = useCallback((newDirection: Position) => {
    setDirection(currentDirection => {
      // Prevent reversing into self
      if (
        (currentDirection.x === 0 && newDirection.x === 0) ||
        (currentDirection.y === 0 && newDirection.y === 0) ||
        (currentDirection.x + newDirection.x === 0 && currentDirection.y + newDirection.y === 0)
      ) {
        return currentDirection;
      }
      return newDirection;
    });
  }, []);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
  };

  const stopGame = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      let newDir: Position | null = null;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          e.preventDefault();
          newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          e.preventDefault();
          newDir = { x: 1, y: 0 };
          break;
      }
      if (newDir) {
        changeDirection(newDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, changeDirection]);

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-xl font-semibold text-gray-800 mb-4">Snake Game</h2>
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <p className="text-lg font-semibold">Score: {score}</p>
          {gameOver && <p className="text-red-500">Game Over!</p>}
        </div>
        <div
          className="grid gap-1 border-2 border-gray-300 p-2 bg-black"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, width: '576px', height: '576px' }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const x = index % BOARD_SIZE;
            const y = Math.floor(index / BOARD_SIZE);
            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
            const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            let cellClass = 'w-6 h-6';
            if (isSnakeHead) {
              cellClass += ' bg-green-600';
            } else if (isSnakeBody) {
              cellClass += ' bg-green-400';
            } else if (isFood) {
              cellClass += ' bg-red-500';
            } else {
              cellClass += ' bg-gray-800';
            }

            return <div key={index} className={cellClass}></div>;
          })}
        </div>
        <div className="mt-4 flex flex-col items-center space-y-2">
          <div className="flex space-x-2">
            <Button onClick={() => changeDirection({ x: 0, y: -1 })} disabled={!isPlaying || gameOver}>
              ↑
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => changeDirection({ x: -1, y: 0 })} disabled={!isPlaying || gameOver}>
              ←
            </Button>
            <Button onClick={() => changeDirection({ x: 1, y: 0 })} disabled={!isPlaying || gameOver}>
              →
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => changeDirection({ x: 0, y: 1 })} disabled={!isPlaying || gameOver}>
              ↓
            </Button>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={startGame} variant="default">
              Start Game
            </Button>
            <Button onClick={stopGame} variant="outline" disabled={!isPlaying}>
              Stop Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
