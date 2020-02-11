<script>
    import { SHA3 } from 'sha3';
    const hash = new SHA3(256);

	export let playerid;
	export let password;

	function submit_login() {

	    // check lengths - if they don't fit our sign up constraints, there's no point to consulting backend
	    if (password.length < 1 || playerid.length < 1){
            document.getElementById("hiddentext").innerHTML = "did you fill out all the fields?" ;
            password = '';
            playerid = '';
            return;
	    }
        else if (password.length < 10 || password.length > 30){
            document.getElementById("hiddentext").innerHTML = "incorrect password" ;
            password = '';
            playerid = '';
            return;
        }

        // encrypt the password, clear out plaintext password
        hash.update(password);
        password = '';
        var passhash = hash.digest('hex');

        if (playerid.length < 6 || playerid.length > 20){
            document.getElementById("hiddentext").innerHTML = "incorrect player ID" ;
            playerid = '';
            passhash = '';
            return;
        }

        // consult backend, allow or deny privileges

        const grant_access = 1; // replace this with backend check

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

	<p> player id: </p>
	<label>
        <input type="text" bind:value={playerid}>
    </label>
	<br>

	<p> password: </p>
	<label> <!-- ignore warnings in WebStorms, this input block works -->
        <input type="password" bind:value={password} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
    </label>
	<br>

	<form action="?" method="POST">
          <div id="recaptcha" class="g-recaptcha" data-sitekey="6Let39YUAAAAACzwA-hE3mbCstRaQdJC52E0l4iP"></div>
    </form>
    <br>

	<button id="landbtn" on:click={submit_signup}> sign up </button>
	<button id="landbtn" on:click={submit_login}> log in </button>
</main>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<style>
	main {
		text-align: left;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
	    text-align: left;
		color: #003eee;
		text-transform: lowercase;
		font-size: 4em;
		font-weight: 100;
		font: 'Quicksand'; /* make bold at some point */
	}

	p {
	    text-align: left;
		color: #000000;
		text-transform: lowercase;
		font: 'Quicksand';
	}

	input {
	    text-align: left;
		font: 'Quicksand';
	}

	#landbtn {
        font : 'Quicksand';
        padding: 0.15rem 0.5rem;
        background-color: #AEC2DC;
        cursor: pointer;
        color: black; /* font color */
    }

    #landbtn:hover {
      background-color: #7E9DC7; /* Green */
      color: white;
    }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>