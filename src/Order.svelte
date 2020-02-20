<style>
    :root {
        --variant-font-size-13: 12px;
        --variant-font-size-24: 12px;
    }

    .item {
        font-size: 32px;
        position: relative;
    }
    .ingredient {
        width: 16.66%;
        font-size: 32px;
        position: relative;
    }
    .order-wrapper {
        display: flex;
        flex-direction: row;
    }
    .content-wrapper {
        margin: 10px;
        display: flex;
        flex-direction: column;
    }
    .ingredients {
        display: flex;
        background-color: bisque;
        border-radius: 0 0 5px 5px;
        padding-bottom: 5px;
    }
    .variant {
        font-size: var(--variant-font-size-13);
        position: absolute;
        left: 0;
        bottom: 0;
    }
    .cooked-wrapper {
        width: 75%;
        border-radius: 5px;
        font-size: var(--variant-font-size-13);
        background-color: #f5905d;
    }
    .top-wrapper {
        width: 12.5%;
        border-radius: 5px;
        font-size: var(--variant-font-size-13);
    }
</style>

<script>
    export let order;
    export let ttl;
    console.log(order);

    function getTTLStyle(ttl){
        if(ttl > 10){
            return '#339933';
        }
        else if(ttl > 5){
            return '#e6e600';
        }
        else {
            return '#e62e00';
        }
    }
    function getTTLWidth(ttl) {
        return ttl/20 + '%';
    }
</script>

<div class='content-wrapper'>
    <div class='order-wrapper'>
        <div class='cooked-wrapper'>
            {#if order.cooked}
                Cooked
            {/if}
            <div class='ingredients'>
                {#each order.ingredients as ingredient}
                    <div class='ingredient'>
                        {ingredient.emoji}
                        {#if ingredient.chopped}
                            <span class='variant'>
                            chopped
                            </span>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>  
        <div class="top-wrapper">
            ‎
            <div class='item'>
                👉🏼
            </div>
        </div>
        <div class='top-wrapper' style='background-color: rgb(150, 214, 150)'>
            Plated
            <div class='item'>
                {order.emoji}
            </div>
        </div>
    </div>
    <div class='timer' style={`color: ${getTTLStyle(ttl)}; width: ${getTTLWidth(ttl)};`} >
        {ttl}
    </div>
</div>