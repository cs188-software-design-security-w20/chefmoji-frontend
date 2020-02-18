<style>
</style>

<script>
    const ADDR = 'http://localhost:8080';
    const socket = io(ADDR, { transports: ['websocket'] });

    // Get session-key and player-id from cookie store
    function fromCookie(name){
        let matches = document.cookie.split(';').filter(function(cookie_str){
            cookie_str.indexOf(`${name}=`) == 0
        });
        if (matches.length > 0){
            return matches[0].substring(matches[0].indexOf("=")+1);
        }
        return undefined;
    }

    function hasCredentials(){
        return (session_key != '' && player_id != '');
    }

    socket.on('connect', () => {
		console.log("CONNECTED");
    });

    socket.on('tick', () => {
        console.log('TICK!');
    })

    var game_id = '';
    var session_key = '';
    session_key = fromCookie('session-key');
    player_id = fromCookie('player-id');

    function joinGame(){
        if (hasCredentials() && game_id != ''){
            socket.emit('join-game-with-id', game_id, player_id);
        }
    }
</script>

{#if hasCredentials()}
<div>
    <div class='join-game'>
        <form>
            <label for="join-code"></label>
            <input 
                type="text" 
                id="join-code" 
                name="Join With Game Code" required 
                value={game_id}
                minlength="8"
                maxlength="8">
        </form>
        <button on:click={joinGame}>
            Join Game With Code
        </button>
    </div>

    <div class='create-game'>
        <button>
            Create a New Game
        </button>
    </div>
</div>
{:else}
    <h1 style="color: red;">Client did not receive session-key and player-ID</h1>
{/if}

