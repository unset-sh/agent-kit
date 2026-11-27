# org-0024. Generate OpenAPI with the official Elysia plugin

Status: accepted (2026-11-27, Alex: "yes use official pluggin and stop commiting the yaml").

## Context

org-0015 point 1 made Elysia's TypeBox route schemas the internal API contract and required a committed,
sorted `openapi.yaml`. org-0017 point 3 retained that generated file for non-web consumers when web chose
Eden. org-0020 moved Eden's declaration-only contract onto a workspace link.

The implementation review found no current runtime consumer of the YAML snapshot. Its machine reader was
the drift check; web imports the separate `App` declaration. The snapshot also provides an offline reference
and a visible contract diff in a pull request.

The official `@elysia/openapi` plugin generates documentation directly from Elysia routes. With the plugin
mounted, its defaults serve the documentation UI at `/openapi` and the JSON specification at `/openapi/json`;
no committed YAML is required. This was checked against `@elysia/openapi` 1.4.17 and Elysia 1.4.32, and the
[official plugin documentation](https://elysiajs.com/plugins/openapi).

## Decision

1. **Use the official Elysia OpenAPI plugin.** Generate the internal API documentation and JSON specification
   from the registered route schemas. Stop committing the generated YAML and retire its writer and snapshot
   drift check.
2. **The route schemas remain authoritative.** Keep TypeBox request and response schemas, runtime validation
   and meaningful contract tests. Tests verify the plugin's generated operations, response schemas and media
   types against the API contract; removing a snapshot does not remove contract verification.
3. **Eden stays separate.** Keep the generated, declaration-only `App` export, its drift check and web's
   workspace consumption under org-0020. Web does not switch to a client generated from OpenAPI.
4. **The API boundary stays internal.** Documentation describes the application's existing route wrappers;
   this does not mount Better Auth's own handler or create a public product API.

This supersedes only org-0015 point 1's committed-YAML generation and maintenance requirement and org-0017
point 3. TypeBox route schemas and the other decisions remain in force, including org-0020's Eden workspace
link. The original records retain their historical text and receive status pointers to this record.

## Consequences

- Route changes no longer require a generated YAML commit or its serialization dependency. Reviewers inspect
  route schemas and contract tests; the documentation endpoint reflects the running application.
- The repository no longer supplies that offline snapshot or its generated YAML diff. No current runtime
  consumer needs migration; a future consumer's export needs must be established when it is introduced.
- Product implementation and documentation adopt this decision in their own reviewed change. This record
  alone does not install the plugin, expose an endpoint or remove an artifact.
- Repository ownership and dependency relationships do not change, so the organisation map needs no change.
