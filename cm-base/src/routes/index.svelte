<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { SHA3 } from 'sha3';

	let playerid, password, repeat_password, email;
  let visible = false;

  let pass_upper = false, pass_lower = false, pass_number = false;
  let pass_special = false, pass_len = false;

  var isEmailWithTLD = function (email){
	   return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*(\.\w{2,})+$/.test(email);
  };

	function click_login() {
      var rc_response = grecaptcha.getResponse();
      console.log(rc_response); // RECATCHA RESPONSE - REMOVE LINE BEFORE PRODUCTION

      // check lengths - if they don't fit our sign up constraints, there's no point to consulting backend
      if (!password || password.length < 1 || !playerid || playerid.length < 1){
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

  function check_playerid_constraints(playerid) { // SEE IF WE CAN CALL THIS FUNCTION ON CHANGE
    // length check
    if (playerid.length < 6 || playerid.length > 20){
        document.getElementById("hiddentext").innerHTML = "player ID should be between 6 and 20 characters" ;
        return false;
    }

    // profanity check
    else if (playerid.search("fuck") != -1 || playerid.search("shit") != -1 || playerid.search("whore") != -1 || playerid.search("bitch") != -1 || playerid.search("asshole") != -1) {
      document.getElementById("hiddentext").innerHTML = "is your player ID clean from swearing and profanity?" ;
      return false;
    }

    // consult database - "that player ID is already in use! try another one!"

    return true;

  }

	function click_signup() {
    // send PII to server
    playerid_ok = check_playerid_constraints(playerid);

	}



  function check_password_constraints() {
    if (!!password) {
      pass_upper = password != password.toLocaleLowerCase();
      pass_lower = password != password.toLocaleUpperCase();
      pass_number = /\d/.test(password);
      pass_special = /[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/g.test(password); //OWASP Standard Symbol Set for passwords
      //pass_special = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g.test(password);
      if(password.length < 10 || password.length > 30){
        pass_len = false;
      } else {
        pass_len = true;
      }
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
      <input type="text" name="username" class="input_box" style="top: 295px;" bind:value={playerid}>
  </label>
	<br>

  <p class="input_label" style="left: 500px; top: 330px;"> password: </p>
	<label> <!-- ignore warnings in WebStorms, this input block works -->
      <input type="password" name="password" class="input_box" style="top: 355px;" bind:value={password} on:input={visible?check_password_constraints:''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
  </label>
	<br>

  {#if visible}

    <p> repeat password: </p>
    <label> <!-- ignore warnings in WebStorms, this input block works -->
        <input type="password" name="password" bind:value={repeat_password} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
    </label>
    <br>
    {#if pass_upper && pass_lower}
      <p> contains upper and lowercase letters </p>
    {:else}
      <p> does NOT contain upper and lowercase letters </p>
    {/if}
    {#if pass_number}
      <p> contains numbers </p>
    {:else}
      <p> does NOT contain numbers </p>
    {/if}
    {#if pass_special}
      <p> contains symbols </p>
    {:else}
      <p> does NOT contain symbols </p>
    {/if}
    {#if pass_len}
      <p> length is between is between 10 and 30 characters </p>
    {:else}
      <p> length is NOT between is between 10 and 30 characters </p>
    {/if}
    {#if password.length() > 1 && password == repeat_password}
      <p> passwords match </p>
    {:else}
      <p> passwords do NOT match </p>
    {/if}

    <p> email: </p>
    <label>
        <input type="email" name="email" bind:value={email} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
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
