import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';

declare global {
  interface Window {
    Unity?: {
      call: (msg: string) => void;
    };
  }
}

const MAP_SIZE = 10;
const INITIAL_PLAYER_POS = { x: 5, y: 5 };

type Position = { x: number; y: number };
type GameState = 'world' | 'combat';

interface Character {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
}

const RPGGame: React.FC = () => {
  const [playerPos, setPlayerPos] = useState<Position>(INITIAL_PLAYER_POS);
  const [gameState, setGameState] = useState<GameState>('world');
  const [player, setPlayer] = useState<Character>({ name: 'Hero', hp: 100, maxHp: 100, attack: 20 });
  const [enemy, setEnemy] = useState<Character>({ name: 'Goblin', hp: 50, maxHp: 50, attack: 15 });
  const [message, setMessage] = useState<string>('Welcome to the RPG world!');

  // Generate a simple map with some enemies
  const generateMap = useCallback(() => {
    const map: string[][] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        if (Math.random() < 0.1) {
          map[y][x] = 'enemy';
        } else {
          map[y][x] = 'grass';
        }
      }
    }
    return map;
  }, []);

  const [map, setMap] = useState<string[][]>(generateMap);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'world') return;

    setPlayerPos(currentPos => {
      const newX = Math.max(0, Math.min(MAP_SIZE - 1, currentPos.x + dx));
      const newY = Math.max(0, Math.min(MAP_SIZE - 1, currentPos.y + dy));

      if (newX === currentPos.x && newY === currentPos.y) return currentPos;

      const tile = map[newY][newX];
      if (tile === 'enemy') {
        setGameState('combat');
        setEnemy({ name: 'Goblin', hp: 50, maxHp: 50, attack: 15 });
        setMessage('You encountered a Goblin! Combat begins!');
      } else {
        setMessage('You move through the world.');
      }

      return { x: newX, y: newY };
    });
  }, [gameState, map]);

  const attack = useCallback(() => {
    if (gameState !== 'combat') return;

    // Player attacks enemy
    const damage = Math.floor(Math.random() * player.attack) + 10;
    setEnemy(currentEnemy => {
      const newHp = Math.max(0, currentEnemy.hp - damage);
      if (newHp === 0) {
        setMessage(`You defeated the ${currentEnemy.name}!`);
        setGameState('world');
        // Remove enemy from map
        setMap(currentMap => {
          const newMap = [...currentMap];
          newMap[playerPos.y][playerPos.x] = 'grass';
          return newMap;
        });
      } else {
        setMessage(`You attack for ${damage} damage!`);
        // Enemy turn
        setTimeout(() => {
          const enemyDamage = Math.floor(Math.random() * currentEnemy.attack) + 5;
          setPlayer(currentPlayer => {
            const newPlayerHp = Math.max(0, currentPlayer.hp - enemyDamage);
            if (newPlayerHp === 0) {
              setMessage('You were defeated! Game Over.');
              setGameState('world');
              // Reset player
              setPlayer({ name: 'Hero', hp: 100, maxHp: 100, attack: 20 });
              setPlayerPos(INITIAL_PLAYER_POS);
            } else {
              setMessage(`${currentEnemy.name} attacks for ${enemyDamage} damage!`);
            }
            return { ...currentPlayer, hp: newPlayerHp };
          });
        }, 1000);
      }
      return { ...currentEnemy, hp: newHp };
    });
  }, [gameState, player, playerPos]);

  const defend = useCallback(() => {
    if (gameState !== 'combat') return;

    setMessage('You defend! Damage reduced.');
    // Enemy turn with reduced damage
    setTimeout(() => {
      const enemyDamage = Math.floor((Math.random() * enemy.attack + 5) * 0.5);
      setPlayer(currentPlayer => {
        const newHp = Math.max(0, currentPlayer.hp - enemyDamage);
        if (newHp === 0) {
          setMessage('You were defeated! Game Over.');
          setGameState('world');
          setPlayer({ name: 'Hero', hp: 100, maxHp: 100, attack: 20 });
          setPlayerPos(INITIAL_PLAYER_POS);
        } else {
          setMessage(`${enemy.name} attacks for ${enemyDamage} damage!`);
        }
        return { ...currentPlayer, hp: newHp };
      });
    }, 1000);
  }, [gameState, enemy]);

  const flee = useCallback(() => {
    if (gameState !== 'combat') return;

    setGameState('world');
    setMessage('You fled from combat!');
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'world') {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            movePlayer(0, -1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            movePlayer(0, 1);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            movePlayer(-1, 0);
            break;
          case 'ArrowRight':
            e.preventDefault();
            movePlayer(1, 0);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-xl font-semibold text-gray-800 mb-4">RPG Game</h2>
      <div className="flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="text-lg font-semibold">Player HP: {player.hp}/{player.maxHp}</p>
          {gameState === 'combat' && (
            <p className="text-lg font-semibold">Enemy HP: {enemy.hp}/{enemy.maxHp}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        </div>

        {gameState === 'world' && (
          <>
            <div
              className="grid gap-1 border-2 border-gray-300 p-2 bg-green-100"
              style={{ gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`, width: '400px', height: '400px' }}
            >
              {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, index) => {
                const x = index % MAP_SIZE;
                const y = Math.floor(index / MAP_SIZE);
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const tile = map[y][x];

                let cellClass = 'w-8 h-8 border border-gray-200';
                if (isPlayer) {
                  cellClass += ' bg-blue-500';
                } else if (tile === 'enemy') {
                  cellClass += ' bg-red-400';
                } else {
                  cellClass += ' bg-green-300';
                }

                return <div key={index} className={cellClass}></div>;
              })}
            </div>
            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="flex space-x-2">
                <Button onClick={() => movePlayer(0, -1)}>↑</Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => movePlayer(-1, 0)}>←</Button>
                <Button onClick={() => movePlayer(1, 0)}>→</Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => movePlayer(0, 1)}>↓</Button>
              </div>
            </div>
          </>
        )}

        {gameState === 'combat' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <p className="text-xl font-bold">{player.name} vs {enemy.name}</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={attack} variant="destructive">Attack</Button>
              <Button onClick={defend} variant="outline">Defend</Button>
              <Button onClick={flee} variant="secondary">Flee</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RPGGame;
