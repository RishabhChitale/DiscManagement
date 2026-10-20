# Operation F95

A Patreon-style content showcase used as a testbed for website compression
algorithms and content-hosting techniques.

## Goals
- Build a simple creator/content showcase site (posts, images, video previews).
- Measure how different compression techniques affect size and load time.
- Compare approaches (gzip, deflate, Brotli, image/video formats, minification).

## Layout
- `docs/` – the website (plain HTML/CSS/JavaScript, no install needed)
- `scripts/` – helper scripts (daily auto-save)

## Try it
Open `docs/index.html` in your browser. The "Compression Lab" section compresses
text in the browser and shows the size savings.

## Daily save
`scripts/daily-save.ps1` commits and pushes changes; Windows Task Scheduler runs it once a day.

## Recommendation prototype
- `docs/recs.html` – "For you" feed that learns taste from saves (basic image features or in-browser CLIP).
- `docs/recs-eval.html` – offline evaluation with simulated users.
- `docs/changelog.html` – "Recommendation-alg changelog": one markdown file per iteration in `docs/recs/changelog/`, plus the "Still to do" roadmap. Add a file there and list it in `index.json` for each new iteration.
- Code lives in `docs/js/recs/`. The pages load files with `fetch`, so open them through a web server (GitHub Pages, or any local static server), not by double-clicking.
