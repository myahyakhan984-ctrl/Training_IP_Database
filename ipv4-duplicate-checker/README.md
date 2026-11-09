# IPv4 Duplicate Checker

A small web application for uploading one or many IPv4 addresses and preventing duplicates with Cloudflare D1.

## Architecture

- `frontend/`: static website hosted on Vercel
- `worker/`: Cloudflare Worker API
- `worker/migrations/0001_create_ip_records.sql`: fresh D1 database table
- `training/SETUP-ROMAN-URDU.md`: step-by-step deployment training in Roman Urdu

## Features

- Accepts valid IPv4 addresses only (all countries; no GeoIP/country lookup).
- Supports one IP or multiple IPs pasted one per line (commas and spaces are also handled).
- Saves new addresses in Cloudflare D1.
- Rejects addresses already stored in D1, including duplicates within the same upload.
- Uses a database `UNIQUE` constraint as the final duplicate safeguard.
- Shows upload results and a searchable, paginated record list.

## Important security note

This starter project has no user login or API key. Anyone who can access the public website/API may submit IP addresses. Before using it with sensitive or high-volume data, add authentication, rate limiting, and abuse protection. Do not treat an IP address as proof of a person's identity.

## Quick deployment overview

1. Create a new GitHub repository and upload this project.
2. Create a new Cloudflare D1 database.
3. Apply `worker/migrations/0001_create_ip_records.sql` to that database.
4. Put the D1 database ID into `worker/wrangler.toml`.
5. Deploy the Worker from the `worker` directory.
6. Copy the deployed Worker URL into `frontend/config.js`.
7. Deploy the `frontend` directory to Vercel (Root Directory = `frontend`).
8. Test one new IP, then upload it again to confirm duplicate rejection.

Full instructions are in `training/SETUP-ROMAN-URDU.md`.
