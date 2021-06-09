# KeyWell local deployment (Docker)

## Prerequisites

* Docker
* Docker Compose

## Building local image

```bash
docker compose build
```

## Starting local server

```bash
docker compose up -d
```

or just

```
./kw-local.sh up
```

## Stopping local server

```bash
docker compose down
```

```
./kw-local.sh down
```

## Setting env variables

Copy `.env.example` to `.env`, modify variables and restart service:

```bash
docker compose restart
```

or via the script:

```
./kw-local.sh restart
```

## Helper script

Run `./kw-local.sh help` for script options.
