require("dotenv").config();
const axios = require("axios");

const { App } = require("@slack/bolt")

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});


app.command("/playgame-ping", async ({ command, ack, respond }) => {
    //console.log(command)
    const start = Date.now()
    await ack();
    const latency = Date.now() - start;
    await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/playgame-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: `Available Commands:
    /playgame-ping - Check bot latency
    /playgame-battleship - Play battleship (singleplayer)`
  });
});

app.command("/playgame-battleship", async ({ command, ack, respond }) => {
  await ack();
  const userId = command.user_id;
  const input = command.text.trim();

  let game = getGame(userId);

  //no arguments (no move made or new game started)
  if (input === "") {

    //start game
    if (!game || game.status !== "in_progress") {
      game = createGame(userId);
      saveGame(game);
      return respond({ text: renderBoard(game) + "\nNew game started! Guess with /playgame-battleship [move] (Ex: b4)"});
    }
    return respond({ text: renderBoard(game) });
  }

  if (!game || game.status !== "in_progress") {
    return respond({ text: "No active game. Run `/playgame-battleship` with no arguments to start one.", });
  }

  const coord = getCoord(input, game.size);
  if (!coord) {
    const lett = String.fromCharCode(64+game.size);
    return respond({ text: `Invalid coordinate. Use a letter A-${lett} and number 1-${game.size}, e.g. \`c3\`.`});
  }
  const [r, c] = coord;
  let guessed = false;
  for (const hit of game.hits) {
    if (hit[0] === r && hit[1] === c) {
      guessed = true;
      break;
    }
  }

  if (!guessed) {
    for (const miss of game.misses) {
      if (miss[0] === r && miss[1] === c) {
        guessed = true;
        break;
      }
    }
  }

  if (guessed) {
    return respond({
      text: `Already guessed that cell.\n\n${renderBoard(game)}`,
    });
  }


  const wasHit = game.ships.some(ship => ship.cells.some(([sr,sc]) => sr===r && sc===c));
  if (wasHit) {
    game.hits.push([r, c]);
  } else {
    game.misses.push([r, c]);
  }

  const shipCellCount = game.ships.reduce((sum, s) => sum + s.cells.length, 0);
  if (game.hits.length === shipCellCount) {
    game.status = "won";
    game.finishedAt = Date.now();
    saveGame(game);
    const seconds = ((game.finishedAt - game.startedAt) / 1000.0).toFixed(1);
    return respond({ text: `${renderBoard(game)}\n *You won in ${seconds}s!*`})
  }

  saveGame(game);
  await respond({ text: `${wasHit ? "HIT!" : "miss."}\n\n${renderBoard(game)}`});
});

function getCoord(input,size) {
  const formatted = input.match(/^([a-zA-Z])(\d+)$/);
  if (!formatted) return null;

  const col = formatted[1].toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(formatted[2],10) - 1;

  if (col < 0 || col >= size || row < 0 || row >= size) return null;
  return [row, col];
}

function placeShips(size) {
  // Fleet scales a bit with board size; tweak as you like
  const fleet = size <= 6 ? [3, 2, 2] : [4, 3, 3, 2, 2];
  const ships = [];
  const occupied = new Set();

  for (const length of fleet) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      const cells = [];
      for (let i = 0; i < length; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (r >= size || c >= size) break;
        cells.push([r, c]);
      }

      if (cells.length !== length) continue; // ran off the board, retry

      const overlaps = cells.some(([r, c]) => occupied.has(`${r},${c}`));
      if (overlaps) continue;

      cells.forEach(([r, c]) => occupied.add(`${r},${c}`));
      ships.push({ cells });
      placed = true;
    }
  }

  return ships;
}

function renderBoard(game) {
  const letts = "ABCDEFGHIJ".slice(0,game.size);
  let out = "```\n     " + letts.split("").join(" ") + "\n";

  for (let r = 0; r < game.size; r++) {
    let row = String(r+1).padStart(2, " ") + "  ";
    for (let c = 0; c < game.size; c++) {
      const hit = game.hits.some(([hr,hc]) => hr===r && hc===c);
      const miss = game.misses.some(([mr,mc]) => mr===r && mc===c);
      if (hit) row += "🟥";
      else if (miss) row += "⏹️";
      else row += "🟦";
    }
    out += row + "\n";
  }
  return out + "```";
}

function createGame(userId, size=7) {
  const ships = placeShips(size);
  return {
    userId,
    size,
    ships,
    hits: [],
    misses: [],
    startedAt: Date.now(),
    finishedAt: null,
    status: "in_progress"
  };
}

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

function getGame(userId) {
  return loadAll()[userId] || null;
}

function saveGame(game) {
  const games = loadAll();
  games[game.userId] = game;
  saveAll(games);
}

function deleteGame(userId) {
  const games = loadAll();
  delete games[userId];
  saveAll(games);
}

(async () => {
    await app.start();
    console.log("PlayGame is running!");
})();