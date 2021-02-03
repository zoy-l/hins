import connect, { IncomingMessage, NextFunction } from 'connect'
import http from 'http'

export async function getHttpServer(app: connect.Server) {
  return http.createServer(app)
}

export function transformRequest(
  req: IncomingMessage,
  res: http.ServerResponse,
  next: NextFunction
) {
  console.log(req, res)
}
