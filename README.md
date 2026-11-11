# Teague Roark — portfolio

A static portfolio site for Teague Roark, Environmental Design student. Plain HTML, CSS, and JavaScript, no build step.

- `index.html` — about, projects, skills
- `style.css` — palette (iron grey, taupe grey, blue slate) and layout
- `script.js` — skyline animation and nav/category highlighting
- `assets/work/` — Teague's PDFs (compressed); `assets/covers/` — card cover images

Projects are grouped into categories, each a `<div class="category">` with a matching button in the `.jump-bar`. To add work, drop the PDF in `assets/work/`, a 800×450 JPG cover in `assets/covers/`, and copy a card. Swap the `TR` circle in the about section for a photo the same way.

Publish with GitHub Pages: Settings → Pages → deploy from the `main` branch root.
