<style>
	:root {
		--main-unit-dim: 45px;
	}
	td {
		width: var(--main-unit-dim);
		line-height: var(--main-unit-dim);
		height: var(--main-unit-dim);
		font-size: calc(var(--main-unit-dim) - 4px);
		padding: 0;
		margin: 0;
	}
	table {
		border-spacing: 0;
	}
	.orders {
		background-color: lightsteelblue;
		width: 30%;
		height: calc(100vh - 16px);
		float: right;
		font-family: 'Indie Flower', cursive;
		text-align: center;
	}

	.map {
		display: inline-block;
	}
</style>

<script>
	import Order from './Order.svelte';
	import io from '../node_modules/socket.io-client/dist/socket.io.js';
	import {recipes} from './recipes.js';
	import { MapUpdate, OrderType, PlayerUpdate, OrderUpdate, PlayerAction } from './proto/messages.js';
	import chefmoji from './proto/messages.js';

	export let session_key = '';
	export let game_id = '';
	export let socket;

	let ticked = false;
	let map = [];
	const ADDR = 'http://localhost:8080';

	socket.on('issue-id', (issued_id) => {
		console.log("Issued id: " + issued_id);
		session_key = issued_id;
	});

	socket.on('tick', (data) => {
		if (data) {
			ticked = true;
			let bytes =  new Uint8Array(data);
			let decoded = MapUpdate.decode(bytes);
			map = decoded.map;
		}
	});

	let orders = ['🍔', '🧇'];

	const WALL = '#000';
	const TABLE = '#ecb476';
	const FLOOR = '#fff';
	const FRIDGE = '#75c3d1';
	
	class Player {
		constructor(r, c, emoji) {
			this.r = r;
			this.c = c;
			this.emoji = emoji;
		}
	}

	function handleKeydown(event) {
		let key = event.key;
		// Purely to prevent well meaning actors from unnecessarily sending key events across the connection
		if (validKey(key)) {
			let keyPressMsg = PlayerAction.create({ keyPress : key});
			let bytes = PlayerAction.encode(keyPressMsg).finish();
			socket.emit('keypress', bytes, session_key, game_id);
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
			case 'G':
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
		socket.emit('play', session_key, game_id);
	}
	
</script>

<svelte:window on:keydown={handleKeydown}/>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Indie+Flower&display=swap" rel="stylesheet">
</svelte:head>

{#if (game_id != '' && !ticked)}
	<button on:click={playGame}>
		Play game!
	</button>
{/if}

{#if (game_id != '' && ticked)}
<div class='content'>
	<div class='map'>
		<table>
			{#each map as map_row}
				<tr>
					{#each map_row.row as cell}
						<td style='background-color: {cellToColor(cell.charAt(0))}'>
							{cell.slice(1)}
						</td>
					{/each}
				</tr>
			{/each}
		</table>
	</div>
	
	<div class='orders'>
		<h1>Orders</h1>
		{#each orders as order}
			<Order order={recipes[order]}/>
		{/each}
	</div>
</div>
{/if}