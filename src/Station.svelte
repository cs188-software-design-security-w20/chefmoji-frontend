<style>
    .stove-slots {
        display: flex;
        flex-direction: row;
    }
</style>

<script>
    export let slots;
    console.log(slots);
</script>

<div class='stove-slots'>
    {#each slots as item}
        {item.item}
    {/each}
</div>