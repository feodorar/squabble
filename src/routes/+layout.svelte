<script>
	import '../app.css';
</script>

<div class="flex min-h-screen flex-col">
	<div class="flex h-12 items-center justify-between bg-[#004756] p-4 text-sm text-white">
		<a href="/game">Home</a>
		<div class="text-xl">Squabble</div>
		<img class="-m-4 size-12" src="/images/squabbelino.png" alt="" />
	</div>
	<div class="m-4 flex h-[calc(100vh-9.5rem)] flex-col">
		<slot />
	</div>
</div>
