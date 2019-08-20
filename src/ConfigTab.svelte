<script>
    import Button from './Button.svelte';
    import Field from './Field.svelte';

    function hangeFieldOnСhange(field, value) {
        
    }

</script>

<div>
    <Field 
        label='WS server' 
        field='ws_server'
        on:change={hangeFieldOnСhange}
    />

    <Field 
        label='Stun server' 
        field='stun_server'
        on:change={hangeFieldOnСhange}
    />

    <Field 
        label='URI' 
        field='uri'
        on:change={hangeFieldOnСhange}
    />

    <Field 
        label='Password' 
        field='password'
        on:change={hangeFieldOnСhange}
    />

    <Field 
        label='Number' 
        field='number'
        on:change={hangeFieldOnСhange}
    />

    <Button text='Save' />
</div> 