<script>
    // Handler Funcs
    export let createGame;
    export let joinGame;
    // Game ID value filled into form by user
    export let game_id;
</script>

<div>
    <div class='join-game'>
        <form>
            <label for="join-code"></label>
            <input 
                type="text" 
                id="join-code" 
                name="Join With Game Code" required 
                bind:value={game_id}
                minlength="8"
                maxlength="8">
        </form>
        <button on:click={joinGame}>
            Join Game With Code
        </button>
    </div>

    <div class='create-game'>
        <button on:click={createGame}>
            Create a New Game
        </button>
    </div>
</div>