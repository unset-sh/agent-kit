<!--
Verbatim copy of the Unset Core product scope that Alex posted in the migration project on 2026-11-23 at
16:22 UTC. The text below the rule is his, unedited: do not reword it here. A changed scope is a new copy
from Alex, recorded with its own date. See README.md in this folder for what this copy is for.
-->

---

Unset Core — Product Scope and Capabilities

Vision

Unset Core is the foundation of a privacy-first, modular social platform. It should provide a complete and useful experience without requiring users to install optional modules.

The Core should prioritize identity, privacy, user ownership, communication, social interaction, discoverability and extensibility.

The architecture should remain modular, allowing independent developers to build specialized applications and features that integrate seamlessly into Unset through stable, documented APIs and an SDK.

1. Identity and Security

Responsible for user identity, authentication and account security.

Capabilities:

* Account creation and management.
* Authentication and session management.
* AT Protocol integration, including DID and handle support.
* Identity verification and account linking.
* Multi-factor authentication, including TOTP.
* Account recovery and recovery codes.
* Session and device management.
* Session revocation.
* Security settings and notifications.

2. Profiles and Personal Space

Provide users with their own customizable space within Unset.

Capabilities:

* User profiles and avatars.
* Profile customization and presentation.
* Personal pages and profile content.
* External links and social identities.
* User-controlled profile visibility.
* Extensible profile components and content blocks.
* Integration with AT Protocol identity and profile data.

User-generated profile content must use safe, controlled components. Arbitrary user HTML, CSS or executable code must never run in other users’ browsers.

3. Social Publishing and Feeds

Provide the fundamental social networking experience.

Capabilities:

* Create and publish posts.
* Text and media attachments.
* Replies and discussions.
* Likes and other basic interactions.
* Follow and unfollow users.
* Chronological feeds.
* User subscriptions to feeds and topics.
* Content visibility and audience controls.
* Basic content management and deletion.

The initial experience should prioritize user choice and chronological presentation rather than engagement-driven recommendation algorithms.

4. Communities and Moderation

Provide native community functionality.

Capabilities:

* Create and manage communities.
* Community profiles and pages.
* Membership and participation management.
* Community discussions and posts.
* Community administration and permissions.
* Moderation tools.
* Reporting, blocking and muting.
* Abuse prevention and rate limiting.
* Clear public and private community boundaries.

5. Communication

Provide native messaging through Matrix integration.

Capabilities:

* Direct messaging.
* Group conversations.
* Private communities and group communication where appropriate.
* Conversation management.
* Unread indicators and notifications.
* Presence and availability where supported.
* Secure Matrix authentication and integration.
* Support for future voice and video communication.

Matrix should remain an independent service at the infrastructure level while providing a seamless native experience within Unset.

6. Personalization and Discovery

Provide a privacy-conscious personalization system that helps users discover relevant content and services.

Capabilities:

* User-controlled interest profiles.
* Explicitly selected interests.
* Interest signals derived from permitted public activity.
* Recommendations for people to follow.
* Suggested posts, feeds and communities.
* Relevant articles and external content.
* Suggested modules and extensions.
* Explainable recommendations.
* User controls to inspect, remove or reset inferred interests.
* Ability to disable personalization entirely.
* Separate personalization controls for different discovery areas.

Privacy requirements:

* Never use private Matrix conversations as recommendation signals.
* Never use private community memberships, drafts or bookmarks as signals.
* Make recommendation sources transparent.
* Use purpose-limited signals and privacy-conscious defaults.
* Keep chronological feeds available independently of personalization.

7. Search and Information Discovery

Provide a unified search experience across Unset and the wider web.

Capabilities:

Internal search

* People and profiles.
* Posts and discussions.
* Communities.
* Feeds and topics.
* Public modules and extensions.
* Other publicly discoverable Unset content.

External search

* Wider web search through SearXNG.
* News and independent journalism.
* Images and videos.
* Search filters and source selection.
* Search by content type and publication date.

Architecture:

* Use OpenSearch for internal indexing and search.
* Use SearXNG as an external search provider.
* Provide a common search interface and provider abstraction.
* Allow search providers to be replaced or extended without redesigning the application.
* Allow authorized modules to contribute specialized search providers.

All search results must respect the underlying content’s visibility and access permissions. Private content must never leak through search results, snippets or indexes.

8. Keyboard Interaction and Command System

Provide a global keyboard-first interaction system through a universal command palette.

Capabilities:

* Global command palette accessible through a keyboard shortcut, such as Ctrl+K or Cmd+K.
* Search and execute application actions.
* Navigate to pages and features.
* Create posts and messages.
* Find people and communities.
* Open settings and account controls.
* Contextual actions based on the current page.
* Autocomplete and suggested commands.
* Keyboard navigation through results.
* Discoverable keyboard shortcuts.
* Keyboard shortcut reference and customization where practical.

Module integration:

* Allow modules to register commands through the official SDK.
* Support module-specific actions and contextual commands.
* Enforce module permissions and user authorization.
* Keep commands discoverable without requiring users to memorize syntax.

The command palette should complement conventional navigation, not replace it. All important functionality must remain accessible to mouse, touch and assistive technology users.

9. Privacy and User Control

Privacy must be a fundamental part of Core rather than an optional module.

Capabilities:

* Privacy and visibility settings.
* Clear public/private content boundaries.
* User-controlled data access.
* Data export and deletion.
* Session and device revocation.
* Connected application management.
* Permission management.
* Minimal and privacy-conscious logging.
* Transparency around data usage.
* User control over personalization.
* Secure defaults and privacy-conscious configuration.

Advanced privacy audits, browser fingerprinting analysis and downloadable privacy reports can be provided through an optional Privacy Center module.

10. Platform Foundation and Module System

Provide the underlying platform services and extension architecture that support Core and third-party modules.

Capabilities:

* Stable APIs and versioned contracts.
* Identity and authorization services.
* Permission and capability management.
* Shared storage abstractions.
* Media and attachment services.
* Notification infrastructure.
* Search provider interfaces.
* Personalization APIs.
* Command registration and execution interfaces.
* Module discovery and installation.
* Module lifecycle and dependency management.
* Module manifests and metadata.
* SDK and developer documentation.
* Extension points for navigation, pages, settings, contextual actions and commands.
* Compatibility and version management.

Module architecture principles:

* Modules should be self-contained applications or packages.
* A module may contain its own frontend, backend, business logic, dependencies and tests.
* Modules should integrate into the native Unset interface by default.
* Modules must interact with Core through documented and permission-controlled contracts.
* Modules must not receive unrestricted access to Core databases, files or internal services.
* Official and community modules should use the same extension system.
* Modules should be independently installable, removable and upgradeable.
* Modules not installed should not contribute code to the application bundle; installed modules should support lazy loading.

Module Ecosystem

Unset should support an open ecosystem of independently developed modules.

Examples:

* Privacy Center.
* Advanced video hosting.
* Blogging and long-form publishing.
* AI-assisted tools.
* Skydiving jump logging and planning.
* Specialized community applications.
* Marketplace and commerce.
* Advanced search experiences.
* Specialized productivity tools.

Provide a well-documented SDK, manifest format, sample modules and publishing tools.

Support both Unset-managed community lexicon namespaces and independently owned developer namespaces for AT Protocol lexicons.

Module-specific data models should remain independently defined unless they become widely useful enough to be proposed as shared Unset ecosystem standards.

Core Architectural Principles

1. Privacy and user ownership by default.
2. Modular architecture without unnecessary complexity.
3. Stable, documented and versioned interfaces.
4. Strict permission boundaries between modules and Core.
5. Interoperability with AT Protocol and other open standards.
6. Independent services where appropriate, integrated into one cohesive experience.
7. User control over feeds, discovery and personalization.
8. Minimal data collection and logging.
9. Accessibility and keyboard usability throughout the application.
10. Core must remain useful without optional modules.

Definition of a Successful Unset Core

A user should be able to:

* Create and secure an account.
* Establish and manage their identity.
* Customize their personal space.
* Follow people and publish content.
* Discover and participate in communities.
* Communicate privately through Matrix.
* Search Unset and the wider web.
* Discover relevant people, posts, articles and modules.
* Navigate and perform actions using the command palette and keyboard shortcuts.
* Control their privacy, data and personalization settings.
* Use the platform without installing any optional modules.

The objective is to build a complete privacy-first social platform that also serves as an extensible environment for independent developers and specialized applications.
