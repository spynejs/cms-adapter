# @spyne/cms-adapter

The **SpyneJS CMS Adapter** connects the SpyneJS CMS **runtime** to a local development environment.

It enables **safe, deterministic editing of local JSON files** by providing a registry, file access, and update pipeline that the CMS runtime can interact with during development.

> This package is an **environment adapter**, not a CMS runtime plugin and not a production server.

---

## Release status

This package represents the **first public release** of the SpyneJS CMS Adapter.

It has been developed and used internally as a **private npm package for over two years** before being published publicly.

The public release focuses on a **stable, intentionally scoped surface area** and may continue to evolve as additional adapters and tooling are introduced.

The adapter is intentionally scoped to **local development workflows** and serves as the **reference implementation** for future CMS environment adapters.

---

## What this is

- A **development-time adapter** for the SpyneJS CMS runtime
- Provides a **local registry** of editable data sources
- Reads and writes **JSON files on disk**
- Applies **path-based updates** to structured data
- Automatically creates **timestamped backups**
- Designed to integrate with the SpyneJS CMS runtime via fetch channels

---

## What this is not

- ❌ Not a CMS runtime plugin
- ❌ Not a production content server
- ❌ Not a generic JSON API
- ❌ Not required in production builds

This adapter exists **only to support local authoring workflows**.

---

## Registry lifecycle

The **first SpyneJS application** that loads the CMS Adapter is responsible for **instantiating the registry**.

By default, the registry is available at:

```
http://localhost:52931
```

The registry:

- Tracks available editable data sources
- Associates each source with file metadata and data paths
- Acts as the coordination layer between the CMS runtime and the filesystem

Subsequent applications reuse the existing registry instance.

---

## Current implementation

The current adapter implementation targets **Webpack-based development environments**.

It runs as a lightweight Node process alongside the dev server and exposes a small HTTP interface used by the CMS runtime.

Future adapters (e.g. Vite, Node-only, or hosted services) will follow the same conceptual contract.

---

## Core responsibilities

### 1. Registry

The adapter exposes a registry endpoint that:

- Enumerates editable data sources
- Associates each source with:
    - File path
    - Initial data path
    - Root data key
- Allows the CMS runtime to discover available data safely

---

### 2. JSON file access

For registered data sources, the adapter can:

- Read JSON files from disk
- Parse structured objects and arrays
- Resolve nested paths deterministically
- Validate updates before writing

---

### 3. Path-based updates

All updates are applied using **explicit data paths**, not string replacement.

Internally, updates follow this model:

- Resolve path from initial data root
- Apply update using functional path helpers
- Preserve unrelated data
- Avoid accidental mutation

This allows the CMS runtime to:

- Track exactly what changed
- Preview edits before persistence
- Support future AI-assisted workflows

---

### 4. Safe writes & backups

Before writing updates:

- The original JSON file is copied
- A timestamped backup is created
- The new version is written atomically

This ensures:

- No silent data loss
- Easy rollback during development
- Confidence when editing live data

---

## Mock API support

The CMS Adapter includes support for **mock API paths** to enable local testing of application fetch calls.

Using the `mock/*path` convention, applications can:

- Simulate API responses locally
- Route fetch requests to JSON files on disk
- Test CMS-driven updates without a real backend

This is especially useful when developing applications that will later integrate with real services.

---

## Integration with the CMS runtime

The CMS Adapter is consumed indirectly by the **`@spyne/cms`** runtime plugin.

The integration flow looks like this:

1. CMS runtime requests registry information
2. Adapter returns available data sources
3. CMS runtime edits data in memory
4. CMS runtime sends path-based updates
5. Adapter applies updates to disk and writes backups

No application code is modified in this process.

---

## AppBuilder integration

The CMS Adapter is **natively integrated** into the **SpyneJS AppBuilder**.

For AppBuilder-generated applications:

- The adapter is automatically configured
- The registry is started automatically
- Local JSON editing works out of the box

No manual setup is required.

---

## Typical development setup

- SpyneJS application (Webpack)
- `@spyne/cms` runtime plugin
- `@spyne/cms-adapter` running locally
- JSON data stored in the application repository

This setup enables:

- Live WYSIWYG editing
- Deterministic data updates
- No coupling between runtime logic and filesystem access

---

## Scope & roadmap

**Current**

- Webpack adapter
- Local JSON editing
- Registry + safe write pipeline
- Mock API path support

**Planned**

- Additional adapters (Vite, Node-only)
- Support for non-JSON sources
- Integration with Spyne Studio
- Remote / hosted data services

---

## License

GPL-3.0-or-later  
Commercial license available.

See `LICENSE.md` for full details.
