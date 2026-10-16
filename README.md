# Operation F95

A Patreon-style content showcase used as a testbed for website compression
algorithms and content-hosting techniques.

## Goals
- Build a simple creator/content showcase site (posts, images, video previews).
- Measure how different compression techniques affect size and load time.
- Compare approaches (gzip, deflate, Brotli, image/video formats, minification).

## Layout
- `site/` – the website (plain HTML/CSS/JavaScript, no install needed)
- `scripts/` – helper scripts (daily auto-save)

## Try it
Open `site/index.html` in your browser. The "Compression Lab" section compresses
text in the browser and shows the size savings.

## Daily save
`scripts/daily-save.ps1` commits and pushes changes; Windows Task Scheduler runs it once a day.
