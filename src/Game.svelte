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

	.inventories {
		background-color: lightsteelblue;
		font-family: 'Indie Flower', cursive;
		text-align: center;
		margin-right: 8px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.player-item-pair {
		display: flex;
		justify-content: center;
	}
</style>

<script>
	import Order from './Order.svelte';
	import Inventory from './Inventory.svelte';
	import io from '../node_modules/socket.io-client/dist/socket.io.js';
	import {recipes} from './recipes.js';
	import { MapUpdate, OrderType, PlayerUpdate, OrderUpdate, PlayerAction } from './proto/messages.js';
	import chefmoji from './proto/messages.js';

	export let session_key = '';
	export let game_id = '';
	export let socket;
	export let cookbook = {};


	let ticked = false;
	let map = [];
	let players = [];

	// TODO: CHANGE FOR PRODUCTION
	const ADDR = 'http://localhost:8080';

	socket.on('tick', (data) => {
		if (data) {
			ticked = true;
			let bytes =  new Uint8Array(data);
			let decoded = MapUpdate.decode(bytes);
			map = decoded.map;
			players = decoded.players;
		}
	});

	let orders = {};

	socket.on('order', (data) => {
		if (data) {
			let bytes =  new Uint8Array(data);
			let decoded = OrderUpdate.decode(bytes);
			// console.log(bytes);
			// console.log(decoded);
			if (!decoded.fulfilled) {
				// At current, allow no updates
				if (!orders.hasOwnProperty(`${decoded.uid}`)){
					orders[`${decoded.uid}`] = {ttl: ORDER_TTL, emoji: EmojiFromOrderEnum(decoded.orderType)};
				}

				let orderCountdownHandler = undefined;
				orderCountdownHandler = setInterval(function(uid){
					let ttl = orders[`${uid}`].ttl;
					orders[`${uid}`] = {...orders[`${uid}`], ttl: ttl-1};
					if (orders[`${uid}`].ttl <= 0){
						delete orders[`${uid}`]
						if (orderCountdownHandler !== undefined){
							clearInterval(orderCountdownHandler);
						}
					}
					orders = {...orders};
				}, 1000, decoded.uid);
			}
		}
	});

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
		{#each Object.values(orders) as order}
			<Order order={cookbook[order.emoji]} ttl={order.ttl}/>
		{/each}
	</div>

	<div class='inventories'>
		<h1>Inventories</h1>
		<div class='player-item-pair'>
			{#each players as player}
				<Inventory emoji={player.emoji} inventory={player.inventory}/>
			{/each}
		</div>
	</div>
</div>
{/if}
