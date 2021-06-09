import { environment } from './environment'
import server from './server'
import { connectDB } from './db'

connectDB()
  .then(() => {
    server
      .listen(environment.port)
      .then(({ url }) => console.log(`Server ready at ${url}. `))
  })
  .catch(() => {
    console.log('Failed when connecting to db')
  })

if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => server.stop());
}
