<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { SHA3 } from 'sha3';

  let jq = window.$
  let playerid, password, repeat_password, email, input_totp, forgot_input_email, forgot_mfakey, forgot_input_password;
  let visible = false;
  let visible_mfakey_field, visible_password_field;

  // var isEmailWithTLD = function (email){
  //     return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*(\.\w{2,})+$/.test(email);
  // };

  function click_login() {
    var elem_hiddentext = document.getElementById("hiddentext");
    elem_hiddentext.innerHTML = "" ;
    var rc_response = grecaptcha.getResponse();

    // check lengths - if they don't fit our sign up constraints, there's no point to consulting backend
    if (!password || !playerid ){
      elem_hiddentext.innerHTML = "did you fill out all the fields?" ;
      password = '';
      input_totp = '';
      return;
    }
    else if (password.length < 10 || password.length > 30){
      elem_hiddentext.innerHTML = "incorrect password" ;
      password = '';
      input_totp = '';
      return;
    }
    else if (playerid.length < 6 || playerid.length > 20){
      elem_hiddentext.innerHTML = "incorrect player ID" ;
      password = '';
      input_totp = '';
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

    // consult backend
    var data = {playerid: playerid, password: passhash, totp: input_totp};
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      if (response.status == 200){
        window.location.replace(response.url);
      }
      if (response.status == 400){
        return response.json();
      }
    })
    .then((data)=>{
      elem_hiddentext.innerHTML = 'Incorrect Player ID or Password';
    })
    .catch((error) => {
      elem_hiddentext.innerHTML = 'An error has occurred with your request.'
      console.error(error);
    });
    password = '';
    passhash = '';
    input_totp = '';
  }

  function check_playerid_constraints(pid) {
    // length check
    if (pid.length < 6 || pid.length > 20){
      document.getElementById("hiddentext").innerHTML = "player ID should be between 6 and 20 characters" ;
      return false;
    }

    // profanity check
    else if (pid.search("fuck") != -1 || pid.search("shit") != -1 || pid.search("whore") != -1 || pid.search("bitch") != -1 || pid.search("asshole") != -1) {
      document.getElementById("hiddentext").innerHTML = "is your player ID clean from swearing and profanity?";
      return false;
    }

    return true;

  }

  function check_password_constraints(pwd, repeat_pwd) {
    var flag = true;
    if(pwd && pwd != pwd.toLocaleLowerCase() && pwd != pwd.toLocaleUpperCase()){ // check for at least one lower and one upper
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
    if(pwd && /[\s~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?()\._]/g.test(pwd)){ // check for at least one symbol // OWASP Standard Symbol Set for passwords
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
    var elem_hiddentext = document.getElementById("hiddentext");
    elem_hiddentext.innerHTML = "" ;
    if(!check_playerid_constraints(playerid)){
      password = '';
      repeat_password = '';
      return;
    }
    if (!check_password_constraints(password, repeat_password)) {
      password = '';
      repeat_password = '';
      return;
    }

    // need to hash password before sending to server
    const hash = new SHA3(256);
    hash.update(password);
    password = '';
    var passhash = hash.digest('hex');

    // consult server
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
    .then((response) => response.json())
    .then((data) => {
      // consult backend, allow or deny privileges
      if (data['success']){
        elem_hiddentext.innerHTML = "success! a verification link has been sent to your email";
        email = '';
      } else if (data['playerid'] == "NOTUNIQUE"){
        elem_hiddentext.innerHTML = "that player ID is already in use! try another one!" ;
      } else if (data['playerid'] == "NOTCLEAN"){
        elem_hiddentext.innerHTML = "is your player ID clean from swearing and profanity?" ;
      } else if (data['email'] == "NOTUNIQUE"){
        elem_hiddentext.innerHTML = "that email is already registered!" ;
      } else {
        elem_hiddentext.innerHTML = "uh oh, something went wrong! please try again!" ;
      }
    })
    .catch((error) => {
      password = '';
      passhash = '';
      repeat_password = '';
      email = '';
      console.error('Error Registered:', error);
    });
    password = '';
    passhash = '';
    repeat_password = '';
    // clear email only if registration was successful
  }

  function toggle_visible() {
    visible = !visible;
    document.getElementById("hiddentext").innerHTML = "" ;
  }

  onMount(() => {
    window.click_login = null;
  })

  onDestroy(() => {
    window.click_login = null;
  })

  function click_forget() {
    let forgotwhat = jq(this).data('forgot-type')
    var data = {
      forgotwhat: forgotwhat,
      email: forgot_input_email,
      mfakey: forgot_mfakey,
      password: forgot_input_password
    };
    jq('#forgetSendButton').prop('disabled', true)
    jq('#forgetSendButton').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    fetch('/forget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
      return response.json();
    })
    .then((data)=>{
        if(data.success) {
          jq('#forgetSendButton').removeClass('btn-primary').addClass('btn-success')
          jq('#forgetSendButton').html('✓')
        } else {
          jq('#forgetSendButton').removeClass('btn-primary').addClass('btn-danger')
          jq('#forgetSendButton').html('x')
        }
    })
    .catch((error) => {
        console.error(error);
        jq('#forgetSendButton').removeClass('btn-primary').addClass('btn-danger')
        jq('#forgetSendButton').html('x')
    });
  }
  function click_modal_toggler() {
    jq('#forgotModalLabel').html(jq(this).html())
    jq('#forgetSendButton').data('forgot-type', jq(this).data('forgot-type'))
    visible_mfakey_field = false;
    visible_password_field = false;
    if(jq(this).data('forgot-type') == 'password') {
      visible_mfakey_field = true;
    }
    if(jq(this).data('forgot-type') == 'playerid') {
      visible_password_field = true;
    }
    jq('#forgotInputEmail').val('')
    jq('#forgetSendButton').prop('disabled', false)
    jq('#forgetSendButton').removeClass('btn-success').addClass('btn-primary')
    jq('#forgetSendButton').removeClass('btn-danger').addClass('btn-primary')
    jq('#forgetSendButton').html('Send')
  }

</script>

<main>
  <div class="modal fade" id="forgotModal" tabindex="-1" role="dialog" aria-labelledby="forgotModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="forgotModalLabel">Modal title</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" id="forgotModalBody">
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="forgotInputEmailLabel">email</span>
            </div>
            <input id="forgotInputEmail" bind:value={forgot_input_email} type="text" class="form-control" placeholder="johndoe@email.com" aria-label="Email" aria-describedby="forgotInputEmailLabel">
          </div>
          {#if visible_password_field}
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="forgotInputPasswordLabel">password</span>
            </div>
            <input id="forgotInputPassword" bind:value={forgot_input_password} type="text" class="form-control" placeholder="" aria-label="password" aria-describedby="forgotInputPasswordLabel">
          </div>
          {/if}
          {#if visible_mfakey_field}
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="forgotInputMfakeyLabel">mfakey</span>
            </div>
            <input id="forgotInputMfakey" bind:value={forgot_mfakey} type="text" class="form-control" placeholder="" aria-label="mfakey" aria-describedby="forgotInputMfakeyLabel">
          </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button id="forgetSendButton" type="button" class="btn btn-primary" on:click={click_forget}>Send</button>
        </div>
      </div>
    </div>
  </div>

	<h1 id="gamename"> chef<br>moji </h1>
  <div id="entire_input_form">
    <p id="hiddentext"> </p>
    <div class ="input_div">
      <p> player id: </p>
    	<label>
          <input type="text" name="username" placeholder="player id" bind:value={playerid}>
      </label>
    </div>
    <div class ="input_div">
      <p> password: </p>
    	<label>
          <input type="password" name="password" placeholder="password" bind:value={password} on:input={visible?check_password_constraints(password, repeat_password):''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
      </label>
    </div>
    {#if visible}
      <div class ="input_div">
        <p> retype password: </p>
        <label>
            <input type="password" name="password" placeholder="retype your password" bind:value={repeat_password} on:input={visible?check_password_constraints(password, repeat_password):''} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
        </label>
      </div>
      <div class = "pw_constraints_div">
        <p id="pw_upper_lower" style="color: #DD6539;"> contains upper and lowercase letters </p> <!-- red -->
        <p id="pw_numbers" style="color: #DD6539;"> contains numbers </p>
        <p id="pw_symbols" style="color: #DD6539;"> contains symbols </p>
        <p id="pw_len" style="color: #DD6539;"> length is between is between 10 and 30 characters </p>
        <p id="pw_repeat_match" style="color: #DD6539;"> passwords match </p>
      </div>
      <div class = "input_div">
        <p> email address: </p>
        <label>
            <input type="email" name="email" placeholder="email address" bind:value={email} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
        </label>
        <br>
      </div>
    {/if}
  	<!-- <form action="?" method="POST"> -->
          <!--look into data callback function for recaptcha: data-callback="function"-->
          <div id="recaptcha" class="g-recaptcha" data-sitekey="6Let39YUAAAAACzwA-hE3mbCstRaQdJC52E0l4iP"></div>
    <!-- </form> -->
    {#if !visible}
    <div class ="input_div">
      <p> multifactor key: </p>
      <label>
          <input type="text" name="input_totp" placeholder="6 digit multifactor key" bind:value={input_totp} onCopy="return false;" onCut="return false;" onDrag="return false;" autocomplete=off >
      </label>
    </div>
    {/if}
    <div class="landbtn_div">
      {#if !visible}
        <button class="landbtn" on:click={toggle_visible}> sign up </button>
      	<button class="landbtn" on:click={click_login}> log in </button>
      {:else}
        <button class="landbtn" on:click={toggle_visible}> go back </button>
        <button class="landbtn" on:click={click_signup}> make my account </button>
      {/if}
    </div>

    {#if !visible}
      <div class="container">
      <div class="row">
      <div class="col-sm">
        <button class="btn btn-outline-secondary btn-sm" data-forgot-type="playerid" data-toggle="modal" data-target="#forgotModal" on:click={click_modal_toggler}>Forgot playerid</button>
        <button class="btn btn-outline-secondary btn-sm" data-forgot-type="password" data-toggle="modal" data-target="#forgotModal" on:click={click_modal_toggler}>Forgot password</button>
      </div>
      </div>
      </div>
    {/if}

  </div> <!-- end entire_input_form -->
</main>

<style>
  p {
    font-family: Quicksand;
    font-style: normal;
    font-weight: normal;
  }

	main {
		text-align: left;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	#gamename {
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

  #forgetSendButton {
    height: 38px;
    width: 74px;
  }

  #entire_input_form {
    position: absolute;
    margin-top: 5%;
    margin-left: 35%;
    display: flex;
    flex-flow: column nowrap;
  }

  #hiddentext {
    position: relative;
    font-size: 30px;
    text-align: center;
    margin: 0px 0px 10px 0px;
  }

  .input_div { /* child items are .input_label and .input_box */
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    float: right;
  }

	.input_div p { /* labels for input boxes */
    display: flex;
    justify-content: flex-end;

		width: 127px;
		height: 38px;
		font-size: 30px;
    white-space: nowrap;

		color: #000000;
    margin: 23px 20px 23px 0px;
	}

	.input_div input { /* input boxes */
		font-family: Quicksand;
		font-style: normal;
		font-weight: normal;

		width: 650px;
		height: 40px;
    margin: 0px 120px 0px 0px;

		background: #FFFFFF;
		border: 1px solid #000000;
		border-radius: 15px;

	}

  .pw_constraints_div { /* block of constraints */
    display: flex;
    flex-flow: column nowrap;
    position: relative;
    margin-left: 17%;
  }

  .pw_constraints_div p { /* individual constraints */
    font-size: 20px;
    line-height: 23px;
    flex-basis: content;
    margin: 0px 0px 0px 0px;
  }

	#recaptcha {
    display: table;
    position: relative;
    margin: 0 auto;
	}

  .landbtn_div {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
  }

	.landbtn {
	  width: 300px;
		height: 40px;

    margin: 15px 60px;

		background: #AEC2DC; /* light blue */
		border-radius: 15px;
		cursor: pointer;

    font-family: Quicksand;
		font-style: normal;
		font-weight: normal;
		font-size: 20px;
    color: black; /* font color */
  }

  .landbtn:hover {
    background: #7E9DC7; /* dark blue */
    color: white; /* font color */
  }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
