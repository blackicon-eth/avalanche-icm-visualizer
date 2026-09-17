# Avalanche ICM Visualizer

## 0. Mission

Build a polished, visually distinctive web application that visualizes Interchain Messaging (ICM) traffic between Avalanche L1s.

The application should feel more like a **living network visualization** than a traditional blockchain explorer.

The core visual metaphor:

- Avalanche L1s are represented as nodes arranged around a circle/radial topology.
- ICM messages are animated particles traveling along curved paths between L1s.
- Users can enable/disable chains.
- Users can inspect individual messages.
- Users can pause/resume the visualization.
- Users can adjust animation speed.
- Users can filter traffic.
- Clicking a message opens a detailed technical view of its lifecycle.
- The application should work first with mock data and then with real Avalanche data without requiring a rewrite of the visualization layer.

The application should be technically credible to an Avalanche engineer while remaining immediately understandable to someone unfamiliar with ICM.

The project is an educational/visualization tool, NOT a production monitoring system.

---

# 1. Product Principles

## 1.1 Visual first

The primary screen should immediately communicate:

> "These are independent Avalanche L1s and messages are moving between them."

Do not make the application look like a generic admin dashboard.

Avoid:

- dense tables as the primary interface
- excessive cards
- generic dashboard layouts
- unnecessary charts
- excessive gradients
- crypto price aesthetics
- rocket/coin/token imagery
- "Web3 marketing" visual language

The network visualization is the hero.

---

## 1.2 Progressive technical depth

The application should support two conceptual levels.

### Simple mode

A user sees:

```text
L1 A
  \
   \  message
    \
     L1 B
```

Clicking the message explains:

- source
- destination
- message
- status
- timestamp

### Technical mode

The same message can expose:

```text
Source L1
   ↓
Warp message emitted
   ↓
Validator signatures
   ↓
BLS aggregation
   ↓
Relayer
   ↓
Destination L1
   ↓
Message delivered
```

The user should not need to understand these concepts to use the application.

---

# 2. Technology Stack

Use:

- Next.js
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Zod
- viem
- TanStack Query
- SVG for the network visualization
- pnpm
- Vercel-compatible deployment

Do NOT introduce:

- Redux
- GraphQL
- Prisma
- PostgreSQL
- MongoDB
- Kubernetes
- Docker unless needed for local Avalanche infrastructure
- separate backend service
- React Flow
- a custom blockchain indexer

Keep the first version intentionally small.

---

# 3. Repository Structure

Use this structure:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── ...
│
├── components/
│   ├── network/
│   │   ├── NetworkCanvas.tsx
│   │   ├── ChainNode.tsx
│   │   ├── MessageArc.tsx
│   │   ├── MessageParticle.tsx
│   │   ├── NetworkControls.tsx
│   │   └── NetworkLegend.tsx
│   │
│   ├── messages/
│   │   ├── MessageDetails.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageTimeline.tsx
│   │   └── MessageStatus.tsx
│   │
│   ├── chains/
│   │   ├── ChainSelector.tsx
│   │   ├── ChainDetails.tsx
│   │   └── ChainBadge.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   └── ui/
│
├── hooks/
│   ├── useNetworkLayout.ts
│   ├── useMessages.ts
│   ├── useAnimationClock.ts
│   └── useSelectedChains.ts
│
├── lib/
│   ├── avalanche/
│   │   ├── rpc.ts
│   │   ├── warp.ts
│   │   ├── teleporter.ts
│   │   └── adapters.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── visualization/
│   │   ├── geometry.ts
│   │   └── paths.ts
│   │
│   └── utils.ts
│
├── data/
│   ├── chains.ts
│   └── mock-messages.ts
│
└── types/
    ├── chain.ts
    ├── message.ts
    └── visualization.ts
```

Do not create files until they have a purpose.

---

# 4. Core Domain Model

The visualization must not depend directly on raw RPC responses.

Create normalized domain models.

## 4.1 Chain

```ts
export type Chain = {
  id: string

  name: string

  shortName: string

  blockchainId: string

  icon?: string

  color?: string

  rpcUrl?: string

  explorerUrl?: string

  enabledByDefault: boolean

  metadata?: {
    description?: string
    network?: "mainnet" | "fuji" | "local"
  }
}
```

Do not use color as the primary identity mechanism.

The UI should remain usable without colors.

---

## 4.2 ICM Message

```ts
export type ICMMessageStatus =
  | "observed"
  | "relaying"
  | "delivered"
  | "failed"

export type ICMMessageProtocol =
  | "warp"
  | "teleporter"
  | "unknown"

export type ICMMessage = {
  id: string

  protocol: ICMMessageProtocol

  source: {
    chainId: string
    txHash?: string
    blockNumber?: bigint
    timestamp?: number
  }

  destination: {
    chainId: string
    txHash?: string
    blockNumber?: bigint
    timestamp?: number
  }

  status: ICMMessageStatus

  emittedAt?: number

  deliveredAt?: number

  payload: {
    raw?: `0x${string}`
    type?: string
    decoded?: unknown
  }

  warp?: {
    messageId?: string
    sourceChainId?: string
    originSenderAddress?: string
  }

  teleporter?: {
    messageId?: string
    destinationAddress?: string
    requiredGasLimit?: bigint
    feeInfo?: unknown
  }

  explorer?: {
    sourceTx?: string
    destinationTx?: string
  }
}
```

The rest of the application must consume this normalized type.

---

# 5. Data Source Architecture

Use a provider abstraction.

The visualization should not care whether data comes from:

- mock data
- local Avalanche network
- Fuji
- Avalanche mainnet
- a future indexer

Create:

```ts
export interface ICMDataProvider {
  getChains(): Promise<Chain[]>

  getRecentMessages(params?: {
    chainIds?: string[]
    limit?: number
    since?: number
  }): Promise<ICMMessage[]>

  getMessage(id: string): Promise<ICMMessage | null>
}
```

Create at least:

```text
MockICMDataProvider
AvalancheICMDataProvider
```

The application should start using the mock provider.

The real provider can initially return a limited set of data.

---

# 6. Environment Configuration

Use Zod.

Create:

```ts
src/lib/config/env.ts
```

Use a server environment schema and a client-safe environment schema.

Example:

```ts
import { z } from "zod"

const serverEnvSchema = z.object({
  AVALANCHE_RPC_URL: z.url().optional(),
})

export const env = serverEnvSchema.parse({
  AVALANCHE_RPC_URL: process.env.AVALANCHE_RPC_URL,
})
```

Do not expose private environment variables to the browser.

Only public RPC endpoints/configuration may be client-visible.

The app must remain functional without real RPC configuration when running in mock mode.

---

# 7. Initial Chain Dataset

Create a static dataset in:

```text
src/data/chains.ts
```

The dataset should include several recognizable Avalanche networks/L1s.

Do not hardcode that these chains necessarily have current ICM traffic.

The visualization can initially use mock traffic.

Each chain should have:

- stable ID
- name
- short name
- blockchain ID
- explorer URL when known
- optional icon
- network type

The architecture must allow arbitrary custom chains later.

---

# 8. Custom Chains

The UI should eventually allow users to add a custom chain.

Do NOT implement a full chain registration backend.

A custom chain can simply be represented locally by:

```ts
{
  id: string
  name: string
  blockchainId: string
  rpcUrl?: string
  explorerUrl?: string
}
```

Create an "Add chain" dialog.

Fields:

- Name
- Blockchain ID
- RPC URL
- Explorer URL

Validate the form with Zod.

Custom chains should appear in the chain selector immediately after creation.

Persist custom chains in localStorage.

Do not introduce a database.

---

# 9. Network Layout

The network is radial.

Given:

```ts
chainCount
width
height
```

calculate:

```ts
angle = (2 * Math.PI * index) / chainCount

x = centerX + radius * Math.cos(angle)

y = centerY + radius * Math.sin(angle)
```

Create:

```ts
useNetworkLayout()
```

which returns:

```ts
type ChainPosition = {
  chainId: string
  x: number
  y: number
}
```

The layout should react to:

- viewport size
- chain count
- enabled/disabled chains

The layout must be deterministic.

Do not use a force-directed graph.

---

# 10. SVG Network Canvas

The main visualization should be SVG.

Example conceptual structure:

```tsx
<svg>
  <defs>
    ...
  </defs>

  <g className="connections">
    ...
  </g>

  <g className="messages">
    ...
  </g>

  <g className="chains">
    ...
  </g>
</svg>
```

SVG is preferred over Canvas because the project needs:

- interaction
- hover
- click
- accessibility
- semantic elements
- easy animation
- predictable geometry

---

# 11. Chain Nodes

Each chain is represented by a circular node.

The node contains:

- icon
- chain name
- optional short name
- status indicator
- message count

A chain should visually communicate that it is a network, not merely a data point.

Suggested structure:

```text
       ╭─────────╮
       │  ICON   │
       │         │
       │  L1 A   │
       ╰─────────╯
```

Use a subtle halo/glow when:

- a message is being emitted
- a message is being received
- the chain is selected

Do not make every node constantly glow.

---

# 12. Message Connections

Messages should travel along curved SVG paths.

For source:

```ts
source = { x, y }
```

and destination:

```ts
destination = { x, y }
```

calculate a curved path.

Avoid drawing a permanent straight line between every chain.

The network should feel sparse and alive.

Only show a persistent connection when:

- it is active
- selected
- hovered
- filtered
- or has recent traffic

---

# 13. Message Animation

Use Motion.

Each message is represented by a small particle travelling along its source → destination path.

Animation:

```text
source
  |
  | ●
  |   ●
  |     ●
  |       ●
  |         destination
```

The particle should:

- fade in
- accelerate slightly
- travel
- fade out near destination

Do not make the animation excessively fast.

Default duration:

```text
1.5–2.5 seconds
```

depending on path length.

Animation speed should be user-adjustable.

Provide:

```text
0.5x
1x
2x
4x
```

and Pause/Resume.

---

# 14. Message Batching

If multiple messages are travelling from A → B within a short period, group them visually.

Example:

```text
        ✉
        ✉
        ✉
        ✉
```

can become:

```text
        ✉ × 4
```

Clicking the group opens the individual messages.

Create:

```ts
type MessageBatch = {
  id: string
  sourceChainId: string
  destinationChainId: string
  messages: ICMMessage[]
  startedAt: number
}
```

The grouping window should be configurable.

Default:

```text
1000 ms
```

Do not merge messages permanently.

They should remain individually inspectable.

---

# 15. Chain Selector

Create a persistent control panel.

Example:

```text
NETWORKS

☑ C-Chain
☑ L1 Alpha
☑ L1 Beta
☐ L1 Gamma
☐ Custom L1

[ + Add chain ]
```

When a chain is disabled:

- remove it from the radial layout
- hide messages originating from it
- hide messages targeting it
- recalculate layout

Do not destroy underlying message data.

Re-enabling a chain should restore its traffic.

---

# 16. Filters

Support:

### Chain filter

Source/destination.

### Protocol

```text
All
Warp
Teleporter
```

### Status

```text
All
Observed
Relaying
Delivered
Failed
```

### Time

```text
Live
Last 5 minutes
Last hour
```

For MVP, filters can operate on the currently loaded message set.

---

# 17. Live Mode

Create a `Live` toggle.

When enabled:

```text
fetch new messages periodically
```

Use TanStack Query.

Initial polling:

```text
5000 ms
```

Make the polling interval configurable internally.

Do not implement WebSockets initially.

The user should see:

```text
● LIVE
```

when active.

When paused:

```text
Ⅱ PAUSED
```

The animation clock should stop.

Data fetching may also stop while paused.

---

# 18. Message Detail Panel

Clicking a message opens a right-side detail panel.

The panel should feel like inspecting a real protocol event.

Structure:

```text
ICM MESSAGE

Teleporter

SOURCE
L1 Alpha

DESTINATION
L1 Beta

STATUS
✓ Delivered

MESSAGE ID
0x....

SOURCE TRANSACTION
0x....

DESTINATION TRANSACTION
0x....

TIMELINE

12:42:01
Message emitted

12:42:02
Signatures collected

12:42:03
Relayed

12:42:04
Delivered

PAYLOAD

...
```

Use monospace font for:

- addresses
- hashes
- IDs
- raw payload

Do not truncate data permanently.

Provide copy buttons.

---

# 19. Technical Lifecycle View

Inside the detail panel provide a collapsible section:

```text
TECHNICAL LIFECYCLE
```

Display:

```text
1. Source L1
   Warp message emitted

        ↓

2. Validator set
   Message signatures collected

        ↓

3. Signature aggregation
   BLS aggregate signature

        ↓

4. Relayer
   Message submitted to destination

        ↓

5. Destination L1
   Message verified and delivered
```

Each step should have:

- icon
- timestamp if known
- transaction/hash if known
- short explanation

This section is critical because it distinguishes the project from a generic network animation.

---

# 20. Technical Accuracy

Do not claim that the application directly observes internal relayer behavior unless the underlying data source actually provides that information.

Important distinction:

The application may observe:

- source message emission
- source transaction
- Warp message data
- destination transaction
- destination delivery

A relayer is an off-chain component.

If the application cannot reliably observe:

```text
"Relayer X picked up message Y at timestamp Z"
```

do not display that as fact.

Instead use:

```text
Relaying / observed in transit
```

or:

```text
Destination transaction observed
```

The UI must distinguish protocol-observable facts from inferred states.

---

# 21. Warp Data

Create:

```text
src/lib/avalanche/warp.ts
```

Responsibilities:

- Warp ABI definitions
- event decoding
- message normalization
- Warp message ID extraction
- source chain ID extraction
- origin sender extraction

Do not spread ABI definitions across components.

Components should never decode raw logs.

---

# 22. Teleporter Data

Create:

```text
src/lib/avalanche/teleporter.ts
```

Responsibilities:

- Teleporter ABI
- Teleporter event decoding
- message normalization
- destination information
- payload decoding where possible

If a payload cannot be decoded:

```text
Unknown payload
```

and show the raw hex.

Never fabricate a decoded interpretation.

---

# 23. viem Clients

Create:

```text
src/lib/avalanche/rpc.ts
```

Expose functions such as:

```ts
getPublicClient(chain)
```

Do not instantiate clients repeatedly inside React components.

Clients should be created from chain configuration.

Use viem's public clients.

Do not use private keys.

The visualizer is read-only.

---

# 24. Explorer Links

Whenever a message contains:

- source transaction
- destination transaction
- block
- address

provide a link to the relevant explorer when configured.

Use a helper:

```ts
getExplorerTxUrl(chain, txHash)
```

Do not hardcode explorer URLs inside components.

---

# 25. Mock Data

Create realistic mock data.

The mock network should include:

- at least 6 chains
- at least 20 messages
- different source/destination pairs
- Warp and Teleporter examples
- different statuses
- different timestamps
- messages with and without decoded payloads

Messages should continuously appear in live mode.

Mock mode must look convincing enough to develop the UI without real blockchain data.

---

# 26. Mock Message Generator

Implement:

```ts
createMockMessage()
```

and:

```ts
createMockMessageStream()
```

The generator should:

- randomly choose source/destination
- avoid source === destination
- randomly select protocol
- generate deterministic-looking fake IDs
- produce realistic timestamps
- produce status progression

Example:

```text
observed
   ↓
relaying
   ↓
delivered
```

Use timers to simulate progression.

---

# 27. Provider Switching

Create a configuration:

```ts
type DataMode = "mock" | "live"
```

For MVP, default to:

```text
mock
```

Later allow:

```text
live
```

Do not require live RPCs for the UI to render.

---

# 28. Visual Style

The visual design should be:

- dark
- technical
- minimal
- spacious
- high contrast
- subtle
- sophisticated

Avoid:

- excessive neon
- excessive gradients
- meme-coin aesthetics
- giant "AVAX" logos everywhere
- generic SaaS dashboard appearance

Use:

- dark background
- thin borders
- subtle grid/noise
- restrained accent colors
- small status indicators
- monospace for protocol data

The network itself should provide most of the visual interest.

---

# 29. Typography

Use a clean sans-serif for UI.

Use a monospace font for:

- blockchain IDs
- addresses
- transaction hashes
- message IDs
- raw payloads
- protocol fields

Do not use monospace for all text.

---

# 30. Header

The header should be minimal.

Suggested layout:

```text
ICM VISUALIZER                    LIVE ●

Avalanche Interchain Messaging

[Live] [Pause] [1x] [Filters]
```

Do not include unnecessary navigation.

---

# 31. Main Layout

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│ Header                                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                  NETWORK VISUALIZATION                     │
│                                                            │
│                       ○ L1 A                               │
│                   ╱           ╲                            │
│              ○ L1 B           L1 C ○                     │
│                   ╲           ╱                            │
│                       ○ L1 D                               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Controls / Chain Selector                                  │
└────────────────────────────────────────────────────────────┘
```

When a message is selected:

```text
┌─────────────────────────────────────────┬──────────────────┐
│                                         │ MESSAGE DETAILS  │
│             NETWORK                     │                  │
│                                         │ Source           │
│                                         │ Destination      │
│                                         │ Status           │
│                                         │ Timeline         │
│                                         │ Technical        │
│                                         │ Payload          │
└─────────────────────────────────────────┴──────────────────┘
```

The detail panel should slide in using Motion.

---

# 32. Responsive Design

Desktop is the primary target.

Tablet should remain usable.

Mobile should switch to:

```text
network
↓
controls
↓
message list/details
```

Do not attempt to maintain the entire radial visualization at desktop dimensions on a phone.

---

# 33. Accessibility

All interactive elements must have:

- keyboard focus
- accessible labels
- appropriate button semantics

SVG nodes should have accessible labels.

Example:

```tsx
<title>
  Avalanche L1: {chain.name}
</title>
```

Messages should have accessible descriptions.

Do not rely exclusively on animation or color.

---

# 34. Performance

The visualization may eventually display hundreds of messages.

Do not mount thousands of permanent animated components.

Only animate:

- recent messages
- visible messages
- currently selected messages

Old messages should become static or disappear.

Cap active animated messages.

Suggested initial limit:

```text
50 active messages
```

---

# 35. Animation Architecture

Do not use React state updates every animation frame.

Let Motion handle animation.

React state should represent semantic state:

```text
selectedMessage
selectedChains
filters
paused
speed
```

Motion should handle:

```text
particle position
opacity
scale
path progression
panel transitions
```

---

# 36. Message Lifecycle State Machine

Represent message lifecycle conceptually as:

```text
OBSERVED
   ↓
RELAYING
   ↓
DELIVERED
```

Failure may happen:

```text
OBSERVED
   ↓
RELAYING
   ↓
FAILED
```

Do not imply a failure if the data provider simply has not observed delivery yet.

Distinguish:

```text
unknown
```

from:

```text
failed
```

if necessary.

---

# 37. Geometry Helpers

Create:

```text
src/lib/visualization/geometry.ts
```

Functions:

```ts
getRadialPosition(...)
getArcPath(...)
getControlPoint(...)
getDistance(...)
```

Create:

```text
src/lib/visualization/paths.ts
```

for SVG path construction.

The UI should not contain geometry formulas.

---

# 38. Animation Clock

Create:

```text
useAnimationClock()
```

Responsibilities:

- paused state
- speed multiplier
- current animation time

The clock should be independent of blockchain timestamps.

Blockchain timestamps determine message ordering.

Animation time determines how the visualization presents them.

---

# 39. Message Ordering

Sort messages by:

1. source timestamp
2. block number
3. observed timestamp

where available.

Never assume client arrival order equals blockchain order.

---

# 40. Error Handling

Errors should be user-friendly.

Examples:

```text
Unable to load live ICM data.

Showing the last available messages.
```

or:

```text
This chain does not expose a configured RPC endpoint.
```

Do not expose raw RPC errors as the main UI.

Log technical details in development.

---

# 41. Empty States

If no traffic matches the filters:

```text
No messages match your current filters.

Try enabling another chain or removing a filter.
```

Do not show an empty network.

Chains should remain visible.

---

# 42. Custom Chain UX

Click:

```text
+ Add chain
```

opens dialog:

```text
Add custom L1

Name
[________________]

Blockchain ID
[________________]

RPC URL
[________________]

Explorer URL
[________________]

[Cancel] [Add chain]
```

Validate:

- name non-empty
- blockchain ID valid
- RPC URL valid if provided
- explorer URL valid if provided

---

# 43. URL State

Where practical, preserve useful UI state in URL search parameters.

Example:

```text
?chains=l1-a,l1-b,c-chain
&protocol=teleporter
&mode=live
```

This allows someone to share a filtered visualization.

Do not encode the entire application state in the URL.

---

# 44. Deep Linking

A selected message should optionally be addressable:

```text
/messages/{messageId}
```

However, do not turn this into a separate full page unless necessary.

The main network should remain the primary experience.

---

# 45. Implementation Strategy

Implement in the following exact order.

## Step 1 — Bootstrap

Create:

- Next.js App Router project
- TypeScript
- Tailwind
- shadcn/ui
- Motion
- Zod
- viem
- TanStack Query
- pnpm configuration

Verify the app starts.

Do not implement blockchain functionality yet.

---

## Step 2 — Domain Types

Implement:

```text
Chain
ICMMessage
ICMMessageStatus
ICMMessageProtocol
MessageBatch
ICMDataProvider
```

Do this before building UI.

---

## Step 3 — Static Chain Dataset

Create 6–8 Avalanche networks/L1s.

Make sure IDs are stable.

Create helper:

```ts
getChainById(id)
```

---

## Step 4 — Radial Layout

Implement:

```ts
useNetworkLayout()
```

Render chains around the circle.

At this stage there should be:

- no messages
- no RPC
- no animation

Just a beautiful network.

---

## Step 5 — SVG Connections

Implement curved SVG paths between arbitrary chain pairs.

Test visually by creating hardcoded connections.

---

## Step 6 — Mock Messages

Implement mock message data.

Render static message paths.

Each message should have:

```text
source
destination
status
protocol
timestamp
```

---

## Step 7 — Message Particles

Use Motion to animate messages along paths.

Implement:

- duration
- easing
- fade in
- fade out
- speed multiplier

---

## Step 8 — Chain Selection

Implement:

```text
ChainSelector
```

Disable/enable chains.

Recalculate radial positions.

Messages should dynamically follow the new chain positions.

---

## Step 9 — Pause / Resume / Speed

Implement:

```text
Pause
Resume
0.5x
1x
2x
4x
```

Do not rebuild the animation system.

The animation clock controls presentation.

---

## Step 10 — Message Batching

Detect messages with the same:

```text
sourceChainId
destinationChainId
```

within the grouping window.

Render batches.

Clicking a batch expands the messages.

---

## Step 11 — Message Detail Panel

Implement:

```text
MessageDetails
```

Animate the panel from the right.

Display:

- source
- destination
- protocol
- status
- IDs
- transactions
- payload
- timestamps

---

## Step 12 — Technical Lifecycle

Add:

```text
Technical Lifecycle
```

with:

```text
Message emitted
↓
Validator signatures
↓
Signature aggregation
↓
Relayer
↓
Destination verification
↓
Delivery
```

Only display factual stages supported by the data source.

Use explanatory copy for conceptual stages.

---

## Step 13 — Mock Live Mode

Create a mock message generator.

Every few seconds:

```text
new message
```

Animate it into the network.

Update statuses.

The network should feel alive.

---

## Step 14 — Filters

Implement:

- chain filters
- protocol filters
- status filters
- time filters

All filters operate on normalized `ICMMessage` objects.

---

## Step 15 — Custom Chains

Implement:

- add chain dialog
- Zod validation
- localStorage persistence
- custom chain rendering

Do not implement live data for custom chains yet unless an RPC URL is provided.

---

## Step 16 — Avalanche RPC Layer

Implement:

```text
rpc.ts
warp.ts
teleporter.ts
```

Use viem.

Start by reading source-chain events.

Do not attempt to build a complete historical indexer.

Fetch recent blocks only.

---

## Step 17 — Real ICM Adapter

Implement:

```text
AvalancheICMDataProvider
```

Normalize raw chain data into:

```ts
ICMMessage
```

The visualizer must remain unchanged.

Only the provider changes.

---

## Step 18 — Live Mode with Real Data

Connect TanStack Query to:

```text
AvalancheICMDataProvider
```

Poll every few seconds.

Deduplicate messages by stable ID.

Do not animate the same message twice.

---

## Step 19 — Explorer Integration

Add:

```text
View source transaction
View destination transaction
```

Use configured explorer URLs.

---

## Step 20 — Technical Polish

Add:

- loading states
- error states
- empty states
- keyboard accessibility
- copy buttons
- hover states
- subtle node activity effects
- responsive behavior

Do not add new major features.

---

# 46. Definition of Done

The first complete version is finished when a user can:

1. Open the application.
2. See multiple Avalanche L1s arranged around a circle.
3. See messages moving between them.
4. Enable/disable chains.
5. Pause the network.
6. Change animation speed.
7. Click a message.
8. Inspect its details.
9. Expand its technical lifecycle.
10. Filter messages.
11. Add a custom chain.
12. Switch between mock and live data.
13. Observe real Avalanche ICM traffic when configured.
14. Open the source/destination transactions.
15. Understand what happened without already knowing Avalanche.

---

# 47. Explicit Non-Goals

Do NOT implement in the first version:

- wallet connection
- transaction sending
- token transfers
- token prices
- portfolio tracking
- staking dashboards
- validator rewards
- governance
- authentication
- user accounts
- database
- social features
- chat
- AI assistant
- production monitoring
- alerting
- Kubernetes
- Terraform
- HSM integration
- custom blockchain indexing infrastructure
- generalized blockchain support

This is an **ICM visualization project**, not an Avalanche dashboard.

---

# 48. Product Quality Bar

The final result should feel like a small, polished developer tool.

It should be possible to open it for 10 seconds and immediately understand:

> "Messages are moving between Avalanche L1s."

It should then be possible to spend 5 minutes exploring one message and learn:

> "This is what an ICM message actually looks like and how it moves from one chain to another."

The application should prioritize:

1. visual clarity
2. technical correctness
3. interaction quality
4. useful protocol information
5. simplicity

Do not sacrifice those priorities for feature count.

---

# 49. Final UX Concept

The ideal first screen:

```text
┌─────────────────────────────────────────────────────────────────┐
│ ICM VISUALIZER                              ● LIVE    1×   ⚙    │
│ Avalanche Interchain Messaging                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌─────────┐                             │
│                    ╭────│  L1 A   │────╮                        │
│                   ╱     └─────────┘     ╲                       │
│                  ╱                       ╲                      │
│          ┌──────┐                           ┌──────┐            │
│          │ L1 B │        ✦──────→           │ L1 C │            │
│          └──────┘                           └──────┘            │
│                  ╲                       ╱                      │
│                   ╲                     ╱                       │
│                    ╰────┌─────────┐────╯                        │
│                         │ L1 D    │                             │
│                         └─────────┘                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ NETWORKS                                                        │
│ ☑ L1 A   ☑ L1 B   ☑ L1 C   ☑ L1 D   [+ Add chain]             │
│                                                                 │
│ FILTERS   All  Warp  Teleporter     STATUS   All Delivered ... │
└─────────────────────────────────────────────────────────────────┘
```

Clicking the `✦`:

```text
┌────────────────────────────────────────────────────┬────────────┐
│                                                    │ MESSAGE    │
│                    NETWORK                         │            │
│                                                    │ Teleporter │
│                         ✦                          │            │
│                         ↓                          │ L1 A → L1 B│
│                                                    │            │
│                                                    │ ✓ Delivered│
│                                                    │            │
│                                                    │ TIMELINE   │
│                                                    │            │
│                                                    │ 12:42:01   │
│                                                    │ Emitted    │
│                                                    │            │
│                                                    │ 12:42:02   │
│                                                    │ Signatures │
│                                                    │            │
│                                                    │ 12:42:03   │
│                                                    │ Relayed    │
│                                                    │            │
│                                                    │ 12:42:04   │
│                                                    │ Delivered  │
│                                                    │            │
│                                                    │ [Technical]│
└────────────────────────────────────────────────────┴────────────┘
```

This is the target experience.

---

# 50. Instruction to the Coding Agent

Implement this project incrementally in the exact order described above.

Do not prematurely build the real blockchain integration.

First make the visualization excellent with mock data.

Keep the domain model and data provider abstraction clean enough that the real Avalanche implementation can replace the mock implementation without changing the UI.

When a requirement is ambiguous, prefer:

1. technical correctness
2. minimal implementation
3. clean abstraction
4. visual polish

Do not add features not described in this specification.

Do not replace the radial SVG visualization with a generic graph library.

Do not turn the project into a generic blockchain explorer.

The final product should be a focused, technically credible and visually memorable **Avalanche ICM Visualizer**.