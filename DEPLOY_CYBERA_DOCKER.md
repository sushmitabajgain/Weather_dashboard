# Cybera Docker Deploy

This project can run on a single Cybera VM with Docker Compose.

## What this setup does

- `db`: PostgreSQL database
- `backend`: FastAPI + GraphQL + AQHI agent
- `frontend`: nginx container that serves the built Vite app and proxies the API

The frontend container proxies:

- `/graphql` -> backend
- `/agent/chat` -> backend
- `/data/*` -> backend

## 1. Prepare a Cybera VM

Use an Ubuntu VM in Rapid Access Cloud.

Install Docker and Compose:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Log out and back in after adding yourself to the `docker` group.

## 2. Copy the project

```bash
git clone <your-repo-url>
cd Weather-Dashboard
```

## 3. Create the Docker env file

```bash
cp .env.docker.example .env
```

Edit `.env` and set:

- `DB_PASSWORD`
- `GROQ_API_KEY`
- `ALLOWED_ORIGIN`

If you serve the app from a public IP, set `ALLOWED_ORIGIN` to that full origin, for example:

```env
ALLOWED_ORIGIN=http://203.0.113.10
```

## 4. Start the stack

```bash
docker compose up -d --build
```

## 5. Seed the database once

If you want the static CSV data loaded first:

```bash
docker compose exec backend python load_data.py
```

After that, the backend can also refresh live data through its own refresh flow.

## 6. Open the app

Visit:

```text
http://<your-server-ip>
```

## 7. Useful commands

View logs:

```bash
docker compose logs -f
```

Restart after changes:

```bash
docker compose up -d --build
```

Stop everything:

```bash
docker compose down
```

Stop and remove database volume too:

```bash
docker compose down -v
```

## Notes for Cybera

- Make sure the VM security rules allow inbound port `80`.
- If you later add a domain, you can extend nginx for HTTPS.
- For production persistence, keep the Postgres Docker volume on storage you are comfortable backing up.
