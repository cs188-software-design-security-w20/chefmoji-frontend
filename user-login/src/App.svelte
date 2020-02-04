<script>
	export let playerid;
	export let password;

	function submit_login() {
	    // var spassword = password; // considered using JSON.stringify but it simply adds double quotes in this case
	    // var splayerid = playerid; // inputs from page are always strings, injections didn't work

	    // console.log(splayerid);
	    // console.log(typeof splayerid);
	    // console.log(spassword);
	    // console.log(typeof spassword);

	    if (password.length < 1 || playerid.length < 1){
            document.getElementById("hiddentext").innerHTML = "did you fill out all the fields?" ;
            password = '';
            playerid = '';
            return;
	    }
        else if (password.length < 10 || playerid.length > 30){
            document.getElementById("hiddentext").innerHTML = "incorrect password" ;
            password = '';
            playerid = '';
            return;
        }

        // encrypt the password, clear out the old password

        if (playerid.length < 6 || playerid.length > 20){
            document.getElementById("hiddentext").innerHTML = "incorrect player ID" ;
            password = '';
            playerid = '';
            return;
        }

        // check with backend, allow or deny privileges

        const grant_access = 1;

        if (grant_access === 1){
            document.getElementById("hiddentext").innerHTML = "success" ;
        } else {
            document.getElementById("hiddentext").innerHTML = "incorrect player ID or password" ;
        }

	}

	function submit_signup() {

	}

</script>

<main>
	<h1> Chefmoji </h1>
	<p id="hiddentext">  </p>
	<p> playerid: </p> <input bind:value={playerid}>
	<br>
	<p> password: </p> <input bind:value={password}>
	<br>
	<button on:click={submit_signup}> sign in </button> <!-- add .landbtn ids -->
	<button on:click={submit_login}> log in </button> <!-- add .landbtn ids -->
</main>


<!--
<section>
	{#if playerid.length === 0 || password.length === 0}
		<p> Did you fill out all the fields? </p>
	{:else}
		<p> success </p>
	{/if}
</section>
-->


<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
</svelte:head>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #003eee;
		text-transform: lowercase;
		font-size: 4em;
		font-weight: 100;
		font: 'Quicksand'; /* make bold at some point */
	}

	p {
		color: #000000;
		text-transform: lowercase;
		font: 'Quicksand';
	}

	input {
		font: 'Quicksand';
	}

	button{
        font : 'Quicksand';
        padding: 0.15rem 0.5rem;
        background-color: #AEC2DC;
        cursor: pointer;
        color: black; /* font color */
    }

    button:hover {
      background-color: #7E9DC7; /* Green */
      color: white;
    }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>