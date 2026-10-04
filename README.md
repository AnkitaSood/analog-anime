# analog-anime

This project was generated with [Analog](https://analogjs.org), the fullstack meta-framework for Angular.

## Setup

Run `npm install` to install the application dependencies.

Sign-in uses [Better Auth](https://www.better-auth.com) with email and password. Create a `.env` file in the project root:

```sh
BETTER_AUTH_SECRET=   # generate one with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173
```

The dev server reads `.env` automatically; for `npm run preview` or production, set these as real environment variables (with `BETTER_AUTH_URL` set to the public URL).

## Database

Accounts and favorites are stored in SQLite at `data/anime.db` (override with `DATABASE_PATH`), accessed through [Drizzle](https://orm.drizzle.team). Migrations in `drizzle/` are applied automatically when the server first opens the database. After changing `src/server/db/schema.ts`, run `npm run db:generate` to create a new migration.

## Development

Run `npm start` for a dev server. Navigate to `http://localhost:5173/`. The application automatically reloads if you change any of the source files.

## Build

Run `npm run build` to build the client/server project. The client build artifacts are located in the `dist/analog/public` directory. The server for the API build artifacts are located in the `dist/analog/server` directory.

## Test

Run `npm run test` to run unit tests with [Vitest](https://vitest.dev).

## Community

- Visit and Star the [GitHub Repo](https://github.com/analogjs/analog)
- Join the [Discord](https://chat.analogjs.org)
- Follow us on [Twitter](https://twitter.com/analogjs)
- Become a [Sponsor](https://github.com/sponsors/brandonroberts)
