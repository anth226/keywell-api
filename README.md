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
