# Review-Dev Checklist

## Before showing the report

- [ ] Read the story ACs in full — not just the title
- [ ] Read the complete diff (not just --stat)
- [ ] Read the full content of every changed file (not just the diff chunk)
- [ ] Every Critical/Important finding cites a specific file path and line number
- [ ] Every AC has been checked — either a test found, or flagged Critical
- [ ] YAGNI check done — unused code searched with grep before flagging as missing
- [ ] Diff scope checked — files outside expected scope identified
- [ ] Debug/TODO/FIXME markers checked
- [ ] Security entry points verified (auth, input validation, secrets)
- [ ] No performative language ("great implementation", "looks good") — findings only

## Before issuing GO

- [ ] All Critical items either fixed (with evidence) or formally waived by the user
- [ ] Important items addressed or deferred with documented justification
- [ ] Re-diff run after fixes to confirm changes are actually there
- [ ] Report saved to `docs/stories/<id>_CodeReview.md`
