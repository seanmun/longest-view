// Turn a Meshy export into a game-ready GLB in public/models.
//
//   node tools/process-model.mjs <name> <source> [clip=AnimationFileHint ...] [--tris 24000]
//
// <source>: a Meshy zip, an unzipped folder, or a single .glb.
// Clips: map a game clip name to part of a Meshy animation file name, e.g.
//   walk=Walking run=Running happy=Hip_Hop hit=Face_Punch
// The first clip's file supplies the model; the rest are merged onto its
// skeleton by bone name. With no clips, the single GLB is just shrunk.
//
// Shrinking: weld, simplify to ~--tris triangles, 1024px WebP textures.
import { execSync } from 'node:child_process'
import { mkdtempSync, readdirSync, statSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { weld, simplify, resample, prune, dedup, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const args = process.argv.slice(2)
const name = args.shift()
const source = args.shift()
const trisFlag = args.indexOf('--tris')
const targetTris = trisFlag >= 0 ? Number(args.splice(trisFlag, 2)[1]) : 24000
const clips = args.map((a) => a.split('='))
if (!name || !source) { console.error('usage: node tools/process-model.mjs <name> <source> [clip=hint ...] [--tris N]'); process.exit(1) }

// Collect the GLB files
let dir = source
if (extname(source) === '.zip') {
  dir = mkdtempSync(join(tmpdir(), 'meshy-'))
  execSync(`unzip -q -o "${source}" -d "${dir}"`)
}
const files = []
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.glb') && files.push(p) } }
existsSync(dir) && statSync(dir).isDirectory() ? walk(dir) : files.push(source)
const find = (hint) => {
  const hits = files.filter((f) => f.includes(`Animation_${hint}`) || f.toLowerCase().includes(hint.toLowerCase()))
  if (!hits.length) throw new Error(`no animation file matching "${hint}" in:\n  ${files.join('\n  ')}`)
  return hits.sort((a, b) => a.length - b.length)[0]
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.simplifier': MeshoptSimplifier })
const [baseClip, ...extra] = clips.length ? clips : [[null, null]]
const doc = await io.read(baseClip[0] ? find(baseClip[1]) : files[0])
const root = doc.getRoot()
if (baseClip[0]) root.listAnimations()[0]?.setName(baseClip[0])

// Merge the other clips onto the base skeleton
const buffer = root.listBuffers()[0]
const nodes = new Map(root.listNodes().map((n) => [n.getName(), n]))
for (const [clip, hint] of extra) {
  const src = await io.read(find(hint))
  const anim = src.getRoot().listAnimations()[0]
  const dst = doc.createAnimation(clip)
  let missing = 0
  for (const ch of anim.listChannels()) {
    const target = nodes.get(ch.getTargetNode().getName())
    if (!target) { missing++; continue }
    const s = ch.getSampler()
    const copy = (acc) => doc.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buffer)
    const sampler = doc.createAnimationSampler().setInput(copy(s.getInput())).setOutput(copy(s.getOutput())).setInterpolation(s.getInterpolation())
    dst.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(ch.getTargetPath()).setSampler(sampler))
  }
  console.log(`  ${clip}: ${anim.listChannels().length} channels${missing ? `, ${missing} UNMATCHED` : ''}`)
}

// Shrink
const tris = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0)
const ratio = Math.min(1, targetTris / tris)
await doc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 }),
  resample(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
)
const out = `public/models/${name}.glb`
await io.write(out, doc)
const after = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0)
console.log(`${out}: ${Math.round(tris)} -> ${Math.round(after)} triangles, ${(statSync(out).size / 1e6).toFixed(1)} MB, clips: ${root.listAnimations().map((a) => a.getName()).join(', ') || 'none'}`)
