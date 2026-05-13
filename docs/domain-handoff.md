# Domain and GitHub Pages Handoff

This document records how `houyi.blog` is connected to the `houyili/houyi-blogs` GitHub Pages site, plus the debugging steps used during the initial setup.

## Current Setup

The blog is hosted as a static site by GitHub Pages:

```text
Repository: houyili/houyi-blogs
Canonical site: https://houyi.blog/
Hosting: GitHub Pages
Build: GitHub Actions
Domain registrar/DNS: Cloudflare
```

`https://houyili.github.io/` remains Houyi's personal homepage. It is a separate GitHub Pages user site and should not be treated as this blog's hosting root.

## Mental Model

No local server is required for the public website.

```text
Local machine
  writes code/posts and pushes to GitHub

GitHub Actions
  builds the Astro site into static HTML/CSS/JS

GitHub Pages
  hosts the generated static site

houyi.blog
  points visitors to GitHub Pages through DNS
```

The local Astro dev server, usually `127.0.0.1:4321`, is only for previewing during development.

## Cloudflare DNS Records

For the apex domain `houyi.blog`, Cloudflare DNS should contain these records:

```text
Type  Name  Content          Proxy status
A     @     185.199.108.153  DNS only
A     @     185.199.109.153  DNS only
A     @     185.199.110.153  DNS only
A     @     185.199.111.153  DNS only
```

For `www.houyi.blog`:

```text
Type   Name  Target             Proxy status
CNAME  www   houyili.github.io  DNS only
```

Keep these records as `DNS only`, not Cloudflare proxied. In the Cloudflare UI this means the cloud icon should be gray, not orange. Cloudflare may suggest proxying for security/performance features; ignore that for the GitHub Pages setup unless deliberately changing the architecture later.

## GitHub Pages Settings

The GitHub Pages custom domain should be:

```text
houyi.blog
```

GitHub Pages HTTPS should be enforced once the certificate is available:

```text
https_enforced: true
```

Useful `gh` checks:

```bash
gh api repos/houyili/houyi-blogs/pages
gh api repos/houyili/houyi-blogs/pages/health
```

If HTTPS says the certificate does not exist yet even after DNS is correct, reset the custom domain to restart GitHub's certificate flow:

```bash
gh api repos/houyili/houyi-blogs/pages --method PUT --field cname=
gh api repos/houyili/houyi-blogs/pages --method PUT --field cname=houyi.blog
gh api repos/houyili/houyi-blogs/pages --method PUT --field cname=houyi.blog --field https_enforced=true
```

During the initial setup this reset changed the certificate state to `approved`, after which `Enforce HTTPS` could be enabled successfully.

## Astro Configuration

Because the blog is now served from the root of `https://houyi.blog/`, Astro must not build URLs with the old GitHub project-site base path.

Expected configuration:

```js
export default defineConfig({
  site: "https://houyi.blog",
  base: "/",
});
```

The repo should also include:

```text
public/CNAME
```

with this content:

```text
houyi.blog
```

This ensures GitHub Pages keeps the custom domain after each deployment.

## Important URL Change

Before the custom domain, the project site URL was:

```text
https://houyili.github.io/houyi-blogs/
```

After binding `houyi.blog`, the correct public routes are:

```text
https://houyi.blog/
https://houyi.blog/en/
https://houyi.blog/zh/
https://houyi.blog/en/<post_slug>/
https://houyi.blog/zh/<post_slug>/
```

Do not use:

```text
https://houyi.blog/houyi-blogs/
https://houyi.blog/houyi-blogs/en/
```

Those are old project-site paths and should return 404.

## Common Failure: Bare or White Page

Symptom:

- `houyi.blog` loads a mostly unstyled or white page.
- Browser devtools or page HTML shows asset links like `/houyi-blogs/_astro/...`.

Cause:

- Astro is still building with `base: "/houyi-blogs"` while the custom domain serves the site at `/`.

Fix:

1. Set Astro `base` to `/`.
2. Set Astro `site` to `https://houyi.blog`.
3. Replace content asset URLs from `/houyi-blogs/assets/...` to `/assets/...`.
4. Rebuild and redeploy.

Useful checks:

```bash
rg "houyi-blogs|/houyi-blogs" astro.config.mjs src public scripts docs
npm run check
npm run build
curl -I https://houyi.blog/
curl -I https://houyi.blog/en/
```

## Publishing Verification

After any domain or routing change:

```bash
npm run check
npm run build
git push origin main
gh run list --repo houyili/houyi-blogs --limit 3
```

Then verify:

```bash
curl -I http://houyi.blog/
curl -I https://houyi.blog/
curl -I https://houyi.blog/en/
curl -I https://houyi.blog/zh/
```

Expected behavior:

- `http://houyi.blog/` redirects to `https://houyi.blog/`.
- `https://houyi.blog/` returns `200`.
- English and Chinese routes return `200`.
- Generated HTML/CSS paths use root paths such as `/_astro/...`, not `/houyi-blogs/_astro/...`.

## Relationship to Personal Homepage

`https://houyili.github.io/` is still the personal homepage. The blog should link to it from About, but the blog repository should remain independent.

Recommended division:

```text
houyili.github.io
  personal homepage, CV, profile, contact, paper list

houyi.blog
  AGI flow, paper explainers, open-source releases, reading notes
```

