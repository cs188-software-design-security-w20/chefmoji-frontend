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
	const WALL = '#000';
	const TABLE = '#ecb476';
	const FLOOR = '#fff';
	const FRIDGE = '#75c3d1';
	

	let map = [
		[{type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {emoji: '🧈', type: FRIDGE}, {type: FRIDGE}, {emoji: '🥚', type: FRIDGE}, {type: FRIDGE}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: TABLE}, {emoji: '🚰', type: TABLE}, {type: TABLE}, {emoji: '♨️', type: TABLE}, {type: TABLE}, {type: TABLE}, {emoji: '🔪', type: TABLE}, {type: TABLE}, {type: TABLE}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {emoji: '🥛', type: FRIDGE}, {type: WALL}, {emoji: '🌾', type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {emoji: '🥕', type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {emoji: '🧀', type: FRIDGE}, {type: WALL}, {emoji: '🍚', type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {emoji: '🥬', type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {emoji: '➡️', type: TABLE}, {emoji: '➡️', type: WALL}],
		[{type: WALL}, {emoji: '🍅', type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {emoji: '🥩', type: FRIDGE}, {type: WALL}, {emoji: '🍞', type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {emoji: '🐟', type: FRIDGE}, {type: WALL}, {emoji: '🧅', type: TABLE}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: FLOOR}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: FRIDGE}, {type: FRIDGE}, {type: FRIDGE}, {emoji: '🐖', type: FRIDGE}, {type: FRIDGE}, {type: FRIDGE}, {type: WALL}, {type: TABLE}, {type: TABLE}, {emoji: '🥔', type: TABLE}, {type: TABLE}, {emoji: '🧄', type: TABLE}, {type: TABLE}, {type: TABLE}, {emoji: '🍽️', type: TABLE}, {type: TABLE}, {type: TABLE}, {type: TABLE}, {type: WALL}],
		[{type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}, {type: WALL}]
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
		if (key == 'w' || key == 
				'ArrowUp') { 
			// UP
			if (map[player.r - 1][player.c].type == FLOOR) {
				map[player.r][player.c].emoji = '';
				player.r -= 1;
				movePlayer(player)
			}
		} else if (key == 'a' || key == 
				'ArrowLeft') {
			// LEFT
			if (map[player.r][player.c - 1].type == FLOOR) {
				map[player.r][player.c].emoji = '';
				player.c -= 1;
				movePlayer(player)
			}
		} else if (key == 's' || key == 
				'ArrowDown') {
			// DOWN
			if (map[player.r + 1][player.c].type == FLOOR) {
				map[player.r][player.c].emoji = '';
				player.r += 1;
				movePlayer(player)
			}
		} else if (key == 'd' || key == 
				'ArrowRight') {
			// RIGHT
			if (map[player.r][player.c + 1].type == FLOOR) {
				map[player.r][player.c].emoji = '';
				player.c += 1;
				movePlayer(player)
			}
		}
	}
	
	function movePlayer(p) {
		map[p.r][p.c].emoji = p.emoji;
	}
	
</script>

<svelte:window on:keydown={handleKeydown}/>

<table>
	{#each map as row}
		<tr>
			{#each row as cell}
				<td style='background-color: {cell.type}'>
					{#if cell.emoji}
						{cell.emoji}
					{/if}
				</td>
			{/each}
		</tr>
	{/each}
</table>
