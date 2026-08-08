const GAME_TYPE = "codebreak";

function register(app, store) {
    app.command("/oggy-codebreak", async ({ command, ack, respond }) => {
        await ack();
        const userId = command.userId;
        const input = command.text.trim();

        let game = store.getGame(GAME_TYPE, userId);
        
        if (input == "") {
            if (!game || game.status !== "in_progress") {
              return respond({
                text: "Please start the game with a difficulty (1-3) Ex: `/oggy-codebreak 2` "
              });
            }
            return respond({
                text: `Codebreak functions:
                    \`/oggy-codebreak\` - prints this list of functions
                    \`/oggy-codebreak [1-3]\` - creates new game with selected difficulty
                    \`/oggy-codebreak mode\` - switches mode between easy and hard. Easy shows locations of correct/missplaced guesses
                    \`/oggy-codebreak [guess]\` - make a guess using numbers 1-8. Make sure the guess is the correct length.
                    \`/oggy-codebreak quit\` - ends current game and reveals the answer
                    `
            })
        }


        return respond({
            text: "wow"
        });
    })
}

function printGuesses(game) {
    let out = "Guesses: ";
    for (let i=0; i<game.guesses.length; i++) {

    }
}


function createGame(userId, difficulty) {
    const code = generateCode(difficulty);
    return {
      userId,
      difficulty,
      code,
      guesses: [],
      scores: [],
      startedAt: Date.now(),
      finishedAt: null,
      status: "in_progress",
    };
}

module.exports = { register };