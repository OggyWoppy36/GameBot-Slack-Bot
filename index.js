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
        console.log(response)
        await respond({ text: `Your Brawl Stars Trophies:\n${response.highestTrophies}` });
    } catch (err) {
        console.log(tag);
        console.log(err);
        await respond({ text: "Failed to fetch your trophies." });
    }
});

(async () => {
    await app.start();
    console.log("PlayGame is running!");
})();