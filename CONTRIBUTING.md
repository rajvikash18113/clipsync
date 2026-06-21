# Contributing to ClipSync

Thanks for your interest in contributing! ClipSync is open source and welcomes pull requests, bug reports, and feature ideas from anyone.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your own [Supabase](https://supabase.com) project URL and anon key. See `supabase_setup.sql` for the schema and storage bucket setup.
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Run the linter before opening a PR:
   ```bash
   npm run lint
   ```

## Making changes

- Keep pull requests focused — one feature or fix per PR is easier to review.
- Match the existing code style (TypeScript, functional React components, the CSS-variable theme system in `app/globals.css`).
- If you change UI, please check it in all three themes (Dark, Light, Midnight) and at a mobile viewport width.
- Open an issue first for larger features or breaking changes so we can discuss the approach.

## Reporting bugs

Open a GitHub issue with steps to reproduce, what you expected, and what happened instead. Screenshots help a lot for UI bugs.

## Code of conduct

Be respectful and constructive. We want this to be a welcoming project for contributors of all experience levels.
