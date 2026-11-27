# OpenFGA spike files (2026-11-24)

Supporting files for `notes/openfga-authorization/`. Not shipped in the kit.

- `model/`: the modular Unset model (`fga.mod` and five `.fga` modules).
- `tests.fga.yaml`: run with `fga model test --tests tests.fga.yaml` (CLI v0.9.0): 23/23 checks pass.
- `spike.ts`, `del.ts`, `down.ts`: `@openfga/sdk` 0.9.8 on Bun against a local server with preshared key
  `spikekey`. `spike.ts` expects `../model.json` from `fga model transform --file model/fga.mod`.
