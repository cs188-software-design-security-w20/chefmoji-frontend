<style>
</style>

<script>
    import JoinGame from './JoinGame.svelte';
    import Game from './Game.svelte';

    const PORT = '8080';
    const ADDR = `http://localhost:${PORT}`;
    const socket = io(ADDR, { transports: ['websocket'] });
    const SESSION_KEY = 'session-key';
    const PLAYER_ID = 'player-id';

    let game_id = undefined;
    let session_key = undefined;

    // Get session-key and player-id from cookie store
    // Picks the first cookie matching the search name found
    // Do not depend on any specific ordering
    function fromCookie(name){
        let matches = document.cookie.split(';').filter(function(cookie_str){
            cookie_str.indexOf(`${name}=`) == 0
        });
        if (matches.length > 0){
            return matches[0].substring(matches[0].indexOf("=")+1);
        }
        return undefined;
    }

    function authd(){
        return (session_key !== '' && player_id !== '');
    }

    function inGame(){
        return game_id !== '';
    }

    socket.on('connect', () => {
		console.log("CONNECTED");
    });

    socket.on('session-init', (issued_game_id) => {
        console.log("Game ID given");
        joinGame();
        game_id = issued_game_id;
    });

    session_key = fromCookie(SESSION_KEY);
    player_id = fromCookie(PLAYER_ID);

    function joinGame(){
        if (authd() && game_id != ''){
            socket.emit('join-game-with-id', game_id, player_id, session_key);
        }
    }

    function createGame(){
        if (authd() && !inGame()){
            // fetch create-game api endpoint with session_key
            var data = {playerid: playerid, sessionkey: session_key};
            fetch('/create-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        }
    }

</script>

{#if authd()}
    {#if !inGame()}
        <JoinGame {joinGame} {createGame} {game_id}/>
    {:else}
        <Game {session_key} {game_id} {socket}/>
    {/if}
{:else}
    <h1 style="color: red; font-size: 24px;">Client did not receive session-key and player-ID</h1>
{/if}

