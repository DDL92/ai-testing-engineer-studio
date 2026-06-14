# Dashboard Mobile Security

The mobile dashboard server is for short-lived local review on trusted Wi-Fi only.

## Safe Operation

Run:

```bash
npm run dashboard:mobile
```

Open the printed local network URL only from a trusted device on the same trusted Wi-Fi. Stop the server with `Ctrl+C` when finished.

Do not use the mobile server on public Wi-Fi, expose it through a tunnel, configure router port forwarding, or share it outside the local trusted network.

## Server Boundary

The mobile server serves only files under `dashboard/`.

It blocks dotfiles, `.env`, `.env.local`, `data/`, `output/`, `src/`, `node_modules/`, `package.json`, path traversal, and unknown file types.

Allowed file types are `.html`, `.css`, `.js`, `.json`, `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, and `.ico`.

Validate the boundary with:

```bash
npm run security:dashboard-check
```
