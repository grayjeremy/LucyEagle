# Lucy Gray — Eagle Scout

A single-page, data-driven celebration website designed as an interactive digital Court of Honor program.

## Preview locally

The site loads content with `fetch`, so serve the folder rather than opening `index.html` directly:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize

Replace the sample copy, dates, statistics, and image URLs in:

- `data/ranks.json`
- `data/merit-badges.json`
- `data/project.json`
- `data/testimonials.json`
- `data/gallery.json`

Update Lucy's troop, location, rank date, opening image, and final portrait content in `index.html`.

## Deploy

The project has no build step or dependencies. Publish the folder directly with GitHub Pages or Azure Static Web Apps.
