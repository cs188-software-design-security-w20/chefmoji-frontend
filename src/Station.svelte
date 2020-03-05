<style>
    :root {
        --variant-font-size-13: 12px;
        --slot-font-size-13: 32px;
        --variant-font-size-24: 12px;
        --slot-color: rgb(233, 220, 202);
    }
    .station-slots {
        display: flex;
        flex-direction: row;
        justify-content: center;
        font-size: var(--variant-font-size-13);
        margin-bottom: 8px;
    }
    .slot {
        position: relative;
        font-size: var(--slot-font-size-13);
        border: 2px solid black;
        background-color: var(--slot-color);
        height: 50px;
        width: 45px;
    }
    .variant {
        font-size: var(--variant-font-size-13);
        position: absolute;
        left: 0;
        bottom: 0;
    }

    table {
        border-collapse: collapse;
    }

</style>

<script>
    export let slots;
</script>

<table class='station-slots'>
    <tr>
        {#each slots as item}
            <td class='slot'>
                {#if item.item}
                    {item.item}
                {/if}                
                <span class='variant'>
                    {#if item.chopped}
                        chopped
                    {:else if item.cooked}
                        cooked
                    {/if}
                </span>
            </td>
        {/each}
        {#each Array(5-slots.length) as _}
            <td class='slot'>
            </td>
        {/each}
    </tr>    
</table>