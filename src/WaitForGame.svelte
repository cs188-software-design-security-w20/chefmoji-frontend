<script>
    // Handler Funcs
    export let checkPlayers;

    // Game ID value filled into form by user
    export let game_id = '';

    export let player_list;
    export let session_key;
    export let socket;
    export let gameplayStarted;

    function playGame(socket, session_key, game_id){
  		socket.emit('play', session_key, game_id);
  	}

</script>

<main>
  <h3 id="game_id_header">game id: {game_id}</h3>
  <div id="list_of_players" >
  
  {#each player_list as player}
    <p> {player} </p>
  {/each}
    <div class="playbtn_div">
      <div class="play-game">
      	<button on:click={()=>{playGame(socket, session_key, game_id); gameplayStarted();}}>
      		Play game!
      	</button>
      </div>
    </div>
  </div>
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

  #list_of_players p { /* input boxes */
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

</style>
