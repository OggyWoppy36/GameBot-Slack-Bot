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

/**
 * 
 * @param {String} gameType name of the game you want to retrieve
 * @param {String} userId the user who typed the command
 * @returns {JSON}  ```game``` JSON object with any required saved elements
 */
function getGame(gameType, userId) {
  const games = loadAll();
  return games[gameType]?.[userId] || null;
}

/**
 * 
 * @param {String} gameType name of the game you want to save
 * @param {JSON} game JSON object with any required saved elements
 */
function saveGame(gameType, game) {
  const games = loadAll();
  if (!games[gameType]) games[gameType] = {};
  games[gameType][game.userId] = game;
  saveAll(games);
}


/**
 * 
 * @param {String} gameType name of the game you want to delete
 * @param {String} userId the user whose game should be deleted
 */
function deleteGame(gameType, userId) {
  const games = loadAll();
  if (games[gameType]) delete games[gameType][userId];
  saveAll(games);
}

module.exports = { getGame, saveGame, deleteGame };