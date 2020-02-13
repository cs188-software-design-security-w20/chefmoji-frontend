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
	import { MapUpdate, OrderType, PlayerUpdate, OrderUpdate, PlayerAction } from './proto/messages.js';
	import chefmoji from './proto/messages.js';
	console.log(chefmoji);

	const socket = io('http://localhost:5000');

	const TEST_GAME_SESSION = '1aLc90';

	socket.on('connect', () => {
		console.log(socket.id);
	});

	socket.on('accepting-connections', () => {
		console.log('Server has notified me that it\'s accepting connections. Time to join the game!');
		socket.emit('join-req', new Map([['id', TEST_GAME_SESSION]]));
	});
	let map = [];
	socket.on('tick', (data) => {
		if (data) {
			let bytes =  new Uint8Array(data);
			let decoded = MapUpdate.decode(bytes);
			map = decoded.map;
		}
	})

	const recipes = {
		'🌭' : {
			name : 'Hot Dog',
			emoji : '🌭',
			difficulty : 1,
			ingredients: [
				{
					emoji: '🍞',
					chopped: false
				},
				{
					emoji: '🥩',
					chopped: false
				}
			],
			cooked: true
		},
		'🍕' : {
			name : 'Pizza',
			emoji : '🍕',
			difficulty : 1,
			ingredients: [
				{
					emoji: '🍞',
					chopped: false
				},
				{
					emoji: '🧀',
					chopped: false
				},
				{
					emoji: '🍅',
					chopped: false
				}
			],
			cooked: true
		},
		'🧇' : {
			name : 'Waffles',
			emoji : '🧇',
			difficulty : 1,
			ingredients: [
				{
					emoji: '🥛',
					chopped: false
				},
				{
					emoji: '🥚',
					chopped: false
				},
				{
					emoji: '🌾',
					chopped: false
				}
			],
			cooked: true
		},
		'🍔' : {
			name : 'Hamburger',
			emoji : '🍔',
			difficulty : 3,
			ingredients: [
				{
					emoji: '🍞',
					chopped: false
				},
				{
					emoji: '🧀',
					chopped: false
				},
				{
					emoji: '🥩',
					chopped: false
				},
				{
					emoji: '🥬',
					chopped: true
				},
				{
					emoji: '🍅',
					chopped: true
				},
				{
					emoji: '🧅',
					chopped: true
				}

			],
			cooked: true
		},
	}

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
		let game_id = TEST_GAME_SESSION;
		// Purely to prevent well meaning actors to unnecessarily send key events across the connection
		if (validKey(key)) {
			console.log(key);
			let keyPressMsg = PlayerAction.create({ keyPress : key});
			console.log(keyPressMsg)
			let bytes = PlayerAction.encode(keyPressMsg).finish();
			console.log(bytes);
			socket.emit('keypress', bytes, game_id);
		}
	}

	function validKey(key){
		return ['w', 'a', 's', 'd', 'e', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(key)
	}

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
	
</script>

<svelte:window on:keydown={handleKeydown}/>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Indie+Flower&display=swap" rel="stylesheet">
</svelte:head>


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
