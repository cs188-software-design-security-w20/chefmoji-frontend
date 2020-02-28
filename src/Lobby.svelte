<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
</svelte:head>

<style>
  #gamename {
    position: relative;
    margin-top: 3%;

    font-family: Quicksand;
    font-style: normal;
    font-weight: bold;
    font-size: 100px;
    /* line-height: 117px; */
    text-align: center;

    color: #7E9DC7;
  }

  #redirect_text {
    text-transform: lowercase;
    font-family: 'Quicksand';
    font-style: normal;
    font-weight: normal;
    text-align: center;
    color: #000000;
  }
</style>

<script>
    import JoinGame from './JoinGame.svelte';
    import WaitForGame from './WaitForGame.svelte';
    import Game from './Game.svelte';
    import io from '../node_modules/socket.io-client/dist/socket.io.js';

    const PORT = __buildEnv__ ? '80' : '8080';
    const HOSTNAME = __buildEnv__ ? 'https://chefmoji.wtf' : 'http://localhost';
    // TODO: Change for production from localhist
    const ADDR = `${HOSTNAME}:${PORT}`;
    const socket = io(ADDR, { transports: ['websocket']});
    const SESSION_KEY = 'session-key';
    const PLAYER_ID = 'player-id';

    let game_id = undefined;
    let session_key = undefined;
    let player_id = undefined;
    let game_in_play = false; // is a game currently in play?
    let is_owner = false; // does the current player own a game?
    let game_owner = undefined; // owner of the game
    let player_list = []; // for players in the current game (if any)
    let cookbook = {};

    // Get session-key and player-id from cookie store
    // Picks the first cookie matching the search name found
    // Do not depend on any specific ordering
    function fromCookie(name){
        let matches = document.cookie.split(';').filter((cookie_str)=>(cookie_str.indexOf(`${name}=`) !== -1));
        if (matches.length > 0){
            return matches[0].substring(matches[0].indexOf("=")+1);
        }
        return undefined;
    }

    function authd(){
        return (session_key !== undefined && player_id !== undefined);
    }

    socket.on('connect', () => {
		console.log("CONNECTED");
    });


    socket.on('session-init', (issued_game_id) => {
        cookbook = data.cookbook;
        game_id = issued_game_id;
        joinGame(game_id);
    });

    session_key = fromCookie(SESSION_KEY);
    player_id = fromCookie(PLAYER_ID);

    function inGame(){
        return (game_id !== undefined);
    }

    socket.on('get-game-players', (in_game, owns_game, owner, players) => {
      game_in_play = in_game;
      is_owner = owns_game;
      game_owner = owner;
      player_list = players;
    });

    socket.on('game-started', data => {
      game_in_play = data;
	});
	
    socket.on('timedout', data => {
		if (data) {
			if (data.player == player_id) {
				game_id = undefined;
			}
			console.log(data.player, "has timed out");
		}
    });

    function joinGame(id){
        if (authd()){
            game_id = id;
            socket.emit('join-game-with-id', id, player_id, session_key);
        }
    }

    function createGame(){
        if (authd() && !inGame()){
            // fetch create-game api endpoint with session_key
			var data = {playerid: player_id, sessionkey: session_key};
            fetch('/create-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then((resp)=>{
              if(!resp.status || resp.status != 200){
                 throw resp;
              }
              return resp.json();
            }).then((data)=>{
                game_id=data.game_id;
                joinGame(game_id);
            }).catch((e)=>{
                console.error(e);
            });
        }
    }
</script>

<main>
  {#if !game_in_play}
    <h1 id="gamename"> 👩‍🍳 chefmoji 👨‍🍳 </h1>
  {/if}

  {#if authd()}
    {#if game_id}
      {#if game_in_play}
        <Game {session_key} {game_id} {socket}/>
      {:else}
        <div style="display: table; margin: 0px auto;">
          <WaitForGame {socket} {session_key} {game_id} {game_owner} {player_list}/>
        </div>
      {/if}
    {:else}
      <div style="display: table; margin: 0px auto;">
        <JoinGame {joinGame} {createGame} {game_id}/>
      </div>
    {/if}
  {:else}
      <h1 id="redirect_text"> redirecting you to the login screen... </h1>
      <script> window.location.replace("index.html"); </script>
  {/if}

</main>
