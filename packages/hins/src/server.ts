import compression from 'compression'
import connect from 'connect'
import sirv from 'sirv'

import { getHttpServer, transformRequest } from './http'

export async function server() {
  const app = connect()

  app.use(compression() as connect.NextHandleFunction)

  app.use(sirv(__dirname))

  app.use(transformRequest)

  const server = await getHttpServer(app)

  server.listen(3000, () => {
    console.log(' http://localhost:3000/')
  })
}
