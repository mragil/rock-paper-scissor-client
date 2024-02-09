<script lang="ts">
	export let minRange: number;
	export let maxRange: number;
	let numberGuessed: number;
	export let sendGuess: (guess: number) => void;
</script>

<div
	class="flex items-center justify-center gap-5 overflow-hidden"
>
	<input
		type="number"
		name="number-guessed"
		min={minRange + 1}
		max={maxRange - 1}
		bind:value={numberGuessed}
	/>
	<button on:click={() => sendGuess(numberGuessed)}>Guess</button>
</div>
