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
	import { MapUpdate, OrderType, PlayerUpdate, OrderUpdate, PlayerAction } from './proto/messages.js';
	import chefmoji from './proto/messages.js';
	console.log(chefmoji);

	let map = [];
	// let map = [
	// 	['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
	// 	['W','F','F🧈','F','F🥚','F','F','W','T','T','T🚰','T','T♨️','T','T','T🔪','T','T','T','W'],
	// 	['W','F','G','G','G','G','F🥛','W','T🌾','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F🥕','G','G','G','G','F','W','T','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','G','G','G','G','F🧀','W','T🍚','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F🥬','G','G','G','G','F','W','T','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G','G➡️','G➡️'],
	// 	['W','F🍅','G','G','G','G','F','W','T','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','G','G','G','G','F🥩','W','T🍞','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','G','G','G','G','F','W','T','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','G','G','G','G','F🐟','W','T🧅','G','G','G','G','G','G','G','G','G','T','W'],
	// 	['W','F','F','F','F🐖','F','F','W','T','T','T🥔','T','T🧄','T','T','T🍽️','T','T','T','W'],
	// 	['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
	// ];
	

	const socket = io('http://localhost:5000');

	const TEST_GAME_SESSION = '1aLc90';

	socket.on('connect', () => {
		console.log(socket.id);
	});

	socket.on('accepting-connections', () => {
		console.log('Server has notified me that it\'s accepting connections. Time to join the game!');
		socket.emit('join-req', new Map([['id', TEST_GAME_SESSION]]));
	});

	socket.on('tick', (data) => {
		if (data){
			console.log(data)
			let bytes =  new Uint8Array(data);
			console.log(bytes);
			let decoded = MapUpdate.decode(bytes);
			console.log(decoded);
			map = decoded.map;
		}
	})

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
		if(validKey(key)){
			console.log(key);
			let keyPress = PlayerAction.create({ key_press : key});
			socket.emit('keypress', keyPress, game_id);
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

<table>
	{#each map as row}
		<tr>
			{#each row.row as cell}
				<td style='background-color: {cellToColor(cell.charAt(0))}'>
					{#if cell}
						{cell.slice(1)}
					{/if}
				</td>
			{/each}
		</tr>
	{/each}
</table>
