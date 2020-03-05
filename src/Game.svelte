<style>
	:root {
		--main-unit-dim: 45px;
		--ui-color: lightblue;
	}
	td {
		width: var(--main-unit-dim);
		line-height: var(--main-unit-dim);
		height: var(--main-unit-dim);
		font-size: calc(var(--main-unit-dim) - 4px);
		padding: 0;
		margin: 0;
	}
	h2 {
		margin: 0;
	}
	table {
		border-spacing: 0;
	}
	.content {
		display: flex;
		flex-direction: column;
	}

	/* TOP HALF */
	.top-content {
		height: 80%;
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	.left-content {
		display: flex;
		flex-direction: column;
		width: 70%;
		margin-right: 8px;
	}
	.top {
		width: 100%;
		font-size: 32px;
		font-family: 'Quicksand';
	}
	.map {
		display: inline-block;
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none;
	}
	.orders {
		background-color: var(--ui-color);
		width: 30%;
		height: 100%;
		font-family: 'Quicksand';
		text-align: center;
	}


	.inventories {
		background-color: var(--ui-color);
		font-family: 'Quicksand';
		text-align: center;
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: 30%;
	}
	.inventory-slots {
		display: flex;
		flex-direction: row;
		margin-bottom: 8px;
	}
	.bottom-content {
		width: 100vw;
		display: flex;
		flex-direction: row;
	}	
	.station {
		background-color: var(--ui-color);
		width: 100%;
		font-family: 'Quicksand';
		text-align: center;
		margin-top: 8px;
	}
	.stations {
		display: flex;
		flex-direction: row;
		width: 70%;
		margin-right: 8px;
	}
</style>

<script>
	import Order from './Order.svelte';
	import Inventory from './Inventory.svelte';
	import Station from './Station.svelte';
	import io from '../node_modules/socket.io-client/dist/socket.io.js';
	import {recipes, OrderTypeEnum, EmojiFromOrderEnum, ORDER_TTL} from './recipes.js';
	import { MapUpdate, OrderUpdate, PlayerAction, StationUpdate } from './proto/messages.js';
	import chefmoji from './proto/messages.js';

	export let session_key = '';
	export let game_id = '';
	export let socket;
	export let cookbook = {};

	let ticked = false;
	let map = [];
	let players = [];
	let stove = [];
	let platingStation = [];
	let points = 0;

	socket.on('tick', (data) => {
		if (data) {
			ticked = true;
			let bytes =  new Uint8Array(data);
			let decoded = MapUpdate.decode(bytes);
			map = decoded.map;
			players = decoded.players;
		}
	});

	socket.on('recipes', (data) => {
		if (data) {
			cookbook = data.cookbook;
		}
	});

	socket.on('stove-update', (data) => {
		if (data) {
			let bytes =  new Uint8Array(data);
			let decoded = StationUpdate.decode(bytes);
			stove = decoded.slots;
		}
	});

	socket.on('plating-update', (data) => {
		if (data) {
			let bytes =  new Uint8Array(data);
			let decoded = StationUpdate.decode(bytes);
			platingStation = decoded.slots;
		}
	});

	let orders = {};

	socket.on('order', (data) => {
		if (data) {
			let bytes =  new Uint8Array(data);
			let decoded = OrderUpdate.decode(bytes);
			let orderCountdownHandler = undefined;
			if (!decoded.fulfilled) {
				// At current, allow no updates
				if (!orders.hasOwnProperty(`${decoded.uid}`)){
					orders[`${decoded.uid}`] = {ttl: ORDER_TTL, emoji: EmojiFromOrderEnum(decoded.orderType)};
				}
				orderCountdownHandler = setInterval(function(uid){
					let ttl = orders[`${uid}`].ttl;
					orders[`${uid}`] = {...orders[`${uid}`], ttl: ttl-1};
					if (orders[`${uid}`].ttl <= 0){
						delete orders[`${uid}`];
						if (orderCountdownHandler !== undefined){
							clearInterval(orderCountdownHandler);
						}
					}
					orders = {...orders};
				}, 1000, decoded.uid);
				orders[`${decoded.uid}`] = {...orders[`${decoded.uid}`], timer: orderCountdownHandler};
			} else {
				points = decoded.points;
				clearInterval(orders[`${decoded.uid}`].timer);
				delete orders[`${decoded.uid}`];
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
		return ['w', 'a', 's', 'd', 'e', 'q', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(key)
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

</script>

<svelte:window on:keydown={handleKeydown}/>

<svelte:head>
	<link href="https://fonts.googleapis.com/css?family=Indie+Flower&display=swap" rel="stylesheet">
</svelte:head>

{#if (game_id != '' && ticked)}
<div class='content'>
	<div class='top-content'>
		<div class='left-content'>
			<div class='top'>
				<span>👩‍🍳 chefmoji 👨‍🍳</span>
				<span style="float: right;">Points: {points}</span>
			</div>		
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
		</div>
		<div class='orders'>
			<h2>Orders</h2>
			{#each Object.values(orders) as order}
				<Order order={recipes[order.emoji]} ttl={order.ttl}/>
			{/each}
		</div>
	</div>
	
	<div class='bottom-content'>
		<div class='stations'>
			<div class='station'>
				<h2>Stove</h2>
				<Station slots={stove}/>
			</div>
			<div class='station'>
				<h2>Plating Station</h2>
				<Station slots={platingStation}/>		
			</div>
		</div>
		<div class='inventories'>
			<h2>Inventories</h2>
			<div class='inventory-slots'>
				{#each players as player}
					<Inventory emoji={player.emoji} inventory={player.inventory}/>
				{/each}
			</div>
		</div>
	</div>
</div>
{/if}
