# HxGN NetWorks Portal Service API - Rules

Instructions extending the *HxGN NetWorks Portal Service API* description.

## Request to a registered portal service on the server

Use ```$NWP.serviceRequest(args)``` pattern when calling a portal service.

Read ```HxGN NetWorks Portal Service API``` documentation for the complete portal services semantics.

MANDATORY:
Portal services are NOT REST endpoints.

ALWAYS call services using:

$NWP.serviceRequest({
  serviceName: "<registered service>",
  jsonData: { ... }
})

NEVER append URL path segments to `serviceName`.

For `gtdws/feature` and `gtdwsrw/feature`:
- use serviceName exactly:
  "gtdws/feature"
- pass all arguments in `jsonData`
- include:
  G3E_FNO
  G3E_FID
  pTYPE
  apiVersion

FORBIDDEN:
serviceName: `gtdws/feature/${fno}/${fid}`

Canonical example:
$NWP.serviceRequest({
  serviceName: "gtdws/feature",
  jsonData: {
    G3E_FNO: fno,
    G3E_FID: fid,
    pTYPE: "Review",
    apiVersion: "2.2.0"
  }
})

Below is a mapping portal service aliases to serviceName. Use the corresponding serviceName cto call a specific portal service.

| Portal service alias | Readable service name                | serviceName         | Purpose                                |
| -------------------- | ------------------------------------ | ------------------- | -------------------------------------- |
| `clientid`           | Portal Client ID Service             | `clientid`          | Session/client identification          |
| `keepalive`          | Portal KeepAlive Service             | `keepalive`         | Session keepalive / timeout prevention |
| `config`             | Portal Configuration Service         | `config`            | Workspace/config metadata              |
| `features`           | NetWorks Feature Service             | `features`          | Feature retrieval/edit operations      |
| `redline`            | NetWorks Redline Service             | `redline`           | Redline CRUD                           |
| `file`               | Portal File Service                  | `file`              | Generic file upload/download           |
| `filedownload`       | Portal File Download Service         | `filedownload`      | Binary file download                   |
| `gtdws`              | GTDWS / NetWorks Dialog Service (RO) | `gtdws/feature`     | Feature dialog/read-only metadata      |
| `gtdwsrw`            | GTDWS Read/Write Service             | `gtdwsrw/feature`   | Editable dialog operations             |
| `print`              | NetWorks Print Service               | `print`             | Plot/print generation                  |
| `details`            | NetWorks Detail Service              | `details`           | Detail/schematic retrieval             |
| `search`             | NetWorks Analytical Search Service   | `search`            | Searches / quick search                |
| `legend`             | Portal Legend Service                | `legend`            | Legend state/configuration             |
| `trace`              | NetWorks Trace Service               | `trace`             | Network tracing                        |
| `job`                | NetWorks Job Service                 | `job`               | Job management                         |
| `areas`              | NetWorks Area Manager Service        | `areas`             | AOI / Area Manager                     |
| `google`             | Google Maps Integration Service      | `google`            | Google integration                     |
| `netexport`          | NetWorks Export Service              | `netexport`         | Export to external formats             |
| `netplot`            | NetWorks Plot Service                | `netplot`           | Plot generation                        |
| `coordinateSystems`  | Coordinate System Service            | `coordinateSystems` | CRS transformations                    |
| `datatransfer`       | Data Transfer Service v1             | `datatransfer`      | Data/package transfer                  |
| `datatransfer2`      | Data Transfer Service v2             | `datatransfer2`     | Newer transfer API                     |
| `workservice`        | Work Management Service              | `workservice`       | External WMS/work integration          |
| `dynamicWms`         | Dynamic WMS Service                  | `dynamicWms`        | Runtime-generated WMS layers           |
| `analysis`           | NetWorks Analytical Service          | `analysis`          | Analytical engine                      |
| `users`              | User Administration Service          | `users`             | User list/admin                        |
| `user`               | Current User Service                 | `user`              | Current logged-in user                 |


## Get list of registered portal services

This will return all registered service names.

```$NWP.workspace.get().registeredServiceName```