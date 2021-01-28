import connect from 'connect'
import http from 'http'

export async function getHttpServer(app: connect.Server) {
  return http.createServer(app)
}
