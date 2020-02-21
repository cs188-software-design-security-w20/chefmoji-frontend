<style>
    :root {
        --variant-font-size-13: 12px;
        --slot-font-size-13: 32px;
        --variant-font-size-24: 12px;
    }
    .station-slots {
        display: flex;
        flex-direction: row;
        font-size: var(--variant-font-size-13);
        margin: auto;
    }
    .slot {
        position: relative;
        font-size: var(--slot-font-size-13);
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

    /* table, tr, td {
        border: 1px solid black;
    } */
</style>

<script>
    export let slots;
    console.log(slots);
</script>

<table class='station-slots'>
    <tr>
        {#each slots as item}
            <td class='slot'>
                {item.item}
                <span class='variant'>
                    {#if item.chopped}
                        chopped
                    {:else if item.cooked}
                        cooked
                    {/if}
                </span>
            </td>
        {/each}
    </tr>    
</table>