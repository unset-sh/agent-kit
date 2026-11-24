<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/registry/ui/button/index.js';
	import { Input } from '$lib/registry/ui/input/index.js';
	import { Label } from '$lib/registry/ui/label/index.js';
	import * as Card from '$lib/registry/ui/card/index.js';
	import * as Dialog from '$lib/registry/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/registry/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/registry/ui/tooltip/index.js';
	import * as Field from '$lib/registry/ui/field/index.js';
	import { Toaster } from '$lib/registry/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

	let { form } = $props();

	function toggleTheme() {
		const root = document.documentElement;
		root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
	}
</script>

<Toaster />
<Tooltip.Provider>
	<main id="main" class="mx-auto flex max-w-3xl flex-col gap-8 p-8">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">web UI spike</h1>
			<a href="/other" id="other">Other page</a>
			<Button id="theme" variant="outline" onclick={toggleTheme}>Toggle theme</Button>
		</header>

		<section id="buttons" class="flex flex-wrap gap-2">
			<Button>Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="link">Link</Button>
			<Button disabled>Disabled</Button>
		</section>

		<section id="inputs" class="grid gap-3">
			<Label for="plain">Plain</Label>
			<Input id="plain" placeholder="Type here" />
			<Label for="disabled">Disabled</Label>
			<Input id="disabled" disabled value="Can't edit" />
			<Label for="invalid">Invalid</Label>
			<Input id="invalid" aria-invalid="true" value="bad value" />
		</section>

		<Card.Root id="card">
			<Card.Header>
				<Card.Title>Sign in form</Card.Title>
				<Card.Description>Server-validated with a SvelteKit form action.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" use:enhance id="signin">
					<Field.Group>
						<Field.Field data-invalid={form?.error ? true : undefined}>
							<Field.Label for="handle">Handle</Field.Label>
							<Input
								id="handle"
								name="handle"
								value={form?.handle ?? ''}
								aria-invalid={form?.error ? true : undefined}
								aria-describedby={form?.error ? 'handle-error' : undefined}
							/>
							<Field.Description>Your AT Protocol handle.</Field.Description>
							{#if form?.error}<Field.Error id="handle-error">{form.error}</Field.Error>{/if}
						</Field.Field>
						<Button type="submit">Continue</Button>
						{#if form?.ok}<p id="ok">Accepted {form.handle}</p>{/if}
					</Field.Group>
				</form>
			</Card.Content>
		</Card.Root>

		<section class="flex flex-wrap gap-2">
			<Dialog.Root>
				<Dialog.Trigger id="dialog-trigger">
					{#snippet child({ props })}<Button {...props} variant="outline">Open dialog</Button>{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Edit profile</Dialog.Title>
						<Dialog.Description>Focus should stay inside this dialog.</Dialog.Description>
					</Dialog.Header>
					<Input id="dialog-name" placeholder="Name" />
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}<Button {...props}>Save</Button>{/snippet}
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger id="menu-trigger">
					{#snippet child({ props })}<Button {...props} variant="outline">Open menu</Button>{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Label>Account</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Profile</DropdownMenu.Item>
					<DropdownMenu.Item>Settings</DropdownMenu.Item>
					<DropdownMenu.Item disabled>Disabled</DropdownMenu.Item>
					<DropdownMenu.Item variant="destructive">Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<Tooltip.Root>
				<Tooltip.Trigger id="tooltip-trigger">
					{#snippet child({ props })}<Button {...props} variant="secondary">Hover me</Button>{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Tooltip text</Tooltip.Content>
			</Tooltip.Root>

			<Button id="toast" variant="outline" onclick={() => toast.success('Saved', { description: 'A toast from Sonner' })}>
				Show toast
			</Button>
		</section>
	</main>
</Tooltip.Provider>
