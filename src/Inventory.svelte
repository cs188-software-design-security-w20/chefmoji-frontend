<style>
    .inventory-wrapper {
        font-size: 36px;
        display: flex;
        flex-direction: row;
    }
    .inventory-item {
        border: 2px solid black;
        background-color: rgb(196, 173, 139);
        height: 36px;
        width: 36px;
    }
</style>

<script>
    export let emoji;
    export let inventory;
</script>

<div class='inventory-wrapper'>
    <div class="player">
        {emoji}
    </div>
    <div class="inventory-item">
        {#if inventory}
            {inventory.item}
        {/if}
    </div>
</div>