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

    .inventory-item-wrapper {
        border: 2px solid black;
        background-color: rgb(196, 173, 139);
        height: 44px;
        width: 44px;
        position: relative;
        padding-bottom: 5px;
    }

    .inventory-item {
        font-size: 32px;
        position: relative;
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
    <div class="inventory-item-wrapper">
        {#if inventory}
            <div class="inventory-item">
                {inventory.item}
                <span class='variant'>
                    {#if inventory.chopped}
                        chopped
                        <script>
                            console.log("CHOPPED!!!!");
                        </script>
                    {:else if inventory.plated}
                        plated
                        <script>
                            console.log("PLATED!!!!");
                        </script>
                    {:else if inventory.cooked}
                        cooked
                        <script>
                            console.log("COOKED!!!!");
                        </script>
                    {:else}
                        <script></script>
                    {/if}
                </span>
            </div>
        {/if}
    </div>
</div>