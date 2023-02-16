<script>
		export let open = false;
		import { slide } from "svelte/transition";
		const handleClick = () => (open = !open);

		$: toggleButtonClass = `w-7 transform ${
		  open ? "rotate-180" : "rotate-90"
		} transition hover:scale-150`;
</script>

<div class="flex flex-col">
	<div class="flex flex-col items-start">
		<div class="w-full flex">
			<button class={toggleButtonClass} on:click={handleClick}>
				▲
			</button>
			<div class="flex-1">
    		<slot name="head"></slot>	
			</div>
		</div>
		{#if open}
			<div class="w-full flex" transition:slide|local>
				<div class="w-7"></div>
				<div class="flex-1">
					<slot name="details">
					</slot>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
</style>
