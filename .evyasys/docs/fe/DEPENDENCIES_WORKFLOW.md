> Not applicable — this project has no frontend. The only runtime dependency is `node-fetch ^3.3.2` (for PM tool and notification HTTP calls). Lazy-loaded dependencies (`pdfkit`, `nodemailer`) are installed at first use via `scripts/lib/ensure-package.js`.
>
> For adding any new Node.js dependency to the plugin: (1) verify it is actively maintained and has no known critical CVEs, (2) add it to `package.json` as a runtime dependency if needed at hook execution time, or as a devDependency if only needed for tests/tooling, (3) update `STACK.md` with the new entry.
