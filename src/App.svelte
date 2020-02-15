<style>
	:root {
		--main-unit-dim: 40px;
	}
	td {
		width: var(--main-unit-dim);
		line-height: var(--main-unit-dim);
		height: var(--main-unit-dim);
		font-size: 36px;
		padding: 0;
		margin: 0;
	}
	table {
		border-spacing: 0;
	}
</style>

<script>	
	import io from '../node_modules/socket.io-client/dist/socket.io.js';
	const ADDR = 'http://localhost:8080';
	const socket = io(ADDR, { transports: ['websocket'] });

	let uid = '';
	let game_id = '';
	let ticked = false;

	socket.on('issue-id', (issued_id) => {
		console.log("Issued id: " + issued_id);
		uid = issued_id;
	});

	socket.on('connect', () => {
		console.log("CONNECTED");
		socket.emit('test');
		fetch(ADDR+'/issue-id').then(()=>{
			return fetch(ADDR+'/create-game')
		}).then(()=>{
			console.log('game created server-side!')
		}).catch((error) => {
			console.error(error);
		});
	});

	socket.on('session-init', (generated_game_id) => {
		game_id = generated_game_id;
		console.log("GAME ID: " + game_id);
		socket.emit('join-game-with-id', game_id, uid);
	});

	socket.on('tick', (data) => {
		ticked = true;
		if (data.map){
			data.map.forEach(row => {
			console.log(row);
		});
			map = data.map;
		}
	})

	const WALL = '#000';
	const TABLE = '#ecb476';
	const FLOOR = '#fff';
	const FRIDGE = '#75c3d1';
	
	let map;
	
	class Player {
		constructor(r, c, emoji) {
			this.r = r;
			this.c = c;
			this.emoji = emoji;
		}
	}

	function handleKeydown(event) {
		let key = event.key;
		// Purely to prevent well meaning actors to unnecessarily send key events across the connection
		if(game_id && validKey(key)){
			console.log(key);
			socket.emit('keypress', key, uid, game_id);
		}
	}

	function validKey(key){
		return ['w', 'a', 's', 'd', 'e', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(key)
	}

	// These cell functions are temporary logic as we figure out how to implement protobuf readings in JS
	function cellToColor(cell){
		switch (cell){
			case 'W':
				return WALL;
			case 'F':
				return FRIDGE;
			case 'T':
				return TABLE;
			case ' ':
				return FLOOR;
		}
	}

	function cellToEmoji(cell){
		switch (cell){
			case 'r':
				return '🚰'
			case 'T':
			case ' ':
			case 'W':
			case 'F':
				return ' '
			case '0':
				return '♨️'
			case 'K':
				return '🔪'
			default:
				return cell
		}
	}

	function playGame(){
		socket.emit('play', uid, game_id);
		ticked = true;
	}
	
</script>

<svelte:window on:keydown={handleKeydown}/>

<h1>Chefmoji!</h1>

{#if (uid)}
<h2>With <strong>player id:</strong> {uid}</h2>
{/if}

{#if (game_id)}
<h2>With <strong>game id:</strong> {game_id} </h2>
{/if}

{#if (!ticked)}
	<button on:click={playGame}>Play Game!</button>
{/if}

{#if map}
	<table>
		{#each map as row}
			<tr>
				{#each row as cell}
					<td style='background-color: {cellToColor(cell)}'>
						{#if cell}
							{cellToEmoji(cell)}
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</table>
{/if}
