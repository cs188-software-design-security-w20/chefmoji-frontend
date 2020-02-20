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
    import Game from './Game.svelte';
    import io from '../node_modules/socket.io-client/dist/socket.io.js';

    const PORT = '8080';
    const ADDR = `http://localhost:${PORT}`;
    const socket = io(ADDR, { transports: ['websocket'] });
    const SESSION_KEY = 'session-key';
    const PLAYER_ID = 'player-id';

    let game_id = undefined;
    let session_key = undefined;
    let player_id = undefined;

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

    socket.on('disconnect', () => {
        game_id = '';
    });

    socket.on('session-init', (issued_game_id) => {
        joinGame();
        game_id = issued_game_id;
    });

    session_key = fromCookie(SESSION_KEY);
    player_id = fromCookie(PLAYER_ID);

    function inGame(){
        return (game_id !== undefined);
    }

    function joinGame(){
        if (authd()){
            socket.emit('join-game-with-id', game_id, player_id, session_key);
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
            }).then((resp)=>resp.json()).then((data)=>{
                game_id=data.game_id;
                joinGame();
            }).catch((e)=>{
                console.error(e);
            });
        }
    }
</script>

<main>
  <h1 id="gamename"> 👩‍🍳 chefmoji 👨‍🍳 </h1>
  {#if authd()}
      {#if !game_id}
          <JoinGame {joinGame} {createGame} {game_id} {player_id}/>
      {:else}
          <Game {session_key} {game_id} {socket}/>
      {/if}
  {:else}
      <h1 id="redirect_text"> redirecting you to the login screen... </h1>
      <script> window.location.replace("index.html"); </script>
  {/if}
</main>
