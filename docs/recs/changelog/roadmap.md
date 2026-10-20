# Still to do

> See the visual [Roadmap](roadmap.html) page for a graphical view of this list.

Ideas for making the recommendation algorithm better, roughly in the order they are worth doing. Updated at every iteration.

## Next iteration candidates
1. **Re-tune per embedding type.** Diversity and exploration weights were tuned on Basic features; with CLIP they cost precision (see v0.4). Make the settings depend on which embedding is in use.
2. **Use zero-shot labels as tags for new uploads.** Replace the nearest-neighbour "Predicted tags" with CLIP's labels so a new upload gets meaningful tags even if the catalog is tiny.
3. **Adaptive number of interests.** Pick k from the data (silhouette score) instead of "2 saves per interest".
4. **Smarter exploration.** Replace random exploration slots with a bandit (Thompson sampling) that explores where the system is least sure.
5. **Better evaluation.** More personas, noisier users, a held-out test, and a real-photo catalog.

## Image understanding
- Image captioning with a vision-language model (for example a Claude vision call) to produce rich tags and a description at upload time.
- OCR for text inside images (posters, comics, covers).
- Near-duplicate detection (perceptual hashing) so reposts do not flood a feed.
- Moderation: NSFW and abuse classifiers on every upload before it can be recommended. Required before real user uploads.
- Fine-tune the embedding on this site's own saves and boards.
- Smaller or faster models (quantised CLIP, SigLIP) and generating embeddings once on the server rather than in every browser.

## Behaviour signals
- Dwell time, scroll-past and closeup as signals, not just save / view / hide.
- Reasons for "not interested" (topic, creator, style).
- Follow, board and creator affinity; "more from creators you follow".
- Session context: what you are looking at right now should change what comes next.
- Onboarding picks for brand-new users (choose 5 things you like).
- Time of day and recency of interests.

## Ranking
- **Collaborative filtering** (people who saved this also saved that) once there are enough real users.
- **Two-tower neural model** trained on logged saves for candidate generation.
- **Learned ranker** (LightGBM or similar) on features such as predicted save probability, creator quality, freshness, and diversity.
- Multiple candidate sources blended (similar items, followed creators, trending, graph walks over users, pins and boards).
- Cap per creator and per cluster so one creator cannot dominate a feed.
- Fairness for small creators and a guaranteed share of new-creator exposure.
- Optimise for long-term value (saves and return visits) rather than clicks, to avoid clickbait.

## Engineering
- Move to a server: FastAPI plus Postgres with pgvector (or Qdrant) for vector search; approximate nearest-neighbour index (HNSW) once the catalog passes about 50,000 items.
- Server-side event logging with accounts, instead of the browser-only demo.
- Background job to embed every upload once, then store the vector.
- Daily or hourly rebuild of popularity, trending and clusters.
- A/B testing and logging so changes are judged on real behaviour, not only the simulation.
- Privacy options: keep taste on-device, explain recommendations, let users reset or export their data.

## Compression angle (ties into the site's compression experiments)
- Embedding vectors: compare float32 vs float16 vs int8 vs product quantisation for size, speed and recommendation quality.
- Serve the vector index and catalog data with gzip / Brotli and measure download size.
- Image delivery: AVIF / WebP thumbnails and lazy loading for the feed.

## Other media
- **Video:** sample frames and embed each, pool them into one vector; add audio features and transcript text; use watch time and completion as the main signal. Needs a server for transcoding and streaming; GitHub Pages cannot host that.
- **Music and writing:** audio embeddings and text embeddings so one taste profile spans every content type.
