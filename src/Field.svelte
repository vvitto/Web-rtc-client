<script>
    export let label;
    export let field;
    export let type = 'text';
</script>
<style>
    .field {
        width: 100%;
    }

    .input {
        width: 100%;
    }   

</style>

<div class='field'>
    <label for={field}>{label}</label>
    <input type='text' class='input' name={label} on:change>
</div>