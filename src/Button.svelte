<script>
    export let callback = () => false;
    export let disabled = false;
    export let text = 'click';
</script>

<style>
    .btn {
        display: flex;
        padding: 5;
        width: 100%;
    }
</style>

<button class='btn' on:click={callback} disabled={disabled} on:click>
    {text}
</button>