# KeyWell API

## Development

### Commands

#### Development build

Run this command to start Webpack Hot Reload Module:

```bash
NODE_ENV=development npm run build
```

Then run development server in a new terminal by running

```bash
npm start
```

This will start the new server at port 4000 (default). To run the development server on another port use dotenv
configuration: copy `.env.example` to `.env`, modify `PORT` variable and run this command:

```bash
npm run start:env
```

#### Testing

TBD

#### Configuration

To change the default configuration, copy `.env.example` file to `.env`, modify the default values and start server by
running `npm run start:env`.

#### Code formatting (linter)

Code linter will run after each push to any branch. To run it locally before push, execute the following command:

```bash
npm run lint
```

To fix issues automatically (when possible), run this:

```bash
npm run lint -- --fix
```

## Deployment (Docker)

### Local

See [Local deployment process README](.dazlab/local/README.md).

### Development

See [Development deployment process README](.dazlab/development/README.md).

## Contacts

| Purpose      | Contact |
| ----------- | ----------- |
| Any tech-related questions.      | Contact @andy in [keywell-dev Slack channel](https://dazlab.slack.com/archives/C01TGF1S78A). |
| Project requirements, functions.      | Contact @andy or @Craig in [keywell-dev Slack channel](https://dazlab.slack.com/archives/C01TGF1S78A). |
| Contract-related questions (payments, manual hours, rates).   | Contact [Darren Clark](https://dazlab.slack.com/archives/DJMQCE459) directly via Slack. |

## Links

* [BitBucket](https://bitbucket.org/dazlab-team/keywell-api/src/master/)
* [Jira](https://dazlab.atlassian.net/secure/RapidBoard.jspa?rapidView=18&projectKey=KEYW)
* [Keywell tech scope](https://dazlab.atlassian.net/wiki/spaces/KEYW/pages/234586113/Keywell+tech+scope)
    * [Server side](https://dazlab.atlassian.net/wiki/spaces/KEYW/pages/234913793/Server+side)
* [Dev Slack channel](https://dazlab.slack.com/archives/C01TGF1S78A)
* [How to build an Apollo GraphQL server with TypeScript and Webpack Hot Module Replacement](https://medium.com/free-code-camp/build-an-apollo-graphql-server-with-typescript-and-webpack-hot-module-replacement-hmr-3c339d05184f)
* [Reference: Deep linking into Slack](https://api.slack.com/reference/deep-linking)
