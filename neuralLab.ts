import type { Connect, Plugin } from 'vite'

// 3D-лаборатория нейросетей лежит как есть в public/nn-3d-viz-lab/ (отдельный статический сайт со своими
// страницами). Vite в режиме разработки на адрес папки отвечает страницей самого приложения, поэтому
// «/nn-3d-viz-lab/» отдаём как «/nn-3d-viz-lab/index.html», а «/nn-3d-viz-lab» переводим на адрес со слэшем
// (иначе относительные ссылки лаборатории разъедутся). В production то же делает server.mjs.
const base = '/nn-3d-viz-lab'

const handler: Connect.NextHandleFunction = (req, res, next) => {
  const url = req.url ?? ''
  const queryAt = url.indexOf('?')
  const path = queryAt < 0 ? url : url.slice(0, queryAt)
  const search = queryAt < 0 ? '' : url.slice(queryAt)
  if (path === base) {
    res.statusCode = 301
    res.setHeader('Location', `${base}/${search}`)
    res.end()
    return
  }
  if (path === `${base}/`) req.url = `${base}/index.html${search}`
  next()
}

export function neuralLab(): Plugin {
  return {
    name: 'neural-lab-index',
    configureServer(server) { server.middlewares.use(handler) },
    configurePreviewServer(server) { server.middlewares.use(handler) },
  }
}
