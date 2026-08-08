const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "games.json");

function loadAll() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveAll(games) {
  fs.writeFileSync(FILE, JSON.stringify(games, null, 2));
}

function getGame(gameType, userId) {
  const games = loadAll();
  return games[gameType]?.[userId] || null;
}

function saveGame(gameType, game) {
  const games = loadAll();
  if (!games[gameType]) games[gameType] = {};
  games[gameType][game.userId] = game;
  saveAll(games);
}

function deleteGame(gameType, userId) {
  const games = loadAll();
  if (games[gameType]) delete games[gameType][userId];
  saveAll(games);
}

module.exports = { getGame, saveGame, deleteGame };