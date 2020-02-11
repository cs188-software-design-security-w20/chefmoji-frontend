<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { SHA3 } from 'sha3';

	let playerid, password, repeat_password, email;
  let visible = false;

	function click_login() {
      var rc_response = grecaptcha.getResponse();
      console.log(rc_response);
      // check lengths - if they don't fit our sign up constraints, there's no point to consulting backend
      if (password.length < 1 || playerid.length < 1){
          document.getElementById("hiddentext").innerHTML = "did you fill out all the fields?" ;
          password = '';
          return;
      }
      else if (password.length < 10 || password.length > 30){
          document.getElementById("hiddentext").innerHTML = "incorrect password" ;
          password = '';
          return;
      }
      else if (rc_response.length == 0) {
          document.getElementById("hiddentext").innerHTML = "recaptcha failed" ;
          password = '';
          return;
      }

      // encrypt the password, clear out plaintext password
      const hash = new SHA3(256);
      hash.update(password);
      password = '';
      var passhash = hash.digest('hex');

      if (playerid.length < 6 || playerid.length > 20){
          document.getElementById("hiddentext").innerHTML = "incorrect player ID" ;
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

	function click_signup() {

	}

  function check_password_constraints() {
    if(password.length < 10 || password.length > 30){
      pass_len = false
    } else {
      pass_len = true
    }
    if(password.length < 10 || password.length > 30){
      pass_len = false
    } else {
      pass_len = true
    }
  }

  function toggle_visible() {
    visible = !visible;
  }

  onMount(() => {
    window.click_login = null;
  })

  onDestroy(() => {
    window.click_login = null;
  })

</script>

<main>
	<h1> chef<br>moji </h1>
	<p id="hiddentext">  </p>

  <p class="input_label" style="left: 513px; top: 270px;"> player id: </p>
	<label>
      <input type="text" class="input_box" style="top: 295px;" bind:value={playerid}>
  </label>
	<br>

  <p class="input_label" style="left: 500px; top: 330px;"> password: </p>
	<label> <!-- ignore warnings in WebStorms, this input block works -->
      <input type="password" class="input_box" style="top: 355px;" bind:value={password} on:change={visible?check_password_constraints:''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
  </label>
	<br>

  {#if visible}

    <p> repeat password: </p>
    <label> <!-- ignore warnings in WebStorms, this input block works -->
        <input type="password" bind:value={repeat_password} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
    </label>
    <br>
    <p> email: </p>
    <label>
        <input type="email" bind:value={email} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
    </label>
    <br>

  {/if}


	<form action="?" method="POST">
        <div id="recaptcha" class="g-recaptcha" data-sitekey="6Let39YUAAAAACzwA-hE3mbCstRaQdJC52E0l4iP"></div>
  </form>
  <br>


  {#if !visible}
    <button class="landbtn" style="left: 672px; top: 530px;" on:click={toggle_visible}> sign up </button>
  	<button class="landbtn" style="left: 1022px; top: 530px;" on:click={click_login}> log in </button>
  {:else}
    <button class="landbtn" style="left: 672px; top: 530px;" on:click={toggle_visible}> go back </button>
    <button class="landbtn" style="left: 1022px; top: 530px;" on:click={click_signup}> make my account </button>
  {/if}




</main>

<style>
	main {
		text-align: left;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
    	position: absolute;
		width: 210px;
		height: 250px;
		left: 70px;
		top: 225px;

		font-family: Quicksand;
		font-style: normal;
		font-weight: bold;
		font-size: 100px;
		line-height: 117px;
		text-align: center;

		color: #7E9DC7;
	}

	p {
		color: #000000;
		text-transform: lowercase;
		font-family: 'Quicksand';
	}

	.input_label {
		/* left and top attributes defined inline */
    position: absolute;
		width: 127px;
		height: 38px;

		font-family: Quicksand;
		font-style: normal;
		font-weight: normal;
		font-size: 30px;
		line-height: 35px;
		text-align: right;

		color: #000000;
	}

	.input_box {
		font-family: Quicksand;
		font-style: normal;
		font-weight: normal;
		position: absolute;
		width: 650px;
		height: 40px;
		left: 672px;

		background: #FFFFFF;
		border: 1px solid #000000;
		border-radius: 15px;
	}

	#recaptcha {
		position: absolute;
		left: 850px;
		top: 430px;
	}

	.landbtn {
		/* left and top attributes defined inline */
		position: absolute;
	  width: 300px;
		height: 40px;

		background: #AEC2DC;
		border-radius: 15px;
		cursor: pointer;

    font-family: Quicksand;
		font-style: normal;
		font-weight: normal;
		font-size: 20px;
    color: black; /* font color */
  }

  .landbtn:hover {
    background: #7E9DC7; /* Green */
    color: white; /* font color */
  }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
