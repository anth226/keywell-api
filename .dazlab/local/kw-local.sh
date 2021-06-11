#!/bin/sh

SCRIPT=$(basename "$0")
SHELL_CMD=
RUN_QUERY=
DOCKER_ENV='./.env'
UP_NO_WEB=0
VERBOSE=0
DO_BUILD=0
HELP=$(
  cat <<EOF

${SCRIPT} <command> [<options>]

Common options:

  -v    - Verbose output.

List of commands with command-specific options:

  help - Print this help.

  up - Run container services.
    Options:
      -b          - Build the latest Docker image.
      -W          - Do not run web service (bring up database only).

  down - Stop running containers.

  restart - Restart running containers.

  shell - Run shell.
    Options:
      -e          - Execute script command.

  mongo - Run mongo shell.
    Options:
      -q          - Execute mongodb query.

  db - Alias for mongo.
  mongodb - Alias for mongo.

EOF
)

if [ $# -eq 0 ]; then
  echo "Usage: ${HELP}"
  exit 1
fi

command=$1
shift 1

while getopts ":be:Wv" opt; do
  case ${opt} in
  b)
    DO_BUILD=1
    ;;
  e) # execute command
    SHELL_CMD=$OPTARG
    ;;
  W) # no-web
    UP_NO_WEB=1
    ;;
  v) # verbose
    VERBOSE=1
    ;;
  *)
    echo "Invalid Option: -$OPTARG" 1>&2
    echo "Usage: ${HELP}"
    exit 1
    ;;
  esac
done

verbose() {
  if [ "${VERBOSE}" -eq "1" ]; then
    echo "VERBOSE: $1"
  fi
}

ensure_config_loaded() {
  if [ ! -f "${DOCKER_ENV}" ]; then
    echo "File ${DOCKER_ENV} is missing"
    exit 1
  fi
  . ${DOCKER_ENV}
  verbose "Config is loaded from ${DOCKER_ENV}"
}

up() {
  UP_OPTS=""
  if [ "${DO_BUILD}" -eq "1" ]; then
    UP_OPTS="--build"
  fi
  if [ "${UP_NO_WEB}" -eq "1" ]; then
    verbose "Running docker compose up -d db ${UP_OPTS}"
    docker compose up -d db ${UP_OPTS}
  else
    verbose "Running docker compose up -d ${UP_OPTS}"
    docker compose up -d ${UP_OPTS}
  fi
}

down() {
  docker compose down
}

restart() {
  docker compose restart
}

shell() {
  if [ -n "${SHELL_CMD}" ]; then
    docker-compose exec -- api sh -c "${SHELL_CMD}"
  else
    docker-compose exec -- api sh
  fi
}

mongo() {
  MONGO="mongo '${MONGO_CONNECTION_URI}'"
  if [ -n "${RUN_QUERY}" ]; then
    MONGO="${MONGO} --eval '${RUN_QUERY}'"
  fi
  docker-compose exec -- db sh -c "${MONGO}"
}

help() {
  echo "Usage: ${HELP}"
}

ensure_config_loaded

case ${command} in
up)
  up
  ;;
down)
  down
  ;;
restart)
  restart
  ;;
shell)
  shell
  ;;
logs)
  logs
  ;;
mongo)
  mongo
  ;;
db)
  mongo
  ;;
mongodb)
  mongo
  ;;
help)
  help
  ;;
*)
  echo "Usage: ${HELP}"
  exit 1
  ;;
esac
