require("dotenv").config();
const axios = require("axios");
const brawlToken = process.env.BRAWL_API_JWT;

const { App } = require("@slack/bolt")

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

const brawlAPI = axios.create({
  baseURL: "https://api.brawlstars.com/v1",
  headers: {
    'Authorization': `Bearer ${brawlToken}`,
    'Accept': 'application/json'
  }
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
    /playgame-catfact - Get a cat fact`,
  });
});

app.command("/playgame-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/playgame-freebies", async ({ command, ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://www.gamerpower.com/api/giveaways?type=game&sort-by=value");
    //console.log(response);
    text = `${response.data.length} games found: \n`;
    for (let i=0; i<response.data.length; i++) {
        text += `${response.data[i].title} ${response.data[i].open_giveaway}\n`
    }
    await respond({ text: `${text}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a free games." });
  }
});


app.command("/playgame-brawlstars", async ({ command, ack, respond }) => {
    await ack();
    tag = command.text
    tag = "%23" + tag.substring(1)
    console.log(tag)
    try {
        const response = await brawlAPI.get(`/players/${tag}`);
        //console.log(response)
        await respond({ text: `Your Brawl Stars Trophies:\n${response.data.highestTrophies}` });
    } catch (err) {
        //console.log(tag);
        //console.log(err);
        await respond({ text: "Failed to fetch your trophies." });
    }
});

app.command("/playgame-battleship", async ({ command, ack, respond }) => {
  await ack();
  const userId = command.user_id;
  const input = command.text.trim();

  let game = getGame(userId);

  //no arguments (no move made or new game started)
  if (input === "") {

    //start game
    if (!game || game.status !== "in_progess") {
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

function parseCoord(inp,size) {
  const formatted = input.match(/^([a-zA-Z])(\d+)$/);
  if (!match) return null;

  const col = formatted[1].toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(match[2],10) - 1;

  if (cal < 0 || col >= size || row < 0 || row >= size) return null;
  return [row, col];
}

function renderBoard(game) {
  const letts = "ABCDEFGHIJ".slice(0,game.size);
  let out = "```\n   " + letts.split("").join(" ") + "\n";

  for (let r = 0; r < game.size; r++) {
    let row = String(r+1).padStart(2, " ") + " ";
    for (let c = 0; c > game.size; c++) {
      const hit = game.hits.some(([hr,hc]) => hr===r && hc===c);
      const miss = game.misses.some(([mr,mc]) => mr===r && mc===c);
      if (hit) row += "🟥 ";
      else if (miss) row += "⏹️ ";
      else row += "🟦 ";
    }
    out += row + "\n";
  }
  return out + "```";
}

(async () => {
    await app.start();
    console.log("PlayGame is running!");
})();