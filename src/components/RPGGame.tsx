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
type GameState = 'world' | 'combat' | 'shop' | 'inn';

interface Character {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  gold: number;
}

const RPGGame: React.FC = () => {
  const [playerPos, setPlayerPos] = useState<Position>(INITIAL_PLAYER_POS);
  const [gameState, setGameState] = useState<GameState>('world');
  const [player, setPlayer] = useState<Character>({ name: 'Hero', hp: 100, maxHp: 100, attack: 20, gold: 0 });
  const [enemy, setEnemy] = useState<Character>({ name: 'Goblin', hp: 50, maxHp: 50, attack: 15, gold: 10 });
  const [enemyPos, setEnemyPos] = useState<Position | null>(null);
  const [message, setMessage] = useState<string>('Welcome to the RPG world!');

  // Generate a simple map with some enemies, shop, and inn
  const generateMap = useCallback(() => {
    const map: string[][] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        map[y][x] = 'grass';
      }
    }
    // Add shop at top-left
    map[0][0] = 'shop';
    // Add inn at bottom-right
    map[MAP_SIZE - 1][MAP_SIZE - 1] = 'inn';
    // Add some enemies
    const enemyPositions = [
      { x: 2, y: 2 },
      { x: 7, y: 3 },
      { x: 4, y: 7 },
      { x: 8, y: 8 }
    ];
    enemyPositions.forEach(pos => {
      map[pos.y][pos.x] = 'enemy';
    });
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
        setEnemyPos({ x: newX, y: newY });
        setEnemy({ name: 'Goblin', hp: 50, maxHp: 50, attack: 15, gold: 10 });
        setMessage('You encountered a Goblin! Combat begins!');
      } else if (tile === 'shop') {
        setGameState('shop');
        setMessage('Welcome to the shop!');
      } else if (tile === 'inn') {
        setGameState('inn');
        setMessage('Welcome to the inn!');
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
        setMessage(`You defeated the ${currentEnemy.name}! Gained ${currentEnemy.gold} gold.`);
        setPlayer(currentPlayer => ({ ...currentPlayer, gold: currentPlayer.gold + currentEnemy.gold }));
        setGameState('world');
        // Remove enemy from map
        setMap(currentMap => {
          const newMap = [...currentMap];
          if (enemyPos) {
            newMap[enemyPos.y][enemyPos.x] = 'grass';
          }
          return newMap;
        });
        // Respawn enemy after 5 seconds
        setTimeout(() => {
          setMap(currentMap => {
            const newMap = [...currentMap];
            if (enemyPos) {
              newMap[enemyPos.y][enemyPos.x] = 'enemy';
            }
            return newMap;
          });
        }, 5000);
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
              setPlayer({ name: 'Hero', hp: 100, maxHp: 100, attack: 20, gold: 0 });
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
          setPlayer({ name: 'Hero', hp: 100, maxHp: 100, attack: 20, gold: 0 });
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
          <p className="text-lg font-semibold">Gold: {player.gold}</p>
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
                } else if (tile === 'shop') {
                  cellClass += ' bg-yellow-400';
                } else if (tile === 'inn') {
                  cellClass += ' bg-purple-400';
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

        {gameState === 'shop' && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-xl font-bold">Shop</p>
            <Button onClick={() => {
              if (player.gold >= 10) {
                setPlayer(current => ({ ...current, hp: Math.min(current.maxHp, current.hp + 50), gold: current.gold - 10 }));
                setMessage('Bought potion! Healed 50 HP.');
              } else {
                setMessage('Not enough gold!');
              }
            }}>Buy Potion (10 gold) - Heal 50 HP</Button>
            <Button onClick={() => {
              if (player.gold >= 50) {
                setPlayer(current => ({ ...current, attack: current.attack + 5, gold: current.gold - 50 }));
                setMessage('Bought sword! Attack +5.');
              } else {
                setMessage('Not enough gold!');
              }
            }}>Buy Sword (50 gold) - +5 Attack</Button>
            <Button onClick={() => setGameState('world')}>Leave Shop</Button>
          </div>
        )}

        {gameState === 'inn' && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-xl font-bold">Inn</p>
            <Button onClick={() => {
              if (player.gold >= 20) {
                setPlayer(current => ({ ...current, hp: current.maxHp, gold: current.gold - 20 }));
                setMessage('Rested! Fully healed.');
              } else {
                setMessage('Not enough gold!');
              }
            }}>Rest (20 gold) - Full Heal</Button>
            <Button onClick={() => setGameState('world')}>Leave Inn</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RPGGame;
