<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<script>
    import { onMount, onDestroy } from 'svelte';
    import { SHA3 } from 'sha3';

	let playerid, password, repeat_password, email, input_totp;
    let visible = false;

    // let pass_upper = false, pass_lower = false, pass_number = false;
    // let pass_special = false, pass_len = false;

    var isEmailWithTLD = function (email){
        return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*(\.\w{2,})+$/.test(email);
    };

    //debug
	function click_login() {
        // var rc_response = grecaptcha.getResponse();
        // console.log(rc_response); // RECATCHA RESPONSE - REMOVE LINE BEFORE PRODUCTION

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
        else if (playerid.length < 6 || playerid.length > 20){
            document.getElementById("hiddentext").innerHTML = "incorrect player ID" ;
            passhash = '';
            return;
        }
        // else if (rc_response.length == 0) {
        //     document.getElementById("hiddentext").innerHTML = "recaptcha failed" ;
        //     password = '';
        //     return;
        // }

        // encrypt the password, clear out plaintext password
        const hash = new SHA3(256);
        hash.update(password);
        password = '';
        var passhash = hash.digest('hex');

        console.log(playerid, passhash, input_totp)
        var data = {playerid: playerid, password: passhash, totp: input_totp};//22DIFT2G4WICP76W
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
            console.log(data['success'])
            // consult backend, allow or deny privileges
            if (data['success']){
                document.getElementById("hiddentext").innerHTML = "success" ;
            } else {
                document.getElementById("hiddentext").innerHTML = "incorrect player ID or password" ;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
	}

  function check_playerid_constraints(pid) { // SEE IF WE CAN CALL THIS FUNCTION ON CHANGE
    // length check
    if (pid.length < 6 || pid.length > 20){
        document.getElementById("hiddentext").innerHTML = "player ID should be between 6 and 20 characters" ;
        return false;
    }

    // profanity check
    else if (pid.search("fuck") != -1 || pid.search("shit") != -1 || pid.search("whore") != -1 || pid.search("bitch") != -1 || pid.search("asshole") != -1) {
        document.getElementById("hiddentext").innerHTML = "is your player ID clean from swearing and profanity?" ;
        return false;
    }

    // consult database - "that player ID is already in use! try another one!"

    return true;

  }

  function check_password_constraints(pwd, repeat_pwd) {
    var flag = true;
    //console.log(pwd, " ", typeof(pwd))
    if(pwd && pwd != pwd.toLocaleLowerCase() && pwd != pwd.toLocaleUpperCase()){ // check forat least one lower and one upper
      document.getElementById("pw_upper_lower").style.color = "#28A53C"; // green
    } else {
      document.getElementById("pw_upper_lower").style.color = "#DD6539"; // red
      flag = false;
    }
    if(pwd && /\d/.test(pwd)){ // check for at least one number
      document.getElementById("pw_numbers").style.color = "#28A53C";
    } else {
      document.getElementById("pw_numbers").style.color = "#DD6539";
      flag = false;
    }
    if(pwd && /[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/g.test(pwd)){ // check for at least one symbol //OWASP Standard Symbol Set for passwords
      document.getElementById("pw_symbols").style.color = "#28A53C";
    } else {
      document.getElementById("pw_symbols").style.color = "#DD6539";
      flag = false;
    }
    if(pwd && pwd.length >= 10 && pwd.length <= 30){ // check for acceptable password length
      document.getElementById("pw_len").style.color = "#28A53C";
    } else {
      document.getElementById("pw_len").style.color = "#DD6539";
      flag = false;
    }
    if(pwd && pwd === repeat_pwd){ // check for repeat password match
      document.getElementById("pw_repeat_match").style.color = "#28A53C";
    } else {
      document.getElementById("pw_repeat_match").style.color = "#DD6539";
      flag = false;
    }
    return flag;
  }

    function click_signup() {
        // send PII to server
        var playerid_ok = check_playerid_constraints(playerid);
        var password_ok = check_password_constraints(password, repeat_password);
        
        // need to hash password before sending to server
        const hash = new SHA3(256);
        hash.update(password);
        password = '';
        var passhash = hash.digest('hex');

        console.log(playerid, passhash)
        var data = {
            playerid: playerid,
            password: passhash,
            email: email
        };
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.text())
        .then((data) => {
            console.log('Success Register:', data);
        })
        .catch((error) => {
            console.error('Error Register:', error);
        });
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

  <p class="input_label" style="left: 512px; top: 220px;"> player id: </p>
	<label>
      <input type="text" name="username" class="input_box" style="top: 245px;" bind:value={playerid}>
  </label>
	<br>

  <p class="input_label" style="left: 500px; top: 280px;"> password: </p>
	<label> <!-- ignore warnings in WebStorms, this input block works -->
      <input type="password" name="password" class="input_box" style="top: 305px;" bind:value={password} on:input={visible?check_password_constraints(password, repeat_password):''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
  </label>
	<br>
  {#if !visible}
  <p class="input_label" style="left: 500px; top: 340px;"> OTP: </p>
	<label> <!-- ignore warnings in WebStorms, this input block works -->
      <input type="input_totp" name="input_totp" class="input_box" style="top: 365px;" bind:value={input_totp} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
  </label>
	<br>
  {/if}

  {#if visible}

    <p class="input_label" style="left: 405px; top: 340px;" > repeat password: </p>
    <label> <!-- ignore warnings in WebStorms, this input block works -->
        <input type="password" name="password" class="input_box" style="top: 365px;" bind:value={repeat_password} on:input={visible?check_password_constraints(password, repeat_password):''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
    </label>
    <br>

    <p class="pw_constraints" id="pw_upper_lower" style="top: 407px; color: #DD6539;"> contains upper and lowercase letters </p> <!-- red -->
    <p class="pw_constraints" id="pw_numbers" style="top: 430px; color: #DD6539;"> contains numbers </p>
    <p class="pw_constraints" id="pw_symbols" style="top: 453px; color: #DD6539;"> contains symbols </p>
    <p class="pw_constraints" id="pw_len" style="top: 476px; color: #DD6539;"> length is between is between 10 and 30 characters </p>
    <p class="pw_constraints" id="pw_repeat_match" style="top: 499px; color: #DD6539;"> passwords match </p>

    <p class="input_label" style="left: 514px; top: 541px;"> email: </p>
    <label>
        <input type="email" name="email" class="input_box" style="top: 566px;"bind:value={email} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
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
    <button class="landbtn" style="left: 672px; top: 703px;" on:click={toggle_visible}> go back </button>
    <button class="landbtn" style="left: 1022px; top: 703px;" on:click={click_signup}> make my account </button>
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

  #hiddentext {
    position: absolute;
    font-size: 30px;
    text-align: left;
    top: 150px;
    left: 680px;
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
    white-space: nowrap;

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

  .pw_constraints {
    position: absolute;
    left: 672px;

    font-size: 20px;
  }

	#recaptcha {
		position: absolute;
		left: 850px;
    top: 100px; /*430px*/
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
