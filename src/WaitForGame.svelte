<script>
    // Handler Funcs
    export let checkPlayers;

    // Game ID value filled into form by user
    export let game_id;

    export let game_in_play;
    export let player_list;
    export let session_key;

    function listPlayers() {
      checkPlayers();
      if(!game_in_play){
        var HTML_list = document.getElementById("list_of_players");

        // remove old players
        var child = HTML_list.firstElementChild;
        while(child){
          child.remove();
          child = HTML_list.firstElementChild;
        }

        // reload list of players
        for (var player in player_list) {
          var node = document.createElement("p");
          var textnode = document.createTextNode(player);
          node.appendChild(textnode);
          HTML_list.appendChild(node);
        }
        // window.setInterval(listPlayers, 10000); // call every 10 seconds, only if game not in play
      }
    }

    function displayGameID(){
      document.getElementById('game_id_header').innerHTML = concat("game id: ", String(game_id));
    }

</script>

<main>
  <script> displayGameID(); listPlayers(); </script>
  <h3 id="game_id_header"> game id: </h3>
  <div id="list_of_players"> </div>
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
