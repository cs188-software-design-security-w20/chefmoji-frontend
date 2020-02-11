<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style> /* this pushes all elements to the side, which we don't want */
/*
	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
	*/
</style>

<Nav {segment}/>

<main>
	<slot></slot>
</main>
