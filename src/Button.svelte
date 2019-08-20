<script>
    export let callback = () => false;
    export let disabled = false;
    export let text = 'click';

    console.log(text);
</script>

<style>
    .btn {
        display: flex;
        padding: 5;
        width: 100%;
        cursor: pointer;
    }
</style>

<button class='btn' on:click={callback} disabled={disabled} on:click>
    {text}
</button>