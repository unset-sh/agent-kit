Unset — End-to-End Encryption & Zero-Knowledge Storage Architecture

Document type: Security Architecture Review & Technical Proposal
Project: Unset
Status: Proposed — Architecture Design
Target stack: Bun, TypeScript, AT Protocol, AT Protocol Spaces
Primary objective: Provide user-controlled, end-to-end encrypted personal storage with a zero-knowledge backend, trusted-device access, and user-controlled recovery.

1. Executive Summary

Unset aims to provide a privacy-focused social platform built around AT Protocol identities, permissioned data storage, and strong user control over personal information.

A central component of this vision is a private storage architecture in which sensitive user information remains encrypted throughout storage, synchronization, and transmission.

The proposed architecture combines:

AT Protocol Spaces for permissioned data access.
AT Protocol blobs for encrypted file storage.
Client-side encryption and decryption.
XChaCha20-Poly1305 authenticated encryption.
Argon2id for password-based key derivation.
HKDF-SHA-256 for key derivation.
X25519 for appropriate public-key key-establishment operations.
Hardware-backed device security where available.
User-controlled recovery passphrases.
Independent frontend delivery and release verification.

The backend, including Unset's Bun and TypeScript infrastructure, should coordinate storage, permissions, identity, synchronization, and recovery metadata without requiring access to plaintext encryption keys or sensitive user content.

The fundamental principle is:

Users control their encryption keys. Unset provides the infrastructure without requiring the ability to decrypt their private information.

This architecture aims to make Unset's ordinary backend compromise insufficient, by itself, to expose users' encrypted personal information.

2. Security Objectives

The architecture should satisfy the following objectives.

2.1 Confidentiality

Sensitive information must be encrypted on the user's device before leaving the trusted client environment.

Unset's backend, database, and PDS infrastructure should only receive encrypted content.

2.2 Integrity

Encrypted information must be protected against unauthorized modification.

Authenticated encryption should detect ciphertext modification, while record versioning and rollback detection should address the replacement of newer records with older valid records.

2.3 User-controlled keys

Unset must not require access to plaintext master encryption keys.

Users should be able to recover their encrypted information without relying on Unset possessing a universal decryption key.

2.4 Device security

Users should be able to authorize trusted devices, protect local access using biometrics or a PIN, and revoke lost or compromised devices.

2.5 Permissioned storage

AT Protocol Spaces should control access to private records and associated blobs where supported by the relevant implementation.

2.6 Deletion and portability

Users should be able to delete Unset-managed private data, remove individual Spaces, revoke devices, and leave Unset without surrendering their AT Protocol identity.

3. High-Level Architecture

The architecture consists of three principal trust domains.

3.1 Client-side cryptographic environment

Responsible for:

Encryption and decryption.
Master key generation.
Data encryption key generation.
Device key management.
Recovery operations.
Local plaintext processing.
Private document access.

This is the primary trusted environment.

3.2 Unset backend

Built using Bun and TypeScript.

Responsible for:

AT Protocol authentication and integration.
Space management.
Authorization coordination.
Blob upload and retrieval coordination.
Encrypted key-envelope storage.
Device enrollment metadata.
Recovery metadata.
Account deletion workflows.
Synchronization orchestration.

The backend must not require plaintext master keys or plaintext sensitive content.

3.3 AT Protocol storage infrastructure

Responsible for:

Permissioned Space records.
Encrypted blob storage.
Data synchronization.
Identity-associated storage.
Permission enforcement according to the Spaces implementation.

Important: Spaces provide permissioned access, not end-to-end encryption. Client-side encryption remains necessary.

4. Cryptographic Design
4.1 Primary encryption algorithm

XChaCha20-Poly1305

Recommended for encrypted personal documents, reports, records, and blobs.

Properties:

256-bit encryption key.
192-bit nonce.
Authenticated encryption.
Confidentiality and integrity protection.
Practical random nonce generation.
Good software performance across a broad range of hardware.

Implementation should use a maintained, audited cryptographic library rather than a custom implementation.

Recommended library:

libsodium / libsodium.js.

Official documentation: https://doc.libsodium.org/

4.2 Key derivation

Argon2id

Used to derive encryption-related keys from user-provided passphrases.

Requirements:

Unique random salt for each derivation context.
Versioned derivation parameters.
Parameters calibrated against supported devices.
Memory-hard configuration.
Protection against offline password guessing.

HKDF-SHA-256

Used for deriving purpose-specific keys from high-entropy master secrets.

Different purposes should use distinct derivation contexts.

Examples:

Data-key wrapping.
Device enrollment.
Recovery.
Specific cryptographic protocol operations.

Passwords must never be used directly as encryption keys.

4.3 Public-key cryptography

X25519

Can be used for establishing shared secrets between trusted devices or users.

Shared secrets must be passed through an appropriate key-derivation process before being used as encryption keys.

For multi-device and multi-user communication, the complete key-establishment protocol requires independent review.

4.4 Encryption format versioning

Every encrypted object must carry an explicit format version.

The format should identify:

Algorithm identifier.
Encryption format version.
Nonce.
Ciphertext.
Authentication tag, where represented separately by the chosen library.
Key identifier.
Relevant encrypted metadata.
Required derivation and wrapping information.

The design must permit future migration to alternative cryptographic algorithms.

The initial implementation should support one well-reviewed encryption construction rather than unnecessarily supporting multiple algorithms.

5. Envelope Encryption

Unset should use envelope encryption rather than encrypting all user information directly with a single master key.

5.1 Conceptual key hierarchy

The proposed hierarchy is:

User-controlled recovery secret

Protects a recovery key or recovery-encryption capability.

↓

User master encryption key

Provides the root of the user's encryption hierarchy.

↓

Key-encryption keys

Protect data encryption keys and device-specific key envelopes.

↓

Data encryption keys

Encrypt individual documents, reports, and collections.

↓

Encrypted blobs and records

Stored through AT Protocol Spaces and associated storage infrastructure.

5.2 Data encryption keys

Different sensitive data categories should have independent encryption keys where practical.

Examples:

Private profile information.
Personal identity information.
Privacy preferences.
Footprint reports.
Personal documents.
Private activity history.

This enables more granular deletion, sharing, and key rotation.

The actual hierarchy should minimize unnecessary key duplication and avoid creating excessive key-management complexity.

5.3 Key rotation

The system should support:

Device-key rotation.
Recovery-key rotation.
Data-encryption-key rotation.
Rewrapping existing data keys.
Full re-encryption when necessary.

Changing a wrapping key should not require re-encrypting every document if the underlying data-encryption keys remain unchanged.

6. AT Protocol Spaces Integration

Spaces should act as the permissioned storage layer.

6.1 Identity association

Each user's private storage should be associated with their AT Protocol DID.

Unset should distinguish between:

AT Protocol identity.
Unset application account.
Individual Space ownership.
Device registrations.
Encryption key identifiers.

A DID should be used as an identity reference, not treated as an encryption key or proof of exclusive ownership of every associated encryption secret.

6.2 Proposed Space organization

Possible organization:

Personal Privacy Space

Privacy settings.
Private preferences.
Footprint reports.
Personal security configuration.

Personal Identity Space

Sensitive personal information.
Private identity notes.
Private profile information.

Private Social Space

Private content.
Restricted social interactions.
Shared information.

The exact Space structure should be determined after validating the public beta's ownership, permission, synchronization, and deletion semantics.

6.3 Encrypted blobs

Sensitive files should be encrypted before upload.

The resulting ciphertext can be uploaded as a blob and referenced by an appropriate record in a private Space.

The Space record may contain:

Blob reference or CID.
Encryption format version.
Encryption algorithm identifier.
Key identifier.
Nonce or associated encryption metadata.
Object version.
Encrypted metadata where applicable.

The actual blob-storage behavior, access checks, garbage collection, and deletion semantics must be verified against the selected PDS implementation.

Possession of a CID should never be treated as authorization to decrypt the underlying content.

6.4 Important limitation

Spaces are not an end-to-end encryption system.

PDS operators may still observe operational metadata such as storage size, identifiers, access activity, and synchronization behavior.

Client-side encryption is responsible for protecting content confidentiality.

7. Trusted Device Architecture

Each trusted device should have its own cryptographic identity.

7.1 Device enrollment

When a user adds a device:

The new device generates its own cryptographic key material.
The device authenticates the user.
An existing trusted device or recovery mechanism authorizes enrollment.
The user's relevant encryption key is securely wrapped for the new device.
The new device receives the encrypted key envelope.
The new device becomes registered as trusted.

The exact enrollment and key-transfer protocol must be reviewed independently.

7.2 Hardware-backed protection

Use available platform security capabilities.

Apple:

Secure Enclave.
Keychain.
Local biometric authorization.

Android:

Android Keystore.
StrongBox where available.
BiometricPrompt.

Web:

WebAuthn for authentication and device authorization.
Available platform-backed cryptographic capabilities.
Carefully designed local key storage.

WebAuthn authentication should not be confused with automatic encryption-key recovery.

7.3 Device revocation

Users should be able to:

View trusted devices.
View device enrollment dates.
See last successful activity.
Revoke a lost device.
Remove outdated devices.
Trigger appropriate key rotation.

Revoking a device prevents future authorized access, but cannot erase plaintext or keys previously obtained by that device.

8. PIN and Password Protection

Users should have a convenient local unlock mechanism.

Possible methods:

Biometrics.
Device PIN.
User-selected vault password.
Platform secure authentication.

The preferred experience is biometric authentication on supported devices, with a secure fallback.

A short PIN must not simply be used as an offline encryption key.

If an encrypted key envelope is protected by a low-entropy PIN, an attacker who obtains that envelope may perform offline guessing.

Use hardware-backed key protection or a stronger secret-based derivation mechanism.

9. Master Recovery Passphrase

Recovery is a foundational part of the architecture.

Users should be able to recover their encrypted information even if all trusted devices are lost.

9.1 Recovery passphrase generation

Generate a random passphrase using a cryptographically secure random generator.

A proposed initial format:

Seven or more randomly selected words.
A well-defined, sufficiently large word list.
Clearly specified encoding.
Strong entropy.
Versioned recovery format.

Seven uniformly selected words from a 7,776-word list provide approximately 90.6 bits of entropy.

For particularly sensitive applications, a longer recovery secret should be considered.

9.2 Recovery workflow
User creates their Unset account.
The client generates the recovery secret.
The recovery secret protects a recovery key or recovery-encryption capability.
The corresponding encrypted recovery envelope is stored.
The user saves the passphrase in a password manager.
The user verifies recovery readiness.

The passphrase must never be transmitted to Unset or stored in plaintext on the backend.

9.3 Password-manager compatibility

Users should be able to save their recovery passphrase in:

1Password.
Bitwarden.
KeePass.
iCloud Passwords.
Other password managers.

Unset should provide convenient copying and a recovery-kit download.

It should not automatically upload the passphrase to a third-party password manager.

9.4 Recovery requirements

Recovery should work without an existing trusted device.

The recovery envelope must remain available for as long as the user expects to retain recoverable encrypted information.

Unset should provide a clear warning:

If the user loses every trusted device, recovery passphrase, and independent backup, their encrypted information may be permanently unrecoverable.

9.5 Recovery verification

Users should be encouraged to verify that they can access their recovery material.

Unset should track recovery readiness without collecting the plaintext recovery secret.

10. Backend Architecture — Bun and TypeScript

The backend should coordinate security operations without becoming a plaintext processing environment.

Suggested organization:

text
src/
  domains/
    privacy/
      encryption/
        encryption.types.ts
        encryption-version.ts

      key-management/
        key-envelope.service.ts
        key-metadata.service.ts
        key-rotation.service.ts

      recovery/
        recovery.service.ts
        recovery-metadata.service.ts

      devices/
        device-enrollment.service.ts
        device-revocation.service.ts

      private-storage/
        private-storage.service.ts
        blob-reference.service.ts

      access-control/
        space-access.service.ts

  infrastructure/
    cryptography/
      libsodium.adapter.ts

    atproto/
      spaces.adapter.ts
      blob-storage.adapter.ts

    database/
      private-storage.repository.ts
      device.repository.ts
      key-envelope.repository.ts


The exact implementation should preserve a strict separation between cryptographic operations and backend coordination.

10.1 Backend responsibilities

The backend may:

Store encrypted key envelopes.
Store encrypted metadata.
Manage device registrations.
Coordinate Space creation.
Coordinate blob operations.
Track encryption versions.
Handle deletion workflows.
Manage authorization and account lifecycle.
10.2 Backend restrictions

The backend must not:

Receive plaintext master encryption keys.
Receive plaintext recovery passphrases.
Decrypt private user documents.
Log plaintext sensitive content.
Require decryption to perform ordinary storage operations.
Store universal decryption keys.
Silently bypass client-side encryption.

These restrictions should be enforced through architecture, code review, automated tests, and security policies.

11. Protecting Against a Compromised Backend

A zero-knowledge architecture must also consider the possibility of a compromised backend distributing malicious application code.

A malicious client could steal plaintext or encryption keys after a user unlocks their vault.

This is known as the malicious-client problem.

11.1 Separate trust domains

Separate:

Social application.
Private cryptographic application.
Backend.
Build and deployment infrastructure.

The private vault should use a separate security origin from the ordinary social application.

The social application should not have unrestricted access to the vault's JavaScript environment, plaintext, or key material.

11.2 Protect frontend releases

Implement:

Independent release signing.
Immutable release artifacts.
Reproducible builds where practical.
Build provenance.
Independent production deployment approvals.
Protected signing keys.
Dependency auditing.
Release transparency.

Signing credentials must not be available to ordinary application processes or untrusted CI jobs.

11.3 Frontend security

For the private application:

Restrictive Content Security Policy.
No unnecessary third-party JavaScript.
Strict dependency management.
Subresource Integrity where appropriate.
Secure origin isolation.
Minimal service-worker privileges.
No analytics access to sensitive content.

These controls reduce risk but do not independently defeat a compromised trusted release pipeline.

11.4 Independent verification

Publish signed release manifests and build provenance.

Consider an independently distributed verifier that allows users or security researchers to verify published application artifacts.

A compromised application must not be allowed to serve as the sole authority verifying its own integrity.

12. Privacy Metadata Protection

Zero-knowledge content encryption does not automatically hide metadata.

Potentially observable information includes:

User DID.
Space identifiers.
Blob CIDs.
File sizes.
Upload timestamps.
Access patterns.
Synchronization activity.
IP addresses.
Device information.

Mitigations should include:

Encrypting filenames and sensitive metadata.
Avoiding personal identifiers in blob names.
Minimizing application logs.
Restricting access to operational metadata.
Applying retention policies.
Avoiding unnecessary analytics.
Considering batching or padding where the privacy benefit justifies the operational cost.

Unset must clearly distinguish content confidentiality from metadata privacy.

13. Deletion and Account Lifecycle

Users should have independent controls for:

Delete a Space

Remove the relevant private data environment.
Revoke associated permissions.
Remove associated records and blobs where supported.

Delete Unset Account

Remove Unset-managed application data.
Delete associated Spaces where authorized.
Delete associated encrypted records and blobs where supported.
Remove device registrations.
Apply documented retention and backup policies.

Disconnect AT Protocol Identity

Stop using the identity.
Do not automatically delete the user's AT Protocol account.

A deletion ledger should track incomplete deletion operations and support retries.

Important limitations:

Deleting a Space does not necessarily erase every previously downloaded copy.
Blob garbage collection may be asynchronous.
Other members may retain information they previously obtained.
Infrastructure backups may have separate retention periods.

Deletion guarantees must reflect actual PDS behavior.

14. Threat Model

The system should explicitly consider the following threats.

Threat	Primary mitigation
Database compromise	Client-side encryption
PDS operator accessing content	Client-side encryption
Unauthorized Space access	AT Protocol authorization
Stolen encrypted blobs	Strong authenticated encryption
Stolen device	Hardware-backed keys and local unlock
Lost devices	Recovery passphrase
Compromised backend	Separation of backend and client trust
Malicious frontend update	Release signing and independent verification
Malicious dependencies	Dependency auditing and release controls
Ciphertext modification	Authenticated encryption
Record rollback	Versioning and rollback detection
Stolen account credentials	Independent encryption keys
Device revocation	Key rotation and enrollment controls
14.1 Out-of-scope or partially mitigated threats

No architecture can guarantee protection against every threat.

The design must acknowledge:

A compromised operating system.
Malware operating within an unlocked device.
Malicious trusted application updates.
Users deliberately sharing decrypted information.
Previously downloaded copies.
Weak or stolen recovery secrets.
Coercion of users into revealing secrets.

These risks require explicit documentation rather than unrealistic security promises.

15. User Experience

The architecture should make strong security easy to use.

Users should not need to understand encryption algorithms, key hierarchies, or cryptographic terminology.

15.1 Onboarding
User authenticates using their AT Protocol identity.
Unset creates their private storage environment.
Their device generates cryptographic key material.
The user enables biometric or local PIN protection.
A recovery passphrase is generated.
The user saves it in a password manager or offline recovery kit.
Recovery readiness is verified.
15.2 Everyday usage

Encryption and decryption happen automatically.

Users can:

Save private documents.
Store privacy reports.
Manage private identity information.
Synchronize between trusted devices.
Manage private preferences.

They should not need to manually encrypt and decrypt each file.

15.3 Privacy Center

Provide a dedicated interface containing:

Encryption status.
Trusted devices.
Device revocation.
Recovery readiness.
Recovery passphrase management.
Private Space management.
Data deletion controls.
Privacy metadata settings.

Avoid misleading indicators that imply a security guarantee that has not actually been verified.

16. Implementation Roadmap
Phase 1 — Cryptographic foundations
Select and integrate a maintained cryptographic library.
Define a versioned encrypted-object format.
Implement key generation.
Implement authenticated encryption.
Implement envelope encryption.
Implement recovery-key protection.
Establish cryptographic test vectors.
Conduct an initial threat-model review.
Phase 2 — Private storage integration
Validate AT Protocol Spaces beta behavior.
Implement Space creation and ownership.
Implement encrypted blob uploads.
Implement encrypted record references.
Implement authorized retrieval.
Test membership changes.
Test revocation and deletion semantics.
Phase 3 — Device security
Implement device enrollment.
Implement hardware-backed key protection where supported.
Implement local unlock.
Implement biometric integration.
Implement device revocation.
Implement key rotation.
Phase 4 — Recovery
Generate recovery passphrases.
Implement encrypted recovery envelopes.
Implement recovery on a new device.
Provide password-manager-friendly recovery workflows.
Implement recovery verification.
Test complete device-loss scenarios.
Phase 5 — Application security
Separate the private vault origin.
Establish independent release signing.
Harden frontend deployment.
Introduce reproducible builds where practical.
Implement release transparency.
Audit frontend dependencies.
Test malicious-backend scenarios.
Phase 6 — Security validation
Independent cryptographic review.
External penetration testing.
Key-management review.
Recovery-system review.
PDS interoperability testing.
Deletion and backup-retention testing.
Incident-response preparation.
17. Recommended Initial Technology Stack
Area	Proposed technology
Backend	Bun + TypeScript
Cryptographic library	libsodium.js
Data encryption	XChaCha20-Poly1305
Password derivation	Argon2id
Key derivation	HKDF-SHA-256
Public-key operations	X25519
Device authentication	WebAuthn
Apple device protection	Secure Enclave / Keychain
Android device protection	Android Keystore / StrongBox
Browser protection	Web Crypto and supported platform security
Storage	AT Protocol Spaces
File storage	Encrypted AT Protocol blobs
Application delivery	Signed, independently approved releases

The cryptographic protocol and key hierarchy should be reviewed before production deployment. Library selection alone does not establish security.

18. Architectural Decisions Still Requiring Validation

The following decisions must be finalized before implementation:

Exact AT Protocol Spaces beta APIs and storage semantics.
Whether Spaces can satisfy the desired blob authorization and deletion behavior across supported PDS providers.
The precise master-key and data-key hierarchy.
Recovery passphrase entropy and derivation parameters.
Multi-device key enrollment and synchronization protocol.
Hardware-backed key support across browsers and native platforms.
Rollback protection and trusted version-state management.
Metadata privacy and retention requirements.
Independent frontend verification strategy.
Recovery and deletion guarantees.

No production security claim should depend on an unverified protocol assumption.

19. Final Architectural Principles

Unset's encryption system should follow these principles:

1. User-controlled encryption

Sensitive information is encrypted before leaving the trusted client.

2. Zero-knowledge backend

Unset does not require plaintext master keys or private user content.

3. Permissioned storage

AT Protocol Spaces provide access control, while client-side encryption provides confidentiality.

4. Trusted devices

Each device receives independently protected access to the user's encryption hierarchy.

5. Recoverability

Users can restore access using their own recovery passphrase without requiring Unset to possess a universal decryption key.

6. Independent application integrity

Backend compromise should not automatically permit unauthorized modification of the trusted encryption client.

7. Transparent limitations

Metadata exposure, malicious-client risks, device compromise, and previously downloaded copies must be acknowledged.

8. User autonomy

Users should be able to revoke devices, rotate keys, delete private storage, and leave Unset.

20. Final Vision

Unset should aim to provide an environment where users can participate in the AT Protocol ecosystem without surrendering control of their sensitive personal information.

AT Protocol provides portable identity and permissioned storage capabilities.

Unset adds an independently designed cryptographic layer that protects sensitive information from infrastructure operators and unauthorized parties.

The resulting architecture combines:

Portable identity.
Permissioned data storage.
End-to-end encryption.
Trusted-device security.
User-controlled recovery.
Independent application integrity.
Transparent data deletion.

Core philosophy:

"Your identity belongs to you. Your private information belongs to you. Your encryption keys belong to you."

Unset should make strong privacy practical without making everyday usage unnecessarily complicated.

Security commitment: Unset must not require access to plaintext user encryption keys or sensitive private content to provide its core services.

Unset — API Gateway, Access Control & Policy Enforcement Architecture

Document type: Security Architecture Extension & Technical Proposal
Project: Unset
Status: Proposed — Architecture Design
Target stack: Bun, TypeScript, OpenAPI 3.1 (YAML)
Related systems: AT Protocol, Matrix, Unset Encryption & Recovery Vault

1. Executive Summary

Unset requires a centralized API security and access-control architecture capable of controlling access to individual API endpoints, API groups, application features and administrative functionality.

The proposed architecture introduces a centralized API Gateway and Policy Enforcement Layer implemented using Bun and TypeScript.

The system will provide:

Centralized API authentication.
Permission-based authorization.
Multi-factor authentication (MFA).
Step-up authentication for sensitive operations.
Trusted-device verification.
API availability controls.
Feature flags and beta access restrictions.
Subscription and entitlement-based access.
API key and service credential management.
Rate limiting and abuse prevention.
IP and network-based access policies.
Security audit logging.
Centralized policy management.

The existing openapi.yml will remain the canonical API contract.

API access requirements should be documented alongside endpoint definitions using reusable OpenAPI security schemes and custom x-unset-policy extensions.

The Bun backend must enforce all security policies independently of frontend behavior.

Fundamental principle:

Every protected API request must be authorized according to an explicit, centrally managed security policy.

2. Architectural Objectives

The system should satisfy the following objectives.

2.1 Centralized access control

API authorization should be handled through a common policy enforcement mechanism rather than individually implemented in route handlers.

2.2 Fine-grained permissions

Access should be controllable at multiple levels:

API domain.
Individual endpoint.
HTTP method.
User account.
User role.
Service identity.
Subscription entitlement.
Trusted device.
Environment.
2.3 Strong authentication

Sensitive operations should require additional authentication, even when the user already has an active session.

2.4 Feature availability control

Unset administrators should be able to enable, restrict or disable API functionality without modifying application code or redeploying the backend.

2.5 Zero-trust authorization

Authentication alone must not grant unrestricted API access.

Every sensitive operation must be independently authorized.

2.6 Auditability

Security-relevant access decisions should be recorded to support incident investigation and administrative oversight.

3. High-Level Architecture

The architecture consists of the following components.

3.1 API Gateway

Implemented using Bun and TypeScript.

Responsible for:

Incoming request processing.
Request identification.
Authentication middleware.
Request validation.
Rate limiting.
API routing.
Security policy enforcement.
Response handling.
3.2 Authentication Service

Responsible for:

User session validation.
AT Protocol identity integration.
Unset account authentication.
API credential validation.
MFA verification.
Authentication freshness.
Service-to-service authentication.
3.3 Authorization Service

Responsible for:

Role-based access control.
Permission evaluation.
User-specific authorization.
Trusted-device verification.
Resource ownership verification.
Service permissions.
3.4 API Policy Engine

The central authority for API access decisions.

Responsible for evaluating:

API availability.
Required authentication.
Required permissions.
MFA requirements.
Trusted-device requirements.
Subscription entitlements.
Environment restrictions.
Network restrictions.
Rate limits.
3.5 Feature Gate Service

Responsible for enabling, disabling or restricting functionality.

3.6 Audit Service

Responsible for recording:

Authentication events.
Authorization decisions.
Failed access attempts.
MFA challenges.
Device enrollment and revocation.
Administrative changes.
API policy modifications.
4. Request Authorization Flow

Every protected API request should follow a consistent authorization sequence.

Receive incoming request.
Validate request structure.
Identify the requested API operation.
Check API availability.
Authenticate the requesting identity.
Resolve account and device context.
Evaluate required permissions.
Evaluate MFA and authentication freshness.
Evaluate feature and subscription entitlements.
Evaluate applicable rate limits.
Verify resource ownership and access scope.
Authorize or deny the request.
Execute the API operation.
Record the relevant security event.

Authorization should use a default-deny approach for protected endpoints.

A missing policy, invalid policy or unavailable policy engine must never result in unrestricted access.

5. API Security Levels

Unset should introduce standardized security levels.

Level 0 — Public

No user authentication required.

Examples:

Public health checks.
Public API metadata.
Public application configuration.
Level 1 — Authenticated

A valid Unset session or approved service credential is required.

Examples:

Basic account information.
User preferences.
Standard application operations.
Level 2 — Trusted Device

Requires authentication and an authorized device.

Examples:

Private documents.
Private storage retrieval.
Sensitive personal information.
Level 3 — Step-Up Authentication

Requires a valid session, appropriate permissions, trusted-device authorization where applicable and recent additional authentication.

Examples:

Matrix recovery operations.
Device enrollment.
Device revocation.
Recovery configuration changes.
Private data exports.
Level 4 — Restricted Administrative

Requires administrative authorization and strong authentication.

Examples:

Security configuration.
API policy management.
Administrative account operations.
Signing credential management.

Security levels are minimum requirements. Additional endpoint-specific restrictions may apply.

6. Multi-Factor Authentication

Unset should support multiple authentication methods.

Preferred methods:

WebAuthn.
Passkeys.
Hardware security keys.
TOTP authenticator applications.
Platform-backed authentication.

SMS should not be the primary second-factor mechanism.

6.1 Step-up authentication

Sensitive operations should trigger additional authentication.

The system should support:

Configurable authentication freshness.
Operation-specific MFA requirements.
Short-lived authorization grants.
Device-bound authorization.
Replay protection.
Automatic grant expiration.

For example, exporting Matrix recovery material should require a recent step-up authentication event.

6.2 Authentication independence

MFA must remain independent of encryption recovery.

Successfully completing MFA must not automatically reveal:

Master encryption keys.
Recovery passphrases.
Matrix private keys.
Decrypted room keys.
Private document contents.

Possessing an encryption recovery secret must not automatically grant administrative API permissions.

7. Trusted Device Authorization

The API Gateway should integrate with Unset's trusted-device architecture.

Device authorization should consider:

Device registration status.
Device identifier.
Device public-key association.
Enrollment date.
Last successful activity.
Revocation status.
Applicable authentication assurance.

Sensitive API operations may require a trusted device.

Revoking a device should immediately prevent new authorized recovery operations through that device, subject to session invalidation and propagation requirements.

Previously obtained plaintext or encryption keys cannot be remotely erased.

8. API Gating and Availability Management

Unset should provide centralized control over API availability.

Administrators should be able to control functionality at multiple levels.

8.1 API domain gating

Enable or disable entire API domains.

Examples:

Privacy API.
Matrix API.
Recovery API.
Social API.
Administrative API.
8.2 Endpoint gating

Enable or disable individual endpoints.

8.3 HTTP method gating

Allow or deny specific operations without disabling an entire resource.

8.4 Environment gating

Control API availability separately across:

Development.
Testing.
Staging.
Production.
8.5 User-specific gating

Restrict functionality to:

Selected users.
Internal administrators.
Beta testers.
Approved developers.
Specific account groups.
8.6 Subscription gating

Allow access according to subscription or entitlement status.

Subscription status must never override security requirements.

8.7 Maintenance mode

Allow administrators to temporarily disable an API domain or endpoint while displaying an appropriate maintenance response.

All gates must be enforced by the backend.

Hiding a frontend button or route does not constitute API security.

9. Centralized API Policy Definitions

API security policies should be centrally defined.

An illustrative policy configuration:

yaml
apiPolicies:

  public:
    enabled: true
    authentication: none

  authenticated:
    enabled: true
    authentication: required

  trusted:
    enabled: true
    authentication: required
    trustedDevice: true

  sensitive:
    enabled: true
    authentication: required
    trustedDevice: true
    stepUpAuthentication: true
    maxAuthenticationAge: 300

  recovery:
    enabled: true
    authentication: required
    trustedDevice: true
    recoveryAuthorization: required
    stepUpAuthentication: true

  administrative:
    enabled: true
    authentication: required
    roles:
      - admin
    trustedDevice: true
    stepUpAuthentication: true


This is an application policy configuration, separate from the canonical OpenAPI YAML document.

Policies should support inheritance, endpoint-specific overrides and explicit precedence rules.

An endpoint-specific policy must never weaken a mandatory global security requirement.

10. OpenAPI Integration

Unset uses YAML-based OpenAPI as its canonical API contract.

The root specification is:

openapi.yml

API security requirements should be documented using:

Standard OpenAPI security schemes.
Reusable components.
Shared schema definitions.
Custom x-unset-policy extensions.

Example:

yaml
paths:

  /v1/matrix/recovery/export:
    post:
      tags:
        - Matrix
        - Security

      operationId: exportMatrixRecovery

      summary: Export encrypted Matrix recovery material

      security:
        - bearerAuth: []

      x-unset-policy:
        enabled: true
        accessLevel: sensitive

        permissions:
          - matrix.recovery.export

        requireTrustedDevice: true
        requireStepUp: true

        maxAuthenticationAge: 300

        rateLimit:
          requests: 3
          windowSeconds: 60

      responses:
        '200':
          description: Export completed

        '401':
          description: Authentication required

        '403':
          description: Access denied

        '404':
          description: Resource unavailable

        '423':
          description: Temporarily locked

        '428':
          description: Step-up authentication required

        '429':
          description: Rate limit exceeded


The x-unset-policy extension is descriptive metadata.

The Bun backend must independently enforce the associated policy.

OpenAPI definitions must never be treated as the enforcement mechanism themselves.

11. API Credential Management

Unset should support several credential types.

Personal API tokens

For user-controlled integrations.

Application API keys

For registered applications and approved integrations.

Service credentials

For internal service-to-service communication.

Administrative credentials

For restricted operational access.

Credentials should support:

Explicit permissions.
Expiration.
Revocation.
Rotation.
Last-used metadata.
Scope restrictions.
Environment restrictions.
Audit logging.

API credentials should be stored securely, preferably using one-way verification for opaque tokens.

A valid API key must not bypass mandatory user authentication, MFA or authorization requirements.

12. Rate Limiting and Abuse Prevention

The API Gateway should support configurable rate limits.

Examples:

Per-user limits.
Per-IP limits.
Per-device limits.
Per-API-key limits.
Per-endpoint limits.
Per-account limits.

Sensitive operations should have stricter limits.

Additional protections should include:

Request-size limits.
Concurrent-operation limits.
Authentication failure throttling.
Recovery challenge throttling.
Abuse detection.
Temporary security lockouts.

Distributed deployments should use shared rate-limit state rather than relying exclusively on individual Bun process memory.

13. Network and Origin Restrictions

The API Policy Engine should support network-level restrictions where appropriate.

Potential controls:

IP allowlists.
IP denylists.
Administrative network restrictions.
Trusted integration networks.
Origin validation.
Environment-specific access policies.

CORS must not be treated as an authentication or authorization mechanism.

IP restrictions should supplement, not replace, identity and permission checks.

14. Bun and TypeScript Implementation

Suggested organization:

text
src/
  api/
    gateway/
      api-gateway.ts
      request-context.ts

    middleware/
      authentication.middleware.ts
      authorization.middleware.ts
      api-policy.middleware.ts
      feature-gate.middleware.ts
      rate-limit.middleware.ts
      step-up.middleware.ts

    policies/
      api-policy.types.ts
      api-policy.registry.ts
      api-policy.service.ts

  domains/
    security/
      authentication/
      authorization/
      mfa/
      devices/
      audit/

    api-management/
      api-access.service.ts
      api-availability.service.ts
      api-entitlement.service.ts
      api-rate-limit.service.ts
      api-policy-management.service.ts

  infrastructure/
    database/
    cache/
    cryptography/


The gateway should remain responsible for coordinating security checks.

Individual domain services should still enforce resource ownership and domain-specific business rules.

The policy engine must not become a substitute for proper resource-level authorization.

15. Policy Management and Administration

Unset should provide an administrative interface for managing API access.

Administrators should be able to:

Enable or disable API domains.
Enable or disable individual endpoints.
Restrict APIs to beta users.
Configure required permissions.
Configure authentication levels.
Configure MFA requirements.
Set rate limits.
Restrict administrative access.
Configure subscription entitlements.
Review authorization failures.
Review security audit events.

Policy changes should require appropriate administrative permissions and step-up authentication.

Changes should be versioned, attributable and auditable.

Emergency restrictions should be available without requiring an application deployment.

16. Security Audit Logging

Record security-relevant events including:

Successful and failed authentication.
API authorization decisions.
MFA challenges and outcomes.
Trusted-device changes.
API credential creation and revocation.
Feature-gate changes.
Policy changes.
Administrative access.
Rate-limit violations.
Security lockouts.

Audit logs must not contain:

Plaintext recovery passphrases.
Encryption keys.
Private Matrix room keys.
Authorization tokens.
Sensitive document contents.
Unnecessary personal information.

Audit events should identify the relevant account, operation, timestamp, outcome and correlation identifier.

Administrative audit records should be protected against unauthorized modification.

17. Standard API Error Responses

Unset should establish consistent security-related HTTP responses.

Status	Meaning
400	Invalid request
401	Authentication required
403	Authorization denied
404	Resource unavailable or intentionally concealed
423	Temporarily locked
428	Additional authentication required
429	Rate limit exceeded
503	API temporarily unavailable

Responses should avoid disclosing sensitive policy details to unauthorized callers.

Where appropriate, use structured error codes and a consistent response schema.

18. Integration With Existing Unset Systems

The API Gateway and Policy Engine should integrate with the following systems.

Private Storage

Require authenticated, appropriately authorized devices.

Matrix Recovery

Require trusted-device authorization and step-up authentication for sensitive recovery operations.

Encryption Recovery Vault

Require independent recovery authorization.

MFA must not automatically grant encryption-key access.

Trusted Devices

Use the existing device registry and revocation infrastructure.

AT Protocol

Use the user's AT Protocol identity as an identity reference, not as proof of encryption-key ownership.

Administrative Services

Require explicit administrative permissions and strong authentication.

Subscription Management

Evaluate subscription entitlements independently of mandatory security policies.

19. Implementation Roadmap
Phase 1 — API Gateway Foundations
Implement centralized Bun API middleware.
Establish request context.
Introduce policy evaluation interfaces.
Implement default-deny behavior.
Establish standardized API errors.
Phase 2 — Authentication and Authorization
Integrate Unset authentication.
Implement permission-based authorization.
Integrate trusted-device verification.
Implement resource-level authorization.
Establish administrative roles.
Phase 3 — MFA and Step-Up Authentication
Integrate WebAuthn.
Integrate passkeys.
Implement TOTP.
Implement short-lived authorization grants.
Introduce authentication freshness requirements.
Phase 4 — API Gating
Implement API domain gating.
Implement endpoint gating.
Implement environment restrictions.
Implement user and group restrictions.
Implement beta access.
Implement maintenance mode.
Phase 5 — API Credentials and Rate Limiting
Implement personal API tokens.
Implement application credentials.
Implement service credentials.
Implement credential revocation.
Implement distributed rate limiting.
Phase 6 — OpenAPI Integration
Establish openapi.yml as the canonical contract.
Document API security requirements.
Introduce reusable policy extensions.
Validate API specifications in CI.
Generate client SDKs and TypeScript definitions.
Test implementation against the published API contract.
Phase 7 — Audit and Administrative Management
Implement security audit events.
Build API policy administration.
Introduce policy versioning.
Implement emergency API restrictions.
Test authorization failure scenarios.
Conduct an independent security review.
20. Final Architectural Principles

Unset's API security system should follow these principles:

Centralized enforcement: API access decisions are coordinated through a centralized policy enforcement layer.
Default deny: Protected APIs remain inaccessible unless an explicit policy authorizes access.
Fine-grained authorization: Access can be controlled at endpoint, operation, account, role and device levels.
Strong authentication: Sensitive operations require appropriate additional authentication.
Independent encryption security: API authentication must never substitute for encryption-key authorization.
Backend enforcement: API restrictions must be enforced server-side, independently of frontend visibility.
Configurable availability: API functionality can be enabled, restricted or disabled without modifying route implementations.
Auditable administration: Security-sensitive policy changes must be attributable and recorded.
Contract-first development: openapi.yml remains the canonical API contract.
Separation of concerns: Authentication, authorization, feature availability, rate limiting and business logic remain distinct responsibilities.
21. Final Vision

Unset should provide a centralized security architecture in which every API operation has an explicit and enforceable access policy.

Bun provides the API runtime and policy enforcement infrastructure.

TypeScript provides the implementation and shared application contracts.

OpenAPI YAML provides the canonical API specification.

The Policy Engine determines whether operations are permitted.

MFA and trusted devices provide additional assurance for sensitive operations.

Feature gating provides operational control over API availability.

The result is an API infrastructure capable of supporting public functionality, private storage, Matrix recovery, premium features, beta functionality and administrative operations without compromising the underlying zero-knowledge encryption architecture.

Core philosophy:

Every API should have a clearly defined access policy. Authentication should establish identity, authorization should establish permission, and the policy engine should determine whether the requested operation is allowed.

Unset — Authorization Architecture & Policy Enforcement

Document type: Security Architecture Review & Technical Proposal
Project: Unset
Status: Proposed — Architecture Design
Target stack: Bun, TypeScript, Elysia, SvelteKit, Eden Treaty
API specification: OpenAPI 3.1 YAML
Authorization engine: Native TypeScript initially, with optional Cerbos integration

1. Executive Summary

Unset requires a centralized authorization architecture capable of controlling access to application resources, API endpoints, private storage, Matrix recovery, trusted devices and administrative functionality.

The proposed architecture introduces a dedicated Authorization Service within the Bun and Elysia backend.

The Authorization Service will provide a consistent interface for evaluating whether a user, device or application is permitted to perform a particular operation on a resource.

The initial implementation should use native TypeScript authorization logic, avoiding unnecessary infrastructure dependencies during early development.

The architecture should remain compatible with external policy engines, particularly Cerbos Community Edition, allowing Unset to adopt a dedicated authorization engine as its permission model becomes more complex.

The fundamental principle is:

Every protected operation must pass through a consistent, server-side authorization mechanism.

Authentication establishes identity. Authorization establishes permission. Resource-level security establishes whether the requesting identity is entitled to access the specific resource.

These responsibilities must remain separate.

2. Architectural Objectives

The authorization system should satisfy the following objectives.

2.1 Centralized authorization

Authorization decisions should be coordinated through a shared service rather than independently implemented across API route handlers.

2.2 Fine-grained permissions

The system should support permissions at multiple levels:

User.
Role.
Organization.
Application.
Device.
Resource.
API endpoint.
HTTP operation.
Subscription entitlement.
2.3 Resource ownership

Users must only access resources they own or have explicitly been granted permission to access.

2.4 Trusted-device integration

Sensitive resources and operations should support additional device authorization requirements.

2.5 MFA integration

Sensitive operations should require appropriate additional authentication.

2.6 Extensibility

The authorization implementation should be replaceable without requiring changes to individual API routes or business services.

2.7 Zero-knowledge compatibility

Authorization must never require the backend to decrypt private user content or obtain plaintext encryption keys.

3. High-Level Architecture

The architecture consists of the following components.

3.1 Authentication Service

Responsible for establishing the identity of the requester.

Responsibilities:

User authentication.
AT Protocol identity integration.
Session validation.
Application credential validation.
MFA verification.
Authentication freshness.
Service identity verification.
3.2 Authorization Service

The central application authorization interface.

Responsibilities:

Permission evaluation.
Role evaluation.
Resource access checks.
Device authorization checks.
Contextual authorization.
Administrative authorization.
3.3 Resource Access Service

Responsible for verifying ownership and access rights for individual resources.

Examples:

Private documents.
Matrix recovery records.
Private Spaces.
User preferences.
Device registrations.
Shared social content.
3.4 API Policy Enforcement

Responsible for enforcing authorization requirements before protected API operations execute.

3.5 Optional External Policy Engine

Cerbos may be introduced as an external Policy Decision Point (PDP).

The Authorization Service remains the application-facing interface regardless of whether the underlying implementation uses native TypeScript or Cerbos.

4. Authorization Flow

Every protected API operation should follow a consistent sequence.

Receive the incoming request.
Authenticate the requesting identity.
Resolve the associated user, application and device context.
Identify the requested resource and operation.
Verify resource ownership or delegated access.
Evaluate required permissions.
Verify required MFA assurance.
Verify trusted-device requirements where applicable.
Evaluate relevant subscription or entitlement requirements.
Authorize or deny the operation.
Execute the corresponding business operation.
Record relevant security events.

Authorization must use a default-deny approach.

Missing policies, invalid authorization contexts and authorization service failures must never result in unrestricted access.

Resource ownership must be checked server-side, not inferred from identifiers supplied by the frontend.

5. Permission Model

Unset should initially support a straightforward permission model.

5.1 Roles

Possible initial roles:

User.
Moderator.
Administrator.
Internal service.
Developer.

Roles should group permissions rather than act as unrestricted access privileges.

5.2 Permissions

Permissions should describe specific operations.

Examples:

text
privacy.settings.read
privacy.settings.update

storage.document.read
storage.document.create
storage.document.delete

matrix.recovery.read
matrix.recovery.export
matrix.recovery.restore

devices.list
devices.enroll
devices.revoke

admin.users.read
admin.users.manage

admin.api-policy.read
admin.api-policy.manage


Permissions should be explicit and independently assignable.

5.3 Resource-level authorization

Access to a resource must also consider ownership and sharing relationships.

For example:

A user may have permission to read private documents generally, but that does not grant access to another user's documents.

The authorization system must evaluate both operation permissions and resource-level access.

5.4 Contextual authorization

Authorization decisions may depend on additional verified context:

Account identity.
Device registration.
Device revocation status.
MFA verification.
Authentication freshness.
Resource ownership.
Sharing relationships.
Application identity.
Environment.

Only trusted, server-verified context may be used for security decisions.

The backend must never accept claims such as mfa_verified: true directly from an untrusted frontend request.

6. Authorization Service Interface

The application should interact with authorization through a stable TypeScript interface.

Example:

typescript
export interface AuthorizationInput {
  userId: string
  resource: string
  action: string

  resourceId?: string

  context?: Record<string, unknown>
}

export interface AuthorizationResult {
  allowed: boolean
  reason?: string
  policyVersion?: string
}

export interface AuthorizationService {
  authorize(
    input: AuthorizationInput
  ): Promise<AuthorizationResult>
}


The application should depend on this interface rather than directly depending on Cerbos.

This allows the underlying authorization implementation to change without rewriting API routes.

The initial implementation should be a native TypeScript authorization service with explicit policies and thorough automated tests.

Avoid developing a custom general-purpose policy language.

7. Native TypeScript Implementation

Suggested organization:

text
apps/
  api/
    src/
      domains/
        security/
          authentication/

          authorization/
            authorization.interface.ts
            authorization.service.ts
            authorization.types.ts
            permission.registry.ts
            role.registry.ts
            resource-access.service.ts
            authorization.errors.ts

          mfa/
          devices/
          audit/


The initial implementation should prioritize:

Explicit permission definitions.
Clear resource ownership checks.
Centralized role mapping.
Consistent authorization errors.
Automated authorization tests.
Default-deny behavior.

Avoid scattering permission strings and security conditions throughout route handlers.

8. Optional Cerbos Integration

Cerbos Community Edition can be introduced when the authorization requirements become sufficiently complex.

Cerbos is an external Policy Decision Point that evaluates authorization policies and returns an ALLOW or DENY decision.

It supports:

YAML authorization policies.
Role-based access control.
Attribute-based access control.
Contextual authorization.
Resource policies.
Policy testing.
Independent policy deployment.

Cerbos should not become a mandatory dependency during initial development.

8.1 Integration architecture

The Authorization Service should expose the same interface regardless of implementation.

Possible implementations:

text
authorization/
  authorization.interface.ts

  authorization.service.ts

  providers/
    native-authorization.provider.ts
    cerbos-authorization.provider.ts


The native provider is used initially.

The Cerbos provider can replace or supplement it later.

8.2 Example Cerbos policy

An illustrative Matrix recovery policy:

yaml
apiVersion: api.cerbos.dev/v1

resourcePolicy:
  version: "default"
  resource: "matrix_recovery"

  rules:
    - actions:
        - export
      effect: EFFECT_ALLOW
      roles:
        - user

      condition:
        match:
          expr: |
            request.principal.attr.trusted_device == true &&
            request.principal.attr.mfa_verified == true


This example illustrates contextual policy evaluation.

Production policies must additionally enforce resource ownership, appropriate authentication freshness, recovery authorization and other relevant security conditions.

8.3 Cerbos limitations

Cerbos is an authorization engine, not a complete authentication or API management solution.

It does not independently provide:

User authentication.
Password management.
MFA enrollment.
Encryption-key recovery.
API gateway routing.
Feature availability management.
Application-specific resource ownership verification.

These responsibilities remain within Unset's own architecture.

9. API Integration

The Authorization Service must integrate with the Bun and Elysia API backend.

All protected endpoints should declare their authorization requirements.

Example:

typescript
const authorization = {
  resource: 'matrix_recovery',
  action: 'export',
  requireTrustedDevice: true,
  requireStepUp: true
}


This is illustrative metadata. The backend must enforce the requirements through actual middleware and verified security context.

API routes should not independently implement their own authentication and authorization systems.

The OpenAPI YAML specification should document the corresponding security requirements using reusable security schemes and custom x-unset-policy extensions.

The OpenAPI contract documents security requirements but does not replace backend enforcement.

10. Integration With Other Security Systems
10.1 Authentication

Authentication establishes the requesting identity.

The authorization system consumes verified identity information but does not implement authentication itself.

10.2 MFA

MFA provides additional authentication assurance.

Sensitive operations may require:

A recent WebAuthn assertion.
A verified passkey.
A TOTP challenge.
A short-lived step-up authorization grant.

MFA verification must be established server-side.

10.3 Trusted Devices

The authorization system should consume the trusted-device registry.

Revoked devices must not be permitted to perform operations requiring trusted-device authorization.

10.4 Encryption Recovery

Authorization to access an encryption recovery operation must remain separate from possession of encryption secrets.

MFA does not automatically grant decryption access.

Recovery authorization must not expose plaintext recovery passphrases or master encryption keys to the backend.

10.5 AT Protocol

AT Protocol DIDs may identify users and associated identities.

A DID alone must not establish ownership of encryption keys or unrestricted access to private resources.

10.6 Matrix

Matrix recovery and private room-key operations should have explicit authorization requirements.

The backend should not receive plaintext Matrix encryption keys merely to authorize an operation.

11. API Availability and Feature Gating

Authorization and API availability are separate concerns.

The Authorization Service determines whether an identity is permitted to perform an operation.

The API availability service determines whether that operation is currently enabled.

The system should support:

API domain enablement.
Endpoint enablement.
HTTP method restrictions.
Beta-user access.
Environment-specific availability.
Subscription entitlements.
Maintenance mode.
Administrative restrictions.

These checks should remain independent of the authorization provider.

Feature flags must never override mandatory security restrictions.

A disabled feature must remain inaccessible through direct API requests.

12. Security Requirements

The implementation must satisfy the following requirements.

Default deny

Unknown permissions and missing policies must result in denial.

Server-side enforcement

Frontend restrictions must never be considered sufficient authorization.

Resource ownership

Every resource operation must verify ownership or explicit delegated access.

Trusted context

Security-sensitive authorization attributes must originate from trusted backend services.

Fail closed

Authorization service failures must not result in unrestricted access.

Auditability

Security-relevant authorization decisions must be recorded.

Minimal information disclosure

Denial responses must not expose private resource information or internal authorization policy details unnecessarily.

Separation of concerns

Authentication, authorization, resource ownership, feature availability and encryption-key access must remain distinct responsibilities.

13. Audit Logging

The system should record:

Authorization requests.
Successful authorization decisions.
Denied operations.
Administrative permission changes.
Role modifications.
Device revocation.
Recovery authorization events.
Policy version changes.

Audit records should contain relevant identifiers, timestamps, actions, outcomes and correlation identifiers.

They must not contain:

Passwords.
Authentication tokens.
Recovery passphrases.
Encryption keys.
Plaintext Matrix room keys.
Sensitive document contents.

Audit storage should be protected against unauthorized modification.

14. Implementation Roadmap
Phase 1 — Authorization Foundations
Define the authorization interface.
Establish the permission registry.
Define initial roles.
Implement native TypeScript authorization.
Implement resource ownership checks.
Introduce default-deny behavior.
Establish automated policy tests.
Phase 2 — API Integration
Integrate authorization into Elysia middleware.
Introduce endpoint-level permission requirements.
Standardize authorization errors.
Integrate OpenAPI security metadata.
Validate protected endpoint coverage.
Phase 3 — Security Integration
Integrate MFA verification.
Integrate trusted-device authorization.
Integrate Matrix recovery permissions.
Integrate private storage permissions.
Implement administrative authorization.
Phase 4 — Advanced Authorization
Introduce contextual authorization.
Implement delegated resource access.
Introduce organization and application permissions.
Evaluate complex sharing relationships.
Phase 5 — Optional Cerbos Adoption
Evaluate whether native TypeScript policies remain sufficient.
Deploy Cerbos Community Edition if appropriate.
Implement the Cerbos provider.
Migrate selected policies.
Introduce policy versioning and CI validation.
Verify authorization parity between providers.
Phase 6 — Security Validation
Conduct authorization testing.
Test privilege escalation scenarios.
Test resource ownership boundaries.
Test device revocation.
Test authorization service failures.
Conduct independent security review.
15. Final Architectural Decisions

The following decisions are recommended:

Authorization is a mandatory backend capability.
Authorization is centralized through a dedicated TypeScript service.
Native TypeScript authorization is the initial implementation.
Cerbos Community Edition remains an optional future policy engine.
All protected API endpoints must use centralized authorization.
Resource ownership must be independently verified.
MFA and trusted-device requirements must use verified backend context.
Feature gating remains separate from authorization.
Authorization must follow default-deny principles.
The architecture must support replacing the authorization provider without rewriting API routes.
16. Final Vision

Unset should have a consistent authorization system capable of supporting increasingly sophisticated permission requirements without introducing unnecessary operational complexity.

The initial implementation should be small, understandable, testable and secure.

As Unset grows, the same architecture should support external policy engines, more advanced contextual authorization and centralized policy management.

The objective is not to build another authorization platform.

The objective is to ensure that every Unset service has a reliable and consistent way to determine who may access what, under which conditions.

Core philosophy:

Authentication establishes identity. Authorization establishes permission. Resource ownership establishes access rights. Encryption protects private content.

These security responsibilities must work together without becoming dependent on one another.

Unset — Authentication & Session Management Architecture

Document type: Security Architecture Review & Technical Proposal
Project: Unset
Status: Proposed — Architecture Design
Target stack: Bun, TypeScript, Elysia, SvelteKit, Better Auth, PostgreSQL
Identity provider: AT Protocol
Related systems: Unset API Gateway, Authorization Service, Trusted Device Architecture, Encryption & Recovery Vault

1. Executive Summary

Unset requires a centralized authentication and session-management architecture capable of supporting AT Protocol identities, secure application sessions, trusted devices, multi-factor authentication and sensitive security operations.

The proposed architecture adopts Better Auth as Unset's primary authentication and session-management framework, integrated into the Bun and Elysia backend.

AT Protocol will serve as an external identity provider. Users authenticate through AT Protocol OAuth, after which Unset validates their identity and establishes an independent application session through Better Auth.

This approach separates external identity authentication from application authentication.

Better Auth will provide:

Application session management.
Authentication infrastructure.
Account management.
Passkey and WebAuthn integration.
Multi-factor authentication.
Session expiration and revocation.
Authentication-related database management.
Authentication middleware and frontend integration.

Unset will retain responsibility for:

AT Protocol OAuth integration.
AT Protocol DPoP management.
DID verification and identity association.
Trusted-device registration and authorization.
Resource-level authorization.
API access policies.
Encryption-key authorization.
Zero-knowledge recovery.
Application-specific security requirements.

The fundamental principle is:

AT Protocol establishes external identity. Better Auth establishes the Unset application session. Unset's authorization architecture determines what that session can access.

Better Auth must not become responsible for encryption-key management or private vault recovery.

2. Architectural Objectives

The authentication architecture should satisfy the following objectives.

2.1 Centralized authentication

All Unset application authentication should use a consistent authentication service.

Individual API domains must not implement independent authentication mechanisms.

2.2 AT Protocol identity integration

Users should authenticate using their existing AT Protocol identity.

The authenticated DID should be associated with an Unset account.

2.3 Independent application sessions

AT Protocol OAuth credentials and Unset application sessions must remain separate.

An AT Protocol access token must never be treated as an Unset session token.

2.4 Trusted-device integration

Authentication sessions should be associated with individual devices.

Unset should support device registration, session visibility and revocation.

2.5 Strong authentication

Better Auth should provide the foundation for passkeys, WebAuthn and additional authentication factors.

Sensitive operations should support step-up authentication.

2.6 Zero-knowledge compatibility

Better Auth must not require access to encryption master keys, recovery passphrases or plaintext private documents.

2.7 Extensibility

Authentication should remain replaceable through an Unset-owned abstraction without requiring changes throughout the application.

3. High-Level Architecture

The architecture consists of six principal components.

3.1 SvelteKit frontend

Responsible for:

Authentication interface.
AT Protocol login initiation.
Better Auth client integration.
Session-aware application navigation.
Passkey authentication.
MFA interaction.
Session management interface.

The frontend must not independently determine whether a user is authorized to access protected resources.

3.2 Better Auth

The primary application authentication framework.

Responsible for:

Application user authentication.
Session creation.
Session validation.
Session expiration.
Session revocation.
Account management.
Passkey integration.
Two-factor authentication.
Authentication-related database operations.

Better Auth will be integrated directly into the Bun and Elysia backend.

3.3 AT Protocol OAuth Service

Responsible for:

OAuth authorization initiation.
Authorization callback handling.
PKCE.
Pushed Authorization Requests.
DPoP proof generation and verification.
OAuth token exchange.
DID verification.
External OAuth session management.
Token refresh and revocation where supported.

AT Protocol OAuth requirements must be implemented according to the AT Protocol OAuth specification.

3.4 Identity Resolution Service

Responsible for:

Mapping AT Protocol DIDs to Unset accounts.
Creating new account associations.
Preventing unauthorized identity linking.
Managing multiple identity associations where supported.
Resolving authenticated identities.

A DID should be treated as an identity reference, not as an encryption key.

3.5 Unset Session and Device Services

Responsible for:

Associating application sessions with devices.
Tracking trusted-device status.
Managing device registrations.
Coordinating session revocation.
Maintaining device security metadata.
Supporting device-specific authentication policies.
3.6 Authorization Service

Responsible for:

Permission evaluation.
Resource ownership.
API authorization.
Administrative permissions.
Trusted-device requirements.
MFA assurance requirements.
Contextual authorization.

Better Auth authentication must not automatically grant resource access.

4. Authentication Flow

The recommended authentication flow is:

User selects Continue with AT Protocol.
SvelteKit initiates the AT Protocol OAuth authorization flow.
The user authenticates with their selected AT Protocol identity provider.
The OAuth callback returns to Unset.
The backend validates the OAuth transaction.
The backend validates the authorization response and obtains the authenticated DID.
Unset resolves the corresponding application account.
The device identity is associated with the authenticated account.
Better Auth establishes a new Unset application session.
The browser receives an appropriate secure session cookie.
Subsequent API requests authenticate through Better Auth.
The Authorization Service independently evaluates permissions.

The AT Protocol OAuth session remains separate from the Better Auth application session.

5. Better Auth Integration

Better Auth should be integrated as a dedicated authentication subsystem.

Suggested organization:

text
apps/
  api/
    src/
      infrastructure/
        authentication/
          better-auth/
            better-auth.config.ts
            better-auth.client.ts
            better-auth.plugin.ts
            session.adapter.ts

      domains/
        authentication/
          authentication.service.ts

          providers/
            atproto/
              atproto-oauth.service.ts
              atproto-callback.service.ts
              atproto-token.service.ts
              atproto-dpop.service.ts
              atproto-identity.service.ts

          identity/
            identity-linking.service.ts

          sessions/
            session-context.service.ts
            session-management.service.ts

          devices/
            device-session.service.ts


Better Auth should be configured centrally.

Application services should consume Unset-owned authentication interfaces rather than importing Better Auth directly throughout the codebase.

5.1 Better Auth responsibilities

Better Auth should manage:

Application sessions.
Authentication state.
Session expiration.
Session revocation.
Passkeys.
Two-factor authentication.
Account management.
Authentication-related database records.
5.2 Custom authentication integration

AT Protocol should initially use a dedicated OAuth integration.

The integration must establish a verified identity before requesting a Better Auth session.

The application should use supported Better Auth server-side APIs or a carefully reviewed custom plugin to establish the session for an existing authenticated Unset account.

Direct manipulation of Better Auth internal database tables should be avoided.

6. AT Protocol Identity Federation

AT Protocol will be Unset's primary external identity provider.

The authenticated AT Protocol DID should be associated with an Unset application account.

Suggested identity association:

text
Unset User
  |
  +-- AT Protocol Identity
  |     |
  |     +-- DID
  |     +-- Handle metadata
  |     +-- OAuth session reference
  |
  +-- Better Auth Account
  |
  +-- Better Auth Sessions
  |
  +-- Trusted Devices


Identity association must use verified DIDs.

Email addresses and handles must not independently establish ownership of an AT Protocol identity.

If an existing Unset account is associated with a different DID, identity linking must require an explicit authenticated linking process.

7. DPoP and Device Identity

AT Protocol uses Demonstrating Proof of Possession (DPoP) to bind OAuth tokens to a cryptographic key.

Unset should integrate this functionality into its device architecture.

7.1 DPoP responsibilities

AT Protocol DPoP should provide:

OAuth token binding.
Proof of private-key possession.
Request-level proof generation.
Protection against unauthorized reuse of stolen access tokens.
7.2 Device association

Unset should associate the verified DPoP public-key thumbprint with the corresponding device registration.

Illustrative model:

typescript
interface TrustedDevice {
  id: string;
  userId: string;
  atprotoDid: string;

  dpopJkt: string;

  status: "active" | "revoked";

  enrolledAt: Date;
  lastActivityAt: Date;
}


The private DPoP key must remain within its designated secure client environment.

7.3 Important separation

DPoP does not independently establish that a device is trusted by Unset.

Unset must separately evaluate:

Device registration.
Device revocation status.
Session association.
Required authentication assurance.
Resource-specific permissions.

AT Protocol DPoP and Unset application session authentication must remain distinct protocols.

Reusing the same cryptographic key across protocols should only occur following an explicit security review. A shared device identity does not require sharing every protocol's private-key usage.

8. Application Session Management

Better Auth should manage the primary Unset application sessions.

For browser-based authentication, secure cookie-based sessions are recommended.

8.1 Session requirements

Sessions should support:

Creation.
Validation.
Expiration.
Rotation.
Revocation.
Device association.
Session listing.
Logout.
Logout from all devices.
Security-event recording.
8.2 Session configuration

Suggested initial policies:

Setting	Proposed value
Idle session lifetime	30 minutes
Absolute session lifetime	7 days
Sensitive step-up grant	5 minutes
Session renewal	Configurable
Cookie transport	HTTPS only
Cookie JavaScript access	Disabled

These values are initial policy recommendations and should be reviewed against the application threat model.

8.3 Cookie security

Use secure, HttpOnly cookies.

Recommended attributes:

Secure.
HttpOnly.
SameSite=Lax where appropriate.
Path=/.
Host-only cookie configuration.

State-changing requests must have appropriate CSRF protection.

8.4 Session revocation

Revoking a session should prevent future authenticated requests.

Revoking a device should invalidate associated application sessions according to the revocation policy.

Session caches must not allow revoked sessions to remain authorized beyond the documented revocation propagation window.

9. Authentication and MFA

Better Auth should provide the foundation for authentication assurance.

Supported methods should include:

Passkeys.
WebAuthn.
Hardware security keys.
TOTP authenticator applications.

SMS should not be the primary MFA method.

9.1 Step-up authentication

Sensitive operations should require recent additional authentication.

Examples:

Device enrollment.
Device revocation.
Recovery configuration changes.
Matrix recovery export.
Private data export.
Administrative policy changes.
9.2 Independent encryption authorization

MFA must not automatically grant access to encryption keys.

Authentication assurance and encryption-key authorization must remain separate.

A valid Better Auth session must not automatically unlock the user's private vault.

10. Database Architecture

PostgreSQL should be the primary persistence layer.

Better Auth should manage its own required authentication tables.

Unset should maintain separate domain tables for its application-specific identity, device and security requirements.

Suggested organization:

text
authentication/
  better_auth_users
  better_auth_accounts
  better_auth_sessions
  better_auth_verifications

unset_identity/
  identity_providers
  external_identities
  identity_links

unset_security/
  trusted_devices
  device_sessions
  authentication_events
  step_up_grants

atproto/
  oauth_sessions
  oauth_token_metadata
  dpop_key_references


The actual Better Auth table names and schemas should follow its configured database adapter and migrations.

AT Protocol credentials that must be retained should be encrypted at rest.

Session and token secrets should not appear in application logs.

11. Token Management

Unset should distinguish between credential types.

Credential	Responsibility
ATProto access token	Access to AT Protocol resources
ATProto refresh token	Renew AT Protocol access
ATProto DPoP key	OAuth proof of possession
Better Auth session	Authenticate to Unset
API key	External application integration
Service credential	Internal service authentication
Step-up grant	Temporary sensitive-operation authorization

Better Auth session tokens must not be reused as AT Protocol OAuth credentials.

AT Protocol refresh tokens must be managed according to the AT Protocol OAuth specification, including refresh-token rotation.

Opaque Unset session credentials should be preferred for browser sessions.

If JWTs are introduced for service-to-service communication, they must have explicit issuer, audience, expiration and algorithm validation.

12. Integration With Unset's Existing Security Architecture
12.1 API Gateway

Elysia should integrate Better Auth session validation into its authentication middleware.

The middleware should establish a verified request context containing:

User ID.
Session ID.
Device ID.
Authentication timestamp.
Applicable authentication assurance.
12.2 Authorization Service

The native TypeScript Authorization Service should consume the authenticated request context.

It should independently evaluate:

Permissions.
Resource ownership.
Trusted-device status.
MFA requirements.
Subscription entitlements.
API availability.
12.3 Trusted Devices

The device registry remains an Unset-owned service.

Better Auth sessions should be associated with trusted devices where appropriate.

12.4 Encryption and Recovery Vault

Better Auth must not manage:

Master encryption keys.
Recovery passphrases.
Data encryption keys.
Private document decryption.
Matrix room encryption keys.

The vault remains independently responsible for client-side cryptographic operations.

12.5 Administrative Services

Administrative access should require explicit roles, permissions and appropriate MFA assurance.

A Better Auth administrator account must not automatically receive unrestricted access to every Unset resource.

13. Security Requirements

The implementation must satisfy the following requirements.

Separation of identity and sessions

AT Protocol identity authentication and Unset session authentication must remain separate.

Verified identity association

Only validated AT Protocol identities may be associated with Unset accounts.

Secure sessions

Application sessions must support secure transport, expiration, rotation and revocation.

Default-deny authorization

Authentication must never imply unrestricted resource access.

Trusted-device verification

Sensitive operations must evaluate device registration and revocation status.

Independent encryption security

Better Auth must not have access to plaintext encryption keys or recovery secrets.

Token isolation

Credentials belonging to different protocols must not be reused interchangeably.

Auditability

Authentication, identity linking, session revocation and MFA events must be recorded.

Fail-closed behavior

Authentication and security-service failures must never grant unrestricted access.

14. Implementation Roadmap
Phase 1 — Better Auth Foundations
Integrate Better Auth with Bun and Elysia.
Configure PostgreSQL.
Establish authentication interfaces.
Configure secure session handling.
Integrate the SvelteKit client.
Establish session management.
Phase 2 — AT Protocol Identity
Implement AT Protocol OAuth.
Implement PKCE and PAR.
Implement DPoP.
Validate OAuth callbacks.
Verify authenticated DIDs.
Implement identity association.
Establish the Better Auth session handoff.
Phase 3 — Device Integration
Implement trusted-device registration.
Associate device identities with sessions.
Integrate DPoP thumbprints.
Implement device listing.
Implement device revocation.
Implement associated session invalidation.
Phase 4 — MFA
Integrate passkeys.
Integrate WebAuthn.
Integrate TOTP.
Establish authentication assurance.
Implement step-up authentication.
Integrate MFA requirements with authorization policies.
Phase 5 — API Integration
Integrate Better Auth with Elysia middleware.
Establish verified request context.
Integrate the Authorization Service.
Implement session-aware API policies.
Establish standardized authentication errors.
Phase 6 — Security Validation
Test OAuth callback validation.
Test session fixation protections.
Test session revocation.
Test identity-linking security.
Test device revocation.
Test MFA enforcement.
Test token isolation.
Review Better Auth configuration and extensions.
Conduct independent security assessment.
15. Architectural Decisions

The following decisions are recommended:

Better Auth will be Unset's primary authentication and session-management framework.
AT Protocol will serve as the primary external identity provider.
AT Protocol OAuth will use a dedicated integration until complete protocol compatibility is established in any generic provider.
Better Auth will establish independent Unset application sessions.
Elysia will enforce authentication through centralized middleware.
PostgreSQL will store authentication and application security metadata.
Trusted-device management will remain an Unset-owned service.
DPoP will protect AT Protocol OAuth tokens and integrate with device identity management.
Native TypeScript authorization will remain separate from Better Auth.
Encryption recovery and vault access will remain independent of authentication.
16. Final Vision

Better Auth provides Unset with a mature authentication foundation without requiring the project to independently implement every conventional authentication capability.

AT Protocol provides portable identity.

Better Auth provides application authentication and sessions.

Elysia provides centralized API integration.

Unset's Authorization Service provides resource-level permissions.

The Trusted Device Service provides device-level security.

The Encryption Vault provides independent user-controlled cryptographic protection.

Together, these components establish a cohesive authentication architecture capable of supporting Unset's social platform, private storage, Matrix integration, administrative functionality and future application services.

Core philosophy:

"Your identity authenticates you. Your session connects you. Your permissions authorize you. Your device establishes trust. Your encryption keys protect your private information."

Unset should never need to compromise one of these security boundaries to provide a convenient authentication experience.

I would use the official Better Auth documentation as the implementation reference, particularly:

Better Auth documentation 

Elysia integration 

Passkey plugin 

Two-factor authentication 

AT Protocol OAuth specification 