require('esbuild')
  .build({
    entryPoints: ['server/index.js'],
    platform: 'node',
    target: 'node12.14',
    bundle: true,
    outdir: 'dist',
    external: ['pg-hstore'],
    format: 'cjs',
  })
  .catch(() => process.exit(1));
