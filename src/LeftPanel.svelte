<script>
    import CallTab from './CallTab.svelte';
    import ConfigTab from './ConfigTab.svelte';

    let activeTab = 0;

    function setActiveTab(number) {
        activeTab = number;
    }

    $: { console.log(activeTab); }

    let tabs = [{
        name: 'Call'
    }, {
        name: 'Config'
    }];
</script>

<style>
    .left-panel {
        display: flex;
        flex-direction: column;
        width: 30%;
    }

    .tabs {
        display: flex;
        position: relative;
        z-index: 3;
    }

    .tab {
        position: relative;
        padding:  10px 15px;
        background-color: #fff;
        border: solid 1px #000;
        border-bottom: 0;
        cursor: pointer;
        transition: background-color 200ms;
    }

    .tab:first-child {
        border-right: 0;
    }

    .tab:hover {
        background-color: #e1e1e1;
    }

    .active:after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 3px;
        background-color: #fff;
    }

    .panel {
        padding: 20px;
        border: solid 1px #000;
    }
</style>

<div class='left-panel'>
    <div class="tabs">
        {#each tabs as { name }, index}
            <div 
                class={`tab ${index === activeTab? 'active' : ''}`}
                on:click={() => setActiveTab(index)}
            >
                {name}
            </div>
        {/each}
    </div>

    <div class="panel">
        {#if activeTab == 0}
            <CallTab/>
        {:else if activeTab == 1}
            <ConfigTab />
        {/if}
    </div>
</div>