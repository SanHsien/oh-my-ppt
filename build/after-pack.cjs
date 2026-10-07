const fs = require('fs/promises')
const path = require('path')

exports.default = async function afterPack(context) {
  const platformName = context.electronPlatformName
  if (platformName !== 'win32') return

  const sourcePath = path.join(context.packager.projectDir, 'resources', 'ffmpeg', 'ffmpeg.exe')
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir)
  const targetDir = path.join(resourcesDir, 'app.asar.unpacked', 'resources', 'ffmpeg')
  const targetPath = path.join(targetDir, 'ffmpeg.exe')

  try {
    await fs.access(sourcePath)
  } catch {
    console.warn(
      `[afterPack] optional bundled ffmpeg missing: ${sourcePath}. ` +
        'The package will be created without built-in MP4 export support.'
    )
    return
  }

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(targetDir, { recursive: true })
  await fs.copyFile(sourcePath, targetPath)

  console.log(`[afterPack] bundled ffmpeg ffmpeg.exe -> ${targetPath}`)
}
