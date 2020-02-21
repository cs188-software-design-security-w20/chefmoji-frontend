<style>
    :root {
        --variant-font-size-13: 12px;
    }

    .inventory-wrapper {
        font-size: 36px;
        display: flex;
        flex-direction: row;
    }

    .player {
        margin-right: 5px;
    }

    .inventory-item {
        border: 2px solid black;
        background-color: rgb(196, 173, 139);
        height: 36px;
        width: 36px;
    }
    
    .variant {
        font-size: var(--variant-font-size-13);
        position: absolute;
        left: 0;
        bottom: 0;
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
            <span class='variant'>
                {#if inventory.item.chopped}
                    chopped
                    <script>
                        console.log("CHOPPED!!!!");
                    </script>
                {:else}
                    <script></script>
                {/if}
                {#if inventory.item.plated}
                    plated
                    <script>
                        console.log("PLATED!!!!");
                    </script>
                {:else}
                    <script></script>
                {/if}
                {#if inventory.item.cooked}
                    cooked
                    <script>
                        console.log("COOKED!!!!");
                    </script>
                {:else}
                    <script></script>
                {/if}
            </span>
        {/if}
    </div>
</div>