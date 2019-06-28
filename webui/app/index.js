const choo = require('choo')
const html = require('choo/html')
const pretty = require('pretty-bytes')
const sheetify = require('sheetify')

const app = choo()

sheetify('./style.css')

app.use(recordStore)
app.route('/', mainView)
app.mount('#root')

function recordStore (state, emitter) {
  state.files = []
  state.player = {}

  const audio = document.createElement('audio')
  audio.id = 'audio-player'
  audio.controls = 'controls'
  audio.type = 'audio/mpeg'

  emitter.on('DOMContentLoaded', async () => {

    document.body.appendChild(audio)

    loadFiles()
    emitter.emit('render')
  })

  emitter.on('file:load', loadFiles)

  async function loadFiles () {
    let url = toUrl('recs.json')
    let res = await fetch(url)
    let json = await res.json()
    state.files = json.files
    console.log('files', state.files)
    emitter.emit('render')
  }

  emitter.on('file:select', file => {
    audio.src = toUrl('rec/' + file.name)
    if (state.file !== file || state.player.playing) {
      audio.play()
      state.player.playing = true
    }
    state.file = file
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

    fetch('/api/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => {
        if (!res.ok) return console.log('oh no!')
        emitter.emit('file:load')
        console.log('request ok \o/')
      })
      .catch(err => console.log('oh no!'))
  })

  emitter.on('player:playpause', () => {
    state.player.playing = !state.player.playing
    if (state.file && audio) {
      if (state.player.playing) audio.play()
      else audio.pause()
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
        <h3>${file.name}</h3>
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
    files = state.files.map(file => html`
      <li onclick=${e => onFile(file)}>
        ${file.name}
        <em>${file.meta && file.meta.label}</em>
      </li>
    `)
  }

  function onFile (file) {
    emit('file:select', file)
  }

  return html`
    <div>
      <ul class='files'>
        ${files}
      </ul>
    </div>
  `
}
