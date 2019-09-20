const choo = require('choo')
const html = require('choo/html')
const pretty = require('pretty-bytes')
const css = require('sheetify')
const WaveSurfer = require('wavesurfer.js')

css('../style.css')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

app.use(recordStore)
app.route('/', mainView)
app.mount('#root')
app.emit.as = function (name, ...args) {
  return e => app.emit(name, ...args, e)
}

function recordStore (state, emitter) {
  state.files = []
  state.player = {}

  const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    backend: 'MediaElement',
    mediaControls: false,
    waveColor: 'violet',
    progressColor: 'purple'
  })

  emitter.on('DOMContentLoaded', async () => {
    loadFiles()
    emitter.emit('render')
  })

  emitter.on('file:load', loadFiles)

  async function loadFiles () {
    const url = toUrl('recs.json')
    const res = await fetch(url)
    const json = await res.json()
    const files = json.files
    files.sort((a, b) => {
      const x = a.ctime
      const y = b.ctime
      return x < y ? 1 : x > y ? -1 : 0
    })
    state.files = files
    console.log('files', state.files)
    emitter.emit('render')
  }

  emitter.on('file:select', file => {
    const url = toUrl('rec/' + file.name)
    // audio.src = url
    if (state.file !== file || state.player.playing) {
      // audio.play()
      wavesurfer.on('ready', function () {
        wavesurfer.play()
      })
      state.player.playing = true
    }
    state.file = file
    wavesurfer.load(url)
    emitter.emit('render')
  })

  emitter.on('file:rename', e => {
    e.preventDefault()
    const form = e.currentTarget
    const data = {}
    new FormData(form).forEach((v, k) => {
      data[k] = v
    })
    data.file = state.file.name

    const path = '/api/rename'

    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => {
        if (!res.ok) return console.error(`Could not fetch: ${path}`, res)
        emitter.emit('file:load')
      })
      .catch(err => console.error(`Could not fetch: ${path}`, err))
  })

  emitter.on('player:playpause', () => {
    state.player.playing = !state.player.playing
    if (state.file && wavesurfer) {
      if (state.player.playing) wavesurfer.play()
      else wavesurfer.pause()
    }
    emitter.emit('render')
  })
}

function toUrl (path) {
  const { protocol, host } = window.location
  if (path.startsWith('/')) path = path.substring(1)
  return `${protocol}//${host}/${path}`
}

function mainView (state, emit) {
  const files = filesView(state, emit)
  const player = playerView(state, emit)
  return html`
    <div>
      ${files}
      ${player}
    </div>
  `
}

function playerView (state, emit) {
  const file = state.file
  const player = state.player

  if (!file) return

  let label
  if (player.playing) {
    label = 'Stop'
  } else {
    label = 'Play'
  }

  const rename = html`
    <form onsubmit=${e => emit('file:rename', e)}>
      <label for="label">Rename:</label>
      <input type="text" name="label" />
      <button type='submit'>OK</button>
    </form>
  `

  return html`
    <div class='player'>
      <div class='meta'>
        <h3>${file.meta && file.meta.label ? file.meta.label : file.name}</h3>
        <em>Filename: ${file.name}</em>
        <br/>
        <em>Size: ${pretty(file.size)}</em>
        <br/>
        <em>Date: ${file.ctime}</em>
        <br/>
        <a href=${fileUrl(file)} download=${file.name}>Download</a>
      </div>
      <div class='controls'>
        <button class="play" onclick=${e => emit('player:playpause')}>
          ${label}
        </button>
      </div>

      <div class="rename">
        ${rename}
      </div>
    </div>
  `
}

function fileUrl (file) {
  return toUrl('rec/' + file.name)
}

function filesView (state, emit) {
  let files
  if (state.files) {
    files = state.files.map((file, i) => html`
      <li id=${`file-${i}`} onclick=${emit.as('file:select', file)}>
        ${file.name}
        <em>${file.meta && file.meta.label}</em>
      </li>
    `)
  }

  return html`
    <div>
      <ul class='files'>
        ${files}
      </ul>
    </div>
  `
}
