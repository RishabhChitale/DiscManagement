# Adding your own content

Put images in a **category folder** inside this folder, then run the build script.

```
docs/img/
  art/        lighthouse-study--ink-landscape.jpg
  music/      studio-session--studio-demo.png
  games/      pixel-tileset--pixel-sprite.jpg
  writing/    chapter-opening--chapter.jpg
  art/ana-silva/   street-photo--city-street.jpg      (optional creator folder)
```

## File names
`my-title--tag-one-tag-two.jpg`

- Words before `--` become the title ("My title").
- Words after `--` become tags. The category folder name is always added as a tag.
- No `--` is fine: you just get the category tag. The CLIP option in the For you page works out what is in the image on its own.
- Supported: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`. Convert `.webp` / `.avif` / `.heic` first.

## Creators
- `art` → Mira Okafor, `music` → The Tide Collective, `games` → Jun Park, `writing` → Elan Reyes (the placeholder creators).
- Put files in `art/<creator-name>/` to give them a different creator. Any other category folder works too.

## Build
From the project folder, in PowerShell:

```
powershell -ExecutionPolicy Bypass -File scripts\build-content.ps1
```

This writes small 480px JPEG thumbnails to `docs/thumbs/` and a list of everything to `docs/content.json`. The site reads `content.json`; delete it to go back to the generated sample artwork. Run it again whenever you add, rename or remove images.

## How many
- 40+ images across 3 or 4 categories: the feed shows clear taste clusters.
- 150+ (30+ per category): enough for the evaluation page to mean anything.

## Rights
The repo is public. Only add images you made or that are licensed for reuse (public domain, CC0, or a licence that allows it).
