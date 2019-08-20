<script>
    import Button from './Button.svelte';
</script>

<style>
    .logger-wrapper {
        display: flex;
        width: 70%;
        flex-direction: column;
        margin-left: 10px;
    }
    .logger {
        display: flex;
        width: 100%;
        height: 100%;
        
        border: solid 1px #000;
    }

    .logger-btn {
        width: 100px;
    }

    .incoming,
    .outgoing {
        display: flex;
        width: 50%;
        height: 100%;
    }

    .incoming {
        border-right: solid 1px #000;
    }
</style>

<div class='logger-wrapper'>
    <div class='logger-btn'>
        <Button text='Clear' />
    </div>
    <div class='logger'>
        <div class='incoming'>
        
        </div>

        <div class='outgoing'>

        </div>
    </div>
</div>