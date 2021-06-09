# Dev Server Setup

## Slack

1. Create channel `keywell-alerts`.
2. Create incoming webhook for this new channel at https://my.slack.com/services/new/incoming-webhook/.
3. Remember the webhook URL.

## Google Cloud

### Create MongoDB

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install dazlab-mongo \
    --set auth.rootPassword=<secretpassword>,auth.username=keywelladmin,auth.password=<keywellpass>,auth.database=keywell \
    bitnami/mongodb
```

### Create .env Secret

https://console.cloud.google.com/security/secret-manager?project=dazlab-tech-services

| Name | Value |
| ---- | ----- |
| Name | `keywell-env-dev` |
| Secret value | Enter `.env` file contents. |

Example `.env` file contents:

```dotenv
PORT=4000
DISABLE_INTROSPECTION=false
DISABLE_PLAYGROUND=false
MONGO_CONNECTION_URI=mongodb://user:pasword@dazlab-mongo-mongodb.dazlab.svc.cluster.local/keywell
JWT_PRIVATE_KEY=secretbutnotaprivatekey
ENCRYPTION_SECRET=somecrypticvalue
HASH_SALT=somepasswordhashsalt
```

### Create Build Trigger

https://console.cloud.google.com/cloud-build/builds?project=dazlab-tech-services

| Name | Value |
| ---- | ----- |
| Name | `keywell-api-development-push` |
| Description | Deploy KeyWell app to dev cluster when pushing to development branch. |
| Tags | `keywell` |
| Event | Push to a branch |
| Source | Connect with BitBucket repository `dazlab-team/keywell-api`. |
| Branch | `development` |
| Configuration | Cloud Build configuration file (yaml or json). |
| Location | Repository |
| Cloud Build configuration file location | `.dazlab/development/cloudbuild.yaml` |

#### Advanced (variables)

| Variable | Value |
| -------- | ----- |
| _SLACK_WEBHOOK_URL | Webhook URL created on the previous step. |

### Connect to Google Cloud locally

Firstly, install the `gcloud` tool using these guidelines: https://cloud.google.com/sdk/docs/quickstart.

After that install `kubectl` tool via the following command:

```bash
gcloud components install kubectl
```

Then use the following set of commands every time connecting to the cluster:

```bash
gcloud config set project dazlab-tech-services
gcloud container clusters get-credentials dazlab-infrastructure-cluster --zone australia-southeast1-a
kubectl config set-context --current --namespace=dazlab
```

Ensure connection is successful by listing all the pods running inside the cluster:

```bash
kubectl get pods
```

### Initialize ConfigMaps

```
./tb-dev.sh config
```

### Run Build

Trigger build manually first time in Google Cloud Build console.

## Commands

Use the `kw-dev.sh` script to access cluster resources:

```bash
./kw-dev.sh help
```

## Links

* [Cloud Build Setup](https://console.cloud.google.com/cloud-build/builds?project=dazlab-tech-services)
* [Quickstart: Getting started with Cloud SDK](https://cloud.google.com/sdk/docs/quickstart)
* [MongoDB(R) packaged by Bitnami](https://bitnami.com/stack/mongodb/helm)
