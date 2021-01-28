import compression from 'compression'
import connect from 'connect'
import sirv from 'sirv'

import { getHttpServer } from './http'

async function server() {
  const app = connect()

  app.use(compression() as connect.NextHandleFunction)

  // app.use(sirv(__dirname))

  const server = await getHttpServer(app)

  server.listen(3000, () => {
    console.log(' http://localhost:3000/')
  })
}

server().then(() => {})
