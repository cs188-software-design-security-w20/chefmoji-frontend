<script>
    export let game_id = ''; // Game ID value filled into form by user

    export let is_owner = false; // Don't remove this! Insiya already knows this is unused
    export let game_owner = undefined;
    export let player_list = [];
    export let session_key = undefined;
    export let socket;

    function playGame(socket, session_key, game_id){
  		socket.emit('play', session_key, game_id);
  	}

</script>

<main>
  <h3 id="game_id_header"> game code: {game_id} </h3>

  <div id="list_of_players" >
    {#each player_list as player}
      <p> {player} </p>
    {/each}
  </div>

  <!-- {#if is_owner} -->
    <div class="playbtn_div">
      <div class="play-game">
      	<button on:click={()=>{playGame(socket, session_key, game_id);}}>
      		Play game!
      	</button>
      </div>
    </div>
  <!-- {:else} -->
    <p id="non_owner_msg"> {game_owner} will start the game once everyone is ready... </p>
  <!-- {/if} -->
</main>

<style>

  #game_id_header {
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;

    font-size: 45px;
    margin: 15px 15px;

    color: #000000;
    text-align: center;
  }

  #list_of_players p {
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;

    font-size: 30px;
    margin: 15px 15px;

    color: #000000;
    text-align: center;
  }

  .playbtn_div {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
  }

  .play-game button { /* labels for input boxes */
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

  .play-game button:hover {
    background: #7E9DC7; /* dark blue */
    color: white; /* font color */
  }

  #non_owner_msg {
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;

    font-size: 25px;
    margin: 20px 20px;
    color: #9C978F;
    text-align: center;
  }

</style>
