const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const p = require('path')

const config = {
  port: 8080,
  host: '0.0.0.0',
  recpath: p.resolve(process.env.RECORD_PATH || '../data/record')
}

const app = express()

app.use('/', express.static(p.join(__dirname, 'app')))
app.use('/rec', express.static(config.recpath))
app.use('/api', bodyParser.json())
app.use(logErrors)

function logErrors (err, req, res, next) {
  console.error('Error', req, err.stack)
  res.status(500)
  next(err)
}

app.get('/recs.json', function (req, res, next) {
  getRecordings(config.recpath, (err, files) => {
    if (err) return next(err)
    const json = { files }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  })
})

app.post('/api/rename', function (req, res, next) {
  console.log('/api/rename: %o', req.body)
  if (!req.body || !req.body.file) return res.status(500).send('Invalid request')

  const { file, label } = req.body

  if (file.match(/\//)) return res.status(403).send('Bad filename')

  const path = filePath(file + '.json')
  fs.readFile(path, (err, buf) => {
    let json = {}
    if (!err) {
      json = JSON.parse(buf.toString())
    }
    const newJson = { ...json, label }
    fs.writeFile(path, Buffer.from(JSON.stringify(newJson)), (err) => {
      if (err) return next(err)
      res.status(200).send()
    })
  })
})

app.listen(config.port, config.host, () => {
  console.log(`Server listening ${config.host}:${config.port}`)
})

function filePath (filename) {
  const basepath = config.recpath
  return p.join(basepath, filename)
}

function getRecordings (basepath, cb) {
  const list = []

  fs.readdir(basepath, onlist)

  function onlist (err, files) {
    if (err) return cb(err)
    files = files.filter(file => isFileAllowed(file))

    let pending = files.length
    files.forEach(filename => fileInfo(p.join(basepath, filename), ondone))

    function ondone (err, info) {
      if (err) return cb(err)
      list.push(info)
      if (--pending === 0) cb(null, list)
    }
  }

  function fileInfo (path, cb) {
    fs.stat(path, (err, stat) => {
      if (err) return cb(err)

      const row = { name: p.basename(path), size: stat.size, ctime: stat.ctime }

      fs.readFile(path + '.json', (err, buf) => {
        if (!err) {
          try {
            row.meta = JSON.parse(buf.toString())
          } catch (err) {
            console.error('Invalid JSON: ' + path, err)
          }
        }
        cb(null, row)
      })
    })
  }

  function isFileAllowed (file) {
    return file.match(/\.(mp3|wav)$/)
  }
}
