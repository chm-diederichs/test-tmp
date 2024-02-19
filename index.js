const os = require('os')
const path = require('path')
const fs = require('fs')

const rmrf = os.platform() === 'win32' ? windowsRmrf : normalRmrf

module.exports = tmp

async function tmp (t, name = null) {
  if (!valid(name)) name = Math.random().toString(16).slice(2)

  const tmpdir = path.join(await fs.promises.realpath(os.tmpdir()), 'tmp-test-' + name)

  try {
    await gc(tmpdir)
  } catch {}

  await fs.promises.mkdir(tmpdir, { recursive: true })

  if (t) t.teardown(gc)
  return tmpdir

  async function gc () {
    await rmrf(tmpdir)
  }

  function valid (name) {
    if (typeof name !== 'string') return false

    const chars = /[<>:/\\|?*]/
    const max = 64

    return !chars.test(name) && name.length <= max
  }
}

function normalRmrf (path) {
  return fs.promises.rm(path, { recursive: true })
}

async function windowsRmrf (dir) {
  const prom = []

  const stat = await fs.promises.stat(dir)
  if (stat.isFile()) return fs.promises.rm(dir)

  for (const subdir of await fs.promises.readdir(dir)) {
    prom.push(windowsRmrf(path.join(dir, subdir)))
  }

  await Promise.all(prom)
}
