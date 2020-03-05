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
                maxlength="8"
                placeholder="join code">
        </form>
        <button on:click={()=>{joinGame(game_id)}}>
            join an existing game
        </button>
    </div>

    <div class='create-game'>
        <button on:click={createGame}>
            create a new game
        </button>
    </div>
</div>

<style>

  .join-game button, .create-game button { /* labels for input boxes */
    width: 300px;
		height: 40px;
    margin: 15px 15px;

    color: black; /* font color */
    background: #AEC2DC; /* light blue */
		border-radius: 15px;
		cursor: pointer;

    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    text-align: center;
  }

  .join-game button:hover, .create-game button:hover {
    background: #7E9DC7; /* dark blue */
    color: white; /* font color */
  }

  .join-game input { /* input boxes */
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;

    width: 300px;
    height: 40px;
    margin: 15px 15px;

    background: #FFFFFF;
    border: 1px solid #000000;
    border-radius: 15px;
    text-align: center;
  }


</style>
