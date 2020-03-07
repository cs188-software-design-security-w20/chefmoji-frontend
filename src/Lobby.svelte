<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
</svelte:head>

<style>
  #gamename {
    position: relative;
    margin-top: 3%;

    font-family: 'Quicksand';
    font-style: normal;
    font-weight: bold;
    font-size: 100px;
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

  #hiddentext {
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    text-align: center;
  }
	main {
		position: relative;
	}

	#instructions {
		position: absolute;
		width: 90vw;
		height: 80vh;
    top: 0;
    border: 5px solid #7E9DC7;
    border-radius: 10px;
    background-color: white;
    z-index: 999;
    text-align: center;
    left: 50%;
    margin-left: calc((90vw / 2) * -1);
	}
	#instructions h2 {
    font-family: 'Quicksand';
    font-style: normal;
    font-size: 50px;
    text-align: center;
    margin: 0;
	}
	#instructions img{
		width: 98%;
    margin: auto;
	}

  .view-ins {
    width: 300px;
    height: 40px;
    margin: 15px 15px;

    color: black; /* font color */
    background: #AEC2DC; /* light blue */
    border-radius: 15px;
    cursor: pointer;

    font-family: 'Quicksand';
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    text-align: center;
  }

  .view-ins:hover {
    background: #7E9DC7; /* dark blue */
    color: white; /* font color */
  }

  #close-instructions {
    font-size: 24px;
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
  }

</style>

<script>
    import JoinGame from './JoinGame.svelte';
    import WaitForGame from './WaitForGame.svelte';
    import Game from './Game.svelte';
    import io from '../node_modules/socket.io-client/dist/socket.io.js';

    const PORT = __buildEnv__ ? '80' : '8080';
    const HOSTNAME = __buildEnv__ ? (__sslSupport__ ? 'https://chefmoji.wtf': 'http://chefmoji.wtf') : 'http://localhost';
    // TODO: Change for production from localhist
    const ADDR = (__sslSupport__ && __buildEnv__) ? HOSTNAME : `${HOSTNAME}:${PORT}`;
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

    let instructionsVisible = false;
	  let imageSrc = 'https://drive.google.com/uc?export=view&id=1_co1nwfzENYFTLYKhx7yAf1geeelIMY6';

    function toggleIns() {
      instructionsVisible = !instructionsVisible;
    }

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
      socket.emit('player-id', player_id);
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
          game_in_play = false;
        }
        console.log(data.player, "has timed out");
      }
    });

    socket.on('join-confirm', (id) => {
      if(id == ""){
        document.getElementById("hiddentext").innerHTML = "incorrect join code";
        game_id = undefined;
      }
      else {
        game_id = id;
      }
    });

    function joinGame(id){
        if (authd()){
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
                joinGame(data.game_id);
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
  <div id='instructions' style="display: {(instructionsVisible & !game_in_play) ? 'block' : 'none'}">
    <div id='close-instructions' on:click={()=>toggleIns()}> ✖️ </div>
    <h2> 👩‍🍳 how to play 👨‍🍳 </h2>
    <img src={imageSrc} alt='instructions image'/>
  </div>
  {#if authd()}
    {#if game_id}
      {#if game_in_play}
        <Game {session_key} {game_id} {socket}/>
      {:else}
        <div style="display: table; margin: 0px auto;">
          <WaitForGame {socket} {session_key} {game_id} {game_owner} {player_list}/>
          <button class='view-ins' on:click={()=>toggleIns()}>
            How to play?
          </button>
        </div>
      {/if}
    {:else}
      <div style="display: table; margin: 0px auto;">
        <p id="hiddentext"> </p>
        <JoinGame {joinGame} {createGame} {game_id}/>
        <button class='view-ins' on:click={()=>toggleIns()}>
          how to play
        </button>
      </div>
    {/if}
  {:else}
      <h1 id="redirect_text"> redirecting you to the login screen... </h1>
      <script> window.location.replace("index.html"); </script>
  {/if}

</main>
