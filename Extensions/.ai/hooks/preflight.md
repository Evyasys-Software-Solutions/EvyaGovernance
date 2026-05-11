# Preflight Hook

Run before any `/evya createstory` execution.

Checks:
- required files available
- input attachments present or referenced
- repo path readable
- board integration configured
- story template available
- checklist available

Fail fast if a mandatory condition is missing.
