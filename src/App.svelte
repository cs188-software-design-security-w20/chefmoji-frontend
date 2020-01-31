<style>
	td {
		width: 40px;
		line-height: 40px;
		height: 40px;
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

	const socket = io('http://localhost:5000');

	socket.on('connect', () => {
		console.log(socket.id);
	});

	socket.on('accepting-connections', () => {
		console.log('Server has notified me that it\'s accepting connections. Time to join the game!');
		socket.emit('join-req', new Map([['id', '1aLc90']]));
	});

	socket.on('tick', (data) => {
		console.log(data);
	})

	const WALL = '#000';
	const TABLE = '#ecb476';
	const FLOOR = '#fff';
	const FRIDGE = '#75c3d1';
	

	let map = [
		[{emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '🧈', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '🥚', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '🚰', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '♨️', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '🔪', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '🥛', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '🌾', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '🥕', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '🧀', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '🍚', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '🥬', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '➡️', type: TABLE}, {emoji: '➡️', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '🍅', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '🥩', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '🍞', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '🐟', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '🧅', type: TABLE}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: FLOOR}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '🐖', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '', type: FRIDGE}, {emoji: '', type: WALL}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '🥔', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '🧄', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '🍽️', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: TABLE}, {emoji: '', type: WALL}],
		[{emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}, {emoji: '', type: WALL}]
	];
	
	class Player {
		constructor(r, c, emoji) {
			this.r = r;
			this.c = c;
			this.emoji = emoji;
		}
	}
	
	let player = new Player(2, 3, '🧠');
	movePlayer(player);
	
	let key;

	function handleKeydown(event) {
		key = event.key;
		// Purely to prevent well meaning actors to unnecessarily key events across the connection
		if(validKey(key)){
			socket.emit('key', key, game_id);
		}
	}

	function validKey(key){
		return ['w', 'a', 's', 'd', 'e', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(key)
	}
	
	function movePlayer(p) {
		map[p.r][p.c].emoji = p.emoji;
	}
	
</script>

<svelte:window on:keydown={handleKeydown}/>

<table>
	{#each map as row}
		<tr>
			{#each row as {emoji, type}}
				<td style='background-color: {type}'>
					{emoji}
				</td>
			{/each}
		</tr>
	{/each}
</table>