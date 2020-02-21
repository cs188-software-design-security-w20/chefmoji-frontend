<script>
    // Handler Funcs
    export let checkPlayers;

    // Game ID value filled into form by user
    export let game_id = '';

    export let game_in_play;
    export let player_list;
    export let session_key;

</script>

<main>
  <h3 id="game_id_header">game id: {game_id}</h3>
  <div id="list_of_players">

  {#each player_list as player}
    <p> {player} </p>
  {/each}

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


</style>
