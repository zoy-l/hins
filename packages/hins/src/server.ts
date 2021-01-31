import compression from 'compression'
import connect from 'connect'
import sirv from 'sirv'

import { getHttpServer } from './http'

export async function server() {
  const app = connect()

  app.use(compression() as connect.NextHandleFunction)

  app.use(sirv(__dirname))

  app.use((req, res, next) => {
    // res.statusCode = 200
    // res.end('hellow world')
    console.log(req.url)
    res.setHeader('Content-Type', 'application/javascript')
    res.end(`    import abc from './abc'
    export default () => {

      console.log(1111)

    }`)
  })

  const server = await getHttpServer(app)

  server.listen(3000, () => {
    console.log(' http://localhost:3000/')
  })
}
