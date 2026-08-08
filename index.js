require("dotenv").config();
const axios = require("axios");
const { App } = require("@slack/bolt")
const store = require("./store");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});


app.command("/oggy-ping", async ({ command, ack, respond }) => {
    //console.log(command)
    const start = Date.now()
    await ack();
    const latency = Date.now() - start;
    await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/oggy-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: `Available Commands:
    /oggy-ping - Check bot latency
    /oggy-battleship - Play battleship (singleplayer)`
  });
});

require("./games/battleship").register(app, store);


(async () => {
    await app.start();
    console.log("PlayGame is running!");
})();