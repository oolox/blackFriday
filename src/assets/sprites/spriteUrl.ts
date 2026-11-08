const spriteUrls = import.meta.glob('./*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const spriteUrlByFileName = new Map(
  Object.entries(spriteUrls).map(([path, url]) => {
    const fileName = path.split('/').pop() ?? path;
    return [fileName, url] as const;
  }),
);

/** Resolves a catalog `file` path to the bundled sprite URL. */
export function spriteUrl(file: string): string | undefined {
  const fileName = file.split('/').pop() ?? file;
  return spriteUrlByFileName.get(fileName);
}
