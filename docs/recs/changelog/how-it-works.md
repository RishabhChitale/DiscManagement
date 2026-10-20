# How it works

Plain-English explanation of recommendation systems like Pinterest's, and how this prototype maps onto it.

## Do they use image recognition on a new upload?
Yes. When an image arrives with no metadata, the platform extracts signals from the pixels (Pinterest has published papers on this, such as PinSage, PinnerSage and its unified visual embeddings):

- **Visual embeddings:** a neural network turns the image into a vector (a list of numbers). Similar-looking or similar-meaning images land near each other. This is the core of the system.
- **Auto-tagging:** classifiers or multimodal models produce labels like "mid-century living room" or "sourdough".
- **OCR** reads text inside the image.
- **Captioning:** a vision-language model writes a description.
- **Quality and safety checks:** NSFW, spam and duplicate detection.

Context is added over time: the boards people save it to (very strong, because users label images by organising them), the title and description, text on the destination page, and who engages with it.

A brand-new image with no engagement (the "cold start" problem) leans on its embedding, plus a small test audience. If it does well it is shown to more people.

## How a feed is built
A multi-stage funnel:

1. **Candidate generation:** pull a few thousand likely items from millions, cheaply (nearest neighbours of things you saved, followed creators, trending, people-also-saved).
2. **Ranking:** a heavier model scores each candidate for you, predicting save, click or long click.
3. **Re-ranking:** add diversity, freshness, ads and safety filters.
4. **Feedback loop:** every action becomes training data.

## How this prototype maps onto it

| Stage | Prototype |
|---|---|
| Understand the image | Basic features (colour, layout, detail) or CLIP embeddings; zero-shot labels for uploads |
| Item vector | Image vector plus creator tags, centred and normalised |
| Your taste | Weighted saves with time decay, grouped into up to 3 interests, blended with the overall taste |
| Candidates | Every item scored by cosine similarity (fine for hundreds; a vector index is needed for millions) |
| Ranking | Relevance plus a small popularity prior plus a freshness boost for new items |
| Re-ranking | MMR diversity, hidden-item penalty, 10% exploration |
| Feedback | Save, view and hide events in your browser |

## Building your own, in short
1. Get an embedding model (CLIP or SigLIP) and embed each image once.
2. Store vectors in a vector index (pgvector, Qdrant, FAISS).
3. Log events: view, click, save, hide.
4. Start with a weighted average of saved vectors and nearest-neighbour search. It works surprisingly well.
5. Add multiple interests, collaborative filtering and a learned ranker as real data arrives.
6. Mix personalised, trending and exploration slots, and apply diversity.

## Caveats
- A learned ranker only beats the simple embedding approach with real behaviour data. With few users, content similarity is the right choice.
- Optimise for saves or long clicks rather than raw clicks.
- If you store user uploads, run moderation first.
