## DB

Prisma:
Change model on supabase, then `npx prisma db pull` and afterwards `npx prisma generate`.
If model changed, create new migration with `npx prisma migrate dev --name [name of change]`.

## Developing

Once you've created a project and installed dependencies with `bun install`, start a development server:

```bash
bun dev

# or start the server and open the app in a new browser tab
bun dev -- --open
```

## Building

To create a production version of your app:

```bash
bun build
```

You can preview the production build with `bun preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
