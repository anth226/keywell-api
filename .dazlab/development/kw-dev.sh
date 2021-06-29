#!/bin/sh

SCRIPT=$(basename "$0")
LOGS_FOLLOW=0
LOGS_NO_LINES=0
LOGS_DISPLAY_TIMESTAMPS=0
SHELL_CMD=
RUN_QUERY=
CONTAINER=keywell-api
POD_APP_NAME=keywell-api
CONFIG_FILE=/tmp/keywell.env
CONFIGMAP_NAME=keywell-config-env-file
CONFIGMAP_SECRET_NAME=keywell-env-dev
CONFIG_RELOAD=0
LOGIN_AS_ROOT=0
MONGO_ROOT_PASSWORD=
VERBOSE=0
HELP=$(
  cat <<EOF

${SCRIPT} <command> [<options>]

Common options:

  -v    - Verbose output.

List of commands with command-specific options:

  help - Print this help.

  config - Re-create configmap from .env file.
    Options:
      -r          - Force reload config from Google Cloud Secret Manager (skip cached one).
      -p <PATH>   - Use specific .env file instead of the default one.

  restart - Restart pod.

  shell - Run shell.
    Options:
      -e          - Execute script command.

  mongo - Run mongo shell.
    Options:
      -q          - Execute mongodb query.
      -P <PASS>   - Specify root password. (By default, it is taken from MONGO_ROOT_PASSWORD variable contained inside
                    .env file located in the current directory.)
      -R          - Login as root.

  db - Alias for mongo.
  mongodb - Alias for mongo.

  logs - Access to logs inside pod.
    Options:
      -f          - Follow updates.
      -n <LINES>  - Print last N lines only (default is ${LOGS_NO_LINES}).

EXAMPLES

    Enable MongoDB query profiling:

    ./${SCRIPT} db -R -q 'db.setProfilingLevel(2)'

    Display executed queries:

    ./${SCRIPT} db -R -q 'db.system.profile.find().pretty()'

    Disable MongoDB query profiling:

    ./${SCRIPT} db -R -q 'db.setProfilingLevel(0)'

    Clear profiling data:

    ./${SCRIPT} db -R -q 'db.system.profile.drop()'

    Init database with data:

    ./${SCRIPT} shell -e 'npm run init-db'

EOF
)

if [ $# -eq 0 ]; then
  echo "Usage: ${HELP}"
  exit 1
fi

command=$1
shift 1

while getopts ":e:vfn:tp:rq:P:R" opt; do
  case ${opt} in
  e) # execute command
    SHELL_CMD=$OPTARG
    ;;
  f) # follow log updates
    LOGS_FOLLOW=1
    ;;
  n) # use `--tail` option
    LOGS_NO_LINES=$OPTARG
    ;;
  t) # log display timestamps
    LOGS_DISPLAY_TIMESTAMPS=1
    ;;
  p) # config file path
    CONFIG_FILE=$OPTARG
    ;;
  P)
    MONGO_ROOT_PASSWORD=$OPTARG
    ;;
  q) # run queries
    RUN_QUERY=$OPTARG
    ;;
  r)
    CONFIG_RELOAD=1
    ;;
  R)
    LOGIN_AS_ROOT=1
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
  if [ ! -f "${CONFIG_FILE}" ] || [ "${CONFIG_RELOAD}" -eq "1" ]; then
    verbose "Reading config from Google Cloud"
    gcloud secrets versions access latest --secret="${CONFIGMAP_SECRET_NAME}" --format='get(payload.data)' | tr '_-' '/+' | base64 -d >${CONFIG_FILE}
    chmod 0700 ${CONFIG_FILE}
  fi
  . ${CONFIG_FILE}
  # override with local values
  if [ -f ".env" ]; then
    . .env
  fi
}

get_pod_name() {
  POD=$(kubectl get pod -l app=${POD_APP_NAME} -o jsonpath="{.items[0].metadata.name}")
  verbose "POD name is ${POD}"
}

get_mongo_pod_name() {
  MONGO_POD=$(kubectl get pod -l app.kubernetes.io/component=mongodb -o jsonpath="{.items[0].metadata.name}")
  verbose "MONGODB POD name is ${MONGO_POD}"
}

logs() {
  LOG_OPTIONS="-c ${CONTAINER}"
  if [ "${LOGS_DISPLAY_TIMESTAMPS}" -eq "1" ]; then
    LOG_OPTIONS="${LOG_OPTIONS} --timestamps"
  fi
  if [ "${LOGS_FOLLOW}" -eq "1" ]; then
    LOG_OPTIONS="${LOG_OPTIONS} -f"
  fi
  if [ "${LOGS_NO_LINES}" -eq "1" ]; then
    LOG_OPTIONS="${LOG_OPTIONS} --tail ${LOGS_NO_LINES}"
  fi
  get_pod_name
  kubectl logs ${POD} ${LOG_OPTIONS}
}

restart() {
  get_pod_name
  kubectl delete pod ${POD}
}

config() {
  kubectl delete configmap ${CONFIGMAP_NAME}
  kubectl create configmap ${CONFIGMAP_NAME} --from-file=.env=$CONFIG_FILE
}

shell() {
  command_to_execute="$1"
  get_pod_name
  if [ -n "${command_to_execute}" ]; then
    verbose "Executing command $command_to_execute"
    kubectl exec -i ${POD} -c ${CONTAINER} -- sh -c "${command_to_execute}"
  else
    kubectl exec -it ${POD} -c ${CONTAINER} -- sh
  fi
}

mongo() {
  get_mongo_pod_name
  if [ "${LOGIN_AS_ROOT}" -eq "1" ]; then
    MONGO_CONNECTION_URI=$(echo "${MONGO_CONNECTION_URI}" | sed -E "s/mongodb\:\/\/.*\@/mongodb:\/\/root\:${MONGO_ROOT_PASSWORD}\@/")
    if echo "${MONGO_CONNECTION_URI}" | grep -q '?'; then
      MONGO_CONNECTION_URI="${MONGO_CONNECTION_URI}&"
    else
      MONGO_CONNECTION_URI="${MONGO_CONNECTION_URI}?"
    fi
    MONGO_CONNECTION_URI="${MONGO_CONNECTION_URI}authSource=admin"
  fi
  MONGO="mongo --quiet '${MONGO_CONNECTION_URI}'"
  if [ -n "${RUN_QUERY}" ]; then
    MONGO="${MONGO} --eval '${RUN_QUERY}'"
  fi
  verbose "Running ${MONGO} inside ${MONGO_POD}"
  kubectl exec -it ${MONGO_POD} -- sh -c "${MONGO}"
}

help() {
  echo "Usage: ${HELP}"
}

ensure_config_loaded

case ${command} in
restart)
  restart
  ;;
shell)
  shell "${SHELL_CMD}"
  ;;
logs)
  logs
  ;;
config)
  config
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
