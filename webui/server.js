const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const p = require('path')

const config = {
  port: 8080,
  host: '0.0.0.0',
  recpath: p.resolve(process.env.RECORD_PATH || '/data/record')
}

const app = express()

app.use('/rec', express.static(config.recpath))
app.use('/', express.static(p.join(__dirname, 'app')))
app.use('/api', bodyParser.json())
app.use(logErrors)

function logErrors (err, req, res, next) {
  console.error(err.stack)
  res.status(500)
  next(err)
}

app.get('/recs.json', function (req, res, next) {
  getRecordings((err, json) => {
    if (err) return next(err)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  })
})

app.post('/api/rename', function (req, res, next) {
  console.log(req.body)
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
  // try {
  //   console.log(JSON.parse(res.body))
  // } catch (e) {
  //   console.log('ERROR', e)
  // }
  // res.status(200).send()
})

app.listen(config.port, config.host, () => {
  console.log(`Server listening ${config.host}:${config.port}`)
})

function filePath (filename) {
  let basepath = config.recpath
  return p.join(basepath, filename)
}

function getRecordings (cb) {
  let basepath = config.recpath
  const list = []
  let missing = 0
  fs.readdir(basepath, (err, files) => {
    if (err) return cb(err)
    files.forEach(file => {
      if (!allowed(file)) return
      add(file)
    })
  })

  function add (file) {
    missing++
    fs.stat(p.join(basepath, file), (err, stat) => {
      if (err) return cb(err)

      let row = { name: file, size: stat.size, ctime: stat.ctime }

      fs.readFile(p.join(basepath, file + '.json'), (err, buf) => {
        if (!err) {
          row.meta = JSON.parse(buf.toString())
        }

        list.push(row)
        maybeDone()
      })
    })
  }

  function allowed (file) {
    return file.match(/\.(mp3|wav)$/)
  }

  function maybeDone () {
    if (--missing) return
    let files = list.sort((a, b) => a.name > b.name ? 1 : -1).reverse()
    cb(null, { files })
  }
}
