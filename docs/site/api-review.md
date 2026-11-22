---
title: "API design and review"
description: "Applicable Google AIPs, governing protocols and compatibility review for unset.sh APIs."
---

# API design and review

API changes use applicable approved [Google AIPs](https://google.aip.dev/1) as the default design and review
reference. Their scope matters: the governing protocol and existing compatibility commitments determine how
the guidance applies. AT Protocol and Matrix interfaces follow their supported protocol specifications.

The canonical agent guidance is section 4, “API and Contract Design”, in
`skills/org-principles/workflow-and-change-management.md`. This page summarizes that policy for contributors.

For an API design or change, identify its consumers and supported versions. In the design note or pull
request, cite the relevant AIP numbers and URLs, protocol sections, supported protocol/SDK versions, and the
source revision or date consulted. Explain material deviations from applicable guidance.

Use [AIP-180](https://google.aip.dev/180) to assess source compatibility, wire compatibility and expected
behavior. Additions still require review: new required fields, defaults, enum values or pagination can break
consumers. Verify meaningful consumer/provider behavior as well as schema validity.

Follow [AT Protocol Lexicon evolution](https://atproto.com/specs/lexicon#lexicon-evolution) for Lexicons and
the supported [Matrix specification](https://spec.matrix.org/) for Matrix interfaces. Google-specific API
conventions do not replace those requirements. Private interfaces can evolve with their consumers; every
internal function does not need a permanent public compatibility promise.

The source guidance was consulted on 2026-11-22. Check the relevant current guidance or supported version
when making an API change. This documentation does not upgrade a protocol or establish an automated API gate.
