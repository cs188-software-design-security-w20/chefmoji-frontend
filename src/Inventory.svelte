<style>
    :root {
        --variant-font-size-13: 12px;
        --slot-color: rgb(233, 220, 202);
        --slot-height: 56px;
        --slot-width: 48px;
    }

    .inventory-wrapper {
        font-size: 36px;
        margin: 0 10px 0 10px;
        display: flex;
        flex-direction: row;
    }

    .player {
        margin-right: 5px;
    }

    .inventory-item-wrapper {
        border: 2px solid black;
        background-color: var(--slot-color);
        height: var(--slot-height);
        width: var(--slot-width);
        position: relative;
    }

    .inventory-item {
        font-size: 32px;
        line-height: 32px;
        display: flex;
        flex-direction: column;
        /* position: relative; */
    }
    
    .variant {
        font-size: var(--variant-font-size-13);
        margin: 0;
        /* position: absolute; */
        /* left: 0; */
        /* bottom: 0; */
    }

    .plated {
        font-size: var(--variant-font-size-13);
        margin: 0;
        /* position: absolute; */
        /* left: 0; */
        /* top: 0; */
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
                <span class="plated">
                    {#if inventory.plated}
                        plated
                    {/if}
                </span>
                {inventory.item}
                <span class='variant'>
                    {#if inventory.chopped}
                        chopped
                    {:else if inventory.cooked}
                        cooked
                    {:else}
                        <script></script>
                    {/if}
                </span>
            </div>
        {/if}
    </div>
</div>