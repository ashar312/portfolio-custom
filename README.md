# Ashar Ashfaq: Portfolio and Job Application Toolkit

I'm Ashar Ashfaq, a Senior Software Engineer and Tech Lead based in Karachi. This repo holds
my [portfolio site](https://asharashfaque.com/) and the Claude Code setup I use to apply for
jobs. It does two things:

1. **Keeps my portfolio up to date** on a custom-designed site, with all the copy in one file.
2. **Tailors my resume to a job.** I paste a job link into Claude Code and get a matching resume
   and cover letter, written to sound like a person and not a template.

## Getting started

You need [Node.js](https://nodejs.org/) 20.9 or newer. For the job application tools, you also
need [Claude Code](https://claude.com/claude-code).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to out/
```

## Use case 1: Maintain your portfolio

The site is built with Next.js 16, React 19, react-three-fiber, GSAP, Lenis and Tailwind v4.
Updating it doesn't require touching any components.

| To change | Edit |
| --- | --- |
| Name, role, summary, contact details, experience, skills | [src/lib/content.ts](src/lib/content.ts) |
| Selected work | [selected-work.md](selected-work.md), then ask Claude to sync it into `content.ts` |
| Project screenshots | See [Adding real work images](#adding-real-work-images) |
| Colours and fonts | [src/app/globals.css](src/app/globals.css) |

### Deploying

The site exports as static files, so any host that can serve a folder will work. Run
`npm run build` and upload the contents of `out/`. `npm run package` does the same build and
also zips it into `portfolio-deploy.zip`, but it needs the `zip` command installed.

> **Before deploying to Apache or cPanel:** [public/.htaccess](public/.htaccess) still redirects
> every request to `ahsuniqbal.com`. Change that host to your own domain first.

## Use case 2: Tailor your resume to a job

The [.claude](.claude) folder turns Claude Code into an application assistant. Open this project
in Claude Code and run one of these commands:

```text
/tailor-resume https://example.com/jobs/senior-backend-engineer
/cover-letter https://example.com/jobs/senior-backend-engineer
```

| Command | What you get |
| --- | --- |
| `/tailor-resume <link, text or screenshot>` | A tailored resume and cover letter, as HTML and PDF, saved in an application folder |
| `/cover-letter <link>` | Cover letter text printed in the terminal, with no files created |

If a job page sits behind a login, Claude will tell you it couldn't read it. Paste the job
description as text instead.

### What happens after you paste a link

1. **Read the job.** Claude pulls out the title, company, required skills and hard requirements.
2. **Check the fit.** The job is compared against [profile.md](profile.md).
   - **Match:** about 70% or more of the must-haves are backed by real experience, with no
     blockers. Claude carries on.
   - **Borderline:** Claude explains the gap and asks before writing anything.
   - **No match:** Claude stops and tells you what's missing.
3. **Tailor the resume.** The summary, skills, experience bullets and project order are
   rewritten around the job. The layout stays exactly as it is in the base resume.
4. **Write the cover letter.** Four paragraphs on one page, with any real gap stated plainly.
5. **Humanize the writing.** A separate reviewer removes signs of AI writing, such as dashes used
   as punctuation, emoji, buzzwords and repetitive sentence rhythm. Facts and numbers stay the same.
6. **Package it.** Everything is saved to one folder:

```text
applications/<Job Title> - <Company>/
  <Job-Title>.html
  <Job-Title>.pdf
  <Job-Title>-Cover-Letter.html
  <Job-Title>-Cover-Letter.pdf
  job-info.txt
```

The `applications/` folder is ignored by git, so your applications stay on your machine.

**Claude can't invent experience.** Every claim has to trace back to `profile.md`, and employers,
dates, titles and metrics are never made up. Anything the job asks for that the profile can't
support is reported as a known gap.

### What's in `.claude`

| File | Job |
| --- | --- |
| [commands/tailor-resume.md](.claude/commands/tailor-resume.md) | The `/tailor-resume` command |
| [commands/cover-letter.md](.claude/commands/cover-letter.md) | The `/cover-letter` command |
| [agents/resume-tailor.md](.claude/agents/resume-tailor.md) | Judges the fit, then writes and packages the application |
| [agents/cover-letter-cli.md](.claude/agents/cover-letter-cli.md) | Judges the fit, then writes the letter as text |
| [agents/humanize-reviewer.md](.claude/agents/humanize-reviewer.md) | Reviews the drafts and fixes AI-sounding prose |
| [skills/humanize-writing/SKILL.md](.claude/skills/humanize-writing/SKILL.md) | The writing checklist the reviewer follows |

### PDF export on Windows

[scripts/html-to-pdf.sh](scripts/html-to-pdf.sh) currently works on macOS only. On Windows the
HTML files are still written, and you can export each one from PowerShell using full paths:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="C:\path\to\Resume.pdf" "file:///C:/path/to/Resume.html"
```

### Make it your own

To use this toolkit for yourself, fork the repo and replace my details:

1. [profile.md](profile.md): your skills, experience and projects. This is the source of truth
   for every application.
2. [resume/resume.html](resume/resume.html) and [resume/Cover-Letter.html](resume/Cover-Letter.html):
   your base resume and cover letter.
3. [src/lib/content.ts](src/lib/content.ts) and [selected-work.md](selected-work.md): your site content.
4. The files in [.claude/agents](.claude/agents): your name, target roles, location, blockers and
   the metrics that must stay exact.

---

# Portfolio internals

## How the scroll system works

Three layers, deliberately kept independent:

1. **Lenis** ([SmoothScroll.tsx](src/components/SmoothScroll.tsx)) drives real window
   scroll — not a transformed wrapper — so `getBoundingClientRect()` stays truthful for
   everything else. GSAP's ticker owns the RAF loop; `ScrollTrigger.update()` is called
   from Lenis so both agree on position. Disabled entirely under
   `prefers-reduced-motion`.
2. **DOM owns layout and interaction.** Each project row renders a transparent
   placeholder div (`.plate`). Hover, links, and focus are plain DOM — the canvas is
   `pointer-events-none`, so nothing about accessibility is traded away.
3. **WebGL mirrors the DOM.** A single fixed fullscreen canvas
   ([CanvasRoot.tsx](src/components/webgl/CanvasRoot.tsx)) holds one textured plane per
   placeholder. The camera is set so **1 world unit = 1 CSS pixel**, and every frame each
   plane copies its placeholder's rect.

Placeholders register themselves through
[registry.ts](src/components/webgl/registry.ts) (`useTrack`), which the canvas reads via
`useSyncExternalStore`. Adding a WebGL-backed image anywhere is one hook call.

### The shader

[ImagePlane.tsx](src/components/webgl/ImagePlane.tsx):

- **Vertex** — elastic bend on the z axis, scaled by scroll velocity, so plates lag
  behind fast scrolling and settle when it stops.
- **Fragment** — `cover()` UV fit, RGB split proportional to velocity, desaturated at
  rest and full colour on hover, plus a bottom-up wipe driven by viewport entry.

Two gotchas worth remembering:

- **three clones the `uniforms` object** passed as a JSX prop. Mutating the memoized
  object does nothing — always write through `materialRef.current.uniforms`.
- A custom `ShaderMaterial` gets **no automatic colour-space conversion**, so
  `new THREE.Color('#0b0a09')` decodes to near-linear-black. Colours are passed as raw
  sRGB `Vector3`s instead.

## Adding real work images

The plates are procedurally generated ([plate-texture.ts](src/components/webgl/plate-texture.ts))
so the site is complete with zero assets. To use a real screenshot:

1. Drop it at `public/work/<id>.jpg` (4:3 reads best).
2. Set `image: "/work/<id>.jpg"` on that project in [content.ts](src/lib/content.ts).

Everything else — copy, ordering, stack chips, experience rows, numbers — lives in that
same file. No copy is hard-coded in components.

## Design tokens

[globals.css](src/app/globals.css). Ink `#0b0a09`, bone `#ede7de`, signal `#ff4d19`.
Instrument Serif (display) / Familjen Grotesk (body) / Martian Mono (meta).

Note: Tailwind v4 only emits theme variables that generated utilities reference, so the
`--font-*` aliases are restated in a `@layer base :root` block for the hand-written
classes. Removing that block silently drops the display font back to system sans.

## Motion budget

All reveals are CSS transitions toggled by one IntersectionObserver class flip
([Reveal.tsx](src/components/Reveal.tsx)) — nothing animates on the main thread during
scroll. `prefers-reduced-motion` disables Lenis, the grain drift, the marquee, and all
reveal transforms.
