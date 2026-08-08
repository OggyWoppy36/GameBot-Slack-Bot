const GAME_TYPE = "codebreak";

function register(app, store) {
    app.command("/oggy-codebreak", async ({ command, ack, respond }) => {
        await ack();
        const userId = command.user_id;
        const input = command.text.trim();

        let game = store.getGame(GAME_TYPE, userId);
        
        if (input === "") {
            console.log("no in");
            if (!game || game.status !== "in_progress") {
              return respond({
                text: "Please start the game with a difficulty (1-3) Ex: `/oggy-codebreak 2` "
              });
            }
            return respond({
                text: `Codebreak functions:
    \`/oggy-codebreak\` - prints this information
    \`/oggy-codebreak [1-3]\` - creates new game with selected difficulty
    \`/oggy-codebreak [mode]\` - changes mode to "easy" or "hard". Easy shows locations of correct/missplaced guesses
    \`/oggy-codebreak [guess]\` - make a guess using numbers 1-8. Make sure the guess is the correct length (${game.length}).
    \`/oggy-codebreak show\` - show all previous guesses and their scores.
    \`/oggy-codebreak quit\` - ends current game and reveals the answer
Interpreting output:
    \`#\` - One of your digits was correct and in the correct spot
    \`*\` - One of your digits was correct but in the wrong spot
    \`No Output\` - None of your digits were correct
`
            })
        }

        if ((!game || game.status !== "in_progress") && input.length === 1 && "123".includes(input)) {
          console.log("newgame");
          game = createGame(userId, parseInt(input));
          store.saveGame(GAME_TYPE, game);
          return respond({
            text: `New game created. Enter a ${(parseInt(game.difficulty) + 3)}-digit code using digits 1-8`
          });
        }

        if (!game || game.status !== "in_progress") {
          return respond({
            text: "No active game. Run `/oggy-codebreak [1-3]` to start one.",
          });
        }

        if (input === "quit") {
            console.log("quit");
            store.deleteGame(GAME_TYPE,userId);
            return respond({ text: `Game quit. The code was ${game.code}. You had ${game.guesses.length} guesses and spent ${calcTime(game)} seconds.`})
        } else if (input === "easy") {
            console.log("ea");
            game.showLocations = true;
            store.saveGame(GAME_TYPE, game);
            return respond({ text: "Mode set to easy."});
        } else if (input === "hard") {
            console.log("hd");
            game.showLocations = false;
            store.saveGame(GAME_TYPE, game);
            return respond({ text: "Mode set to hard." });
        } else if (input == "show") {
            return respond({
                text: `${printGuesses(game)}`
            });
        } else if (isValidGuess(game.length,input)) {
            const score = makeGuess(game,input);
            if (score[0] === game.length) {
                game.status = "won";
                game.finishedAt = Date.now();
                store.saveGame(GAME_TYPE, game);
                return respond({
                    text: `${printGuesses(game)}\nYou cracked the code in ${game.guesses.length} guesses! (${calcTime(game)}s!)`
                });
            }

            store.saveGame(GAME_TYPE,game);
            return respond({ text: `${printScore(score)}` });
        }
        
        
        

        return respond({
            text: "Invalid input. Type `/oggy-codebreak` for more information"
        });
    })
}

function makeGuess(game, input) {
    game.guesses.push(input);
    const score = scoreGuess(input, game.code, game.length);
    game.scores.push(score);
    return score;
}

function scoreGuess(guess, code, len) {
    let exact = 0;
    let missplaced = 0;
    let copy = code;
    for (let i=0; i<len; i++) {
        if (guess[i] === copy[i]) exact++;
    }
    for (let i=0; i<len; i++) {
        if (copy.includes(guess[i])) {
            copy = copy.replace(guess[i],"");
            missplaced++;
        }
    }
    return [exact, missplaced-exact];
}


function isValidGuess(gameLen,guess) {
    if (guess.length !== gameLen) return false;
    return (/^[1-8]+$/.test(guess));
}

function printScore(score) {
    return "#".repeat(score[0]) + "$".repeat(score[1]);
}

function printGuesses(game) {
    let out = "```Guesses: \n";
    for (let i=0; i<game.guesses.length; i++) {
        out += "   " + game.guesses[i] + "\n   " + printScore(game.scores[i]) + "\n";
    }
    return out + "```";
}

function generateCode(len) {
    let code = "";
    for (let i=0; i<len; i++) {
        code += "" + Math.floor(Math.random()*8+1);
    }
    return code;
}

function createGame(userId, diff) {
    const code = generateCode(diff+3);
    return {
      userId,
      difficulty: diff,
      length: diff+3,
      code,
      guesses: [],
      scores: [],
      showLocations: false,
      startedAt: Date.now(),
      finishedAt: null,
      status: "in_progress",
    };
}

function calcTime(game) {
    return ((Date.now() - game.startedAt) / 1000.0).toFixed(1);
}

module.exports = { register };