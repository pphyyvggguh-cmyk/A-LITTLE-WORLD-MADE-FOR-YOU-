# Security Specification — A Little World Made For You ♡

## 1. Master Relationship Mapping
- **Bootstrapped & Trusted Admin (`/admins/{userId}`)**:
  - Primary admin is strictly `oktafmbul0@gmail.com` (`email_verified == true`), verified either directly by verified email match or `/admins/{request.auth.uid}` existence.
  - Users cannot self-assign admin status in any collection.
- **Couple Authorization Config (`/config/access`)**:
  - Holds `adminEmail`, `oktafEmail`, `wulanEmail`, and `wishlistPrivacyMode`.
  - Readable ONLY by `isAdmin()` or the verified email configured in `resource.data.wulanEmail`. Never readable by public/anonymous visitors (PII protection).
  - Mutable ONLY by `isAdmin()`.
- **Public Content Partition (`/siteContent/{sectionId}`)**:
  - Partitioned to fixed keys `story`, `world`, `letters`, `video`, `miniOktaf`, `vinyl` so every doc stays well under Firestore's 1MB limit.
  - Public visitors can `get` individual sections; `list` is restricted to `isAdmin()`.
  - Only `isAdmin()` can `create` / `update` / `delete`.
- **Voices of Love (`/voices/{voiceId}`)**:
  - Individual friend recordings referencing Firebase Storage URLs.
  - Public `get` / `list` is strictly scoped via `resource.data.permissionConfirmed == true || isAdmin()`.
  - Writes strictly require `isAdmin()`, valid schema, `ownerUid == request.auth.uid`, and `request.time` timestamps.
- **Vinyl Playlist (`/vinylPlaylist/{trackId}`)**:
  - Public `get` / `list` scoped via `resource.data.isPublished == true || isAdmin()`.
  - Writes strictly require `isAdmin()`, 11-character `youtubeVideoId` regex match, and `request.time` timestamps.
- **Media Assets Index (`/mediaAssets/{assetId}`)**:
  - Strictly `isAdmin()` read/write (`get`, `list`, `create`, `update`, `delete`).
- **Our Story Secret Notes (`/secretNotes/{noteId}`)**:
  - Individual hidden envelope notes assigned to Our Story pages `1..17`.
  - Public `get` / `list` strictly scoped via `resource.data.enabled == true || isAdmin()` so disabled notes are never exposed to public visitors.
  - All mutations (`create`, `update`, `delete`) require `isAdmin()`, valid schema (`pageNumber` `1..17`), immutable `ownerUid`/`createdAt`, and `request.time` timestamps.
- **Our Future Wishlist (`/wishlist/{wishId}`)**:
  - Supports **three visibility modes**:
    1. `public`: Readable by website visitors without logging in (`allow get`, `allow list` scoped via `resource.data.visibility == 'public'`).
    2. `private` (and legacy `couple`): Readable ONLY by authorized Oktaf and Wulan Google accounts.
    3. `shared`: Readable and collaboratively editable/deletable by authorized Oktaf and Wulan accounts.
  - Every `list` query evaluates `resource.data` directly (zero `get()`/`exists()` inside `allow list`).
  - `create` requires `isCoupleMember()`, `creatorUid == request.auth.uid`, `creatorEmail == lowerEmail()`, `createdAt == request.time`, `updatedAt == request.time`, `visibility in ['public', 'private', 'shared', 'couple']`, `photos.size() <= 6`, `allowedEmails.size() <= 4`.
  - `update` enforces immutable `id`, `creatorUid`, `creatorEmail`, `creatorRole`, `createdAt`, `updatedAt == request.time`, and prevents non-admin regression from terminal `completed` state.
- **Postcards From The Future (`/postcards/{postcardId}` & `/postcards/{postcardId}/secret/{secretId}`)**:
  - **Split-Collection Time-Lock Architecture**:
    - `/postcards/{postcardId}` (`PostcardEnvelope`) holds ONLY non-secret envelope metadata (title, sender, recipient, visibility, `unlockAt` Timestamp, location, stampStyle, designTheme, `isOpened`, `order`). Never holds `message` or `photoUrl`.
    - `/postcards/{postcardId}/secret/content` (`PostcardSecret`) holds `message` and optional `photoUrl`. `allow list: if false;` on secrets.
  - **Zero-Bypass Time Gate (`request.time >= env.unlockAt`)**:
    - Secret reads (`allow get`) are permitted ONLY when:
      1. Author (`env.senderUid == request.auth.uid`) inspects/edits their own draft; OR
      2. Public unlocked postcard (`env.visibility == 'public' && request.time >= env.unlockAt`); OR
      3. Authorized couple member (`isCoupleMember()`, matching `allowedEmails`) after `request.time >= env.unlockAt`.
    - Even `isAdmin()` cannot read a locked surprise postcard created by Wulan (`recipient == 'oktaf'`) before `request.time >= env.unlockAt`.
    - Marking `isOpened: true` strictly requires `request.time >= existing().unlockAt`, `incoming().openedAt == request.time`, and authorized recipient matching (`oktaf` / `wulan` / `both`).
    - Creation requires atomic batch pairing via `existsAfter` across parent envelope and `secret/content`.

## 2. Data Invariants
1. Public visitors never see `config/access`, `admins`, `mediaAssets`, `private`/`couple`/`shared` wishlist items, or private postcard envelopes.
2. Locked postcard `message` and `photoUrl` NEVER exist on `/postcards/{postcardId}` and NEVER return from `/postcards/{postcardId}/secret/content` before server `request.time >= unlockAt`.
3. Unverified tokens (`email_verified != true`) are rejected from ALL mutations and ALL private reads.
4. No document ID exceeding 128 chars or containing non-`[a-zA-Z0-9_-]` characters can be written.
5. No arbitrary client-forged timestamps (`createdAt`/`updatedAt`/`openedAt`) are accepted — `request.time` is strictly enforced.
6. Arrays and strings enforce explicit `.size()` bounds matching `firebase-blueprint.json`.

## 3. "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Private Wishlist Read**: Anonymous visitor runs `get` or `list` querying `visibility == 'private'` or `'couple'` on `/wishlist`.
2. **Third-Party Account Snooping**: Verified `stranger@gmail.com` queries `private` docs on `/wishlist`, `/postcards`, or `get` on `/config/access`.
3. **Time-Lock Clock Spoofing (Postcard Secret Peek)**: Wulan or public visitor changes device clock to 2099 and calls `get(/postcards/future1/secret/content)` before `request.time >= unlockAt`.
4. **Early Envelope Open Mutation**: Recipient tries `update(/postcards/future1)` setting `isOpened: true` before `request.time >= existing().unlockAt`.
5. **Pre-Unlock Admin Peek at Partner Surprise**: Oktaf tries reading Wulan's locked postcard addressed to `recipient: 'oktaf'` before `request.time >= unlockAt`.
6. **Email Spoofing (Unverified Email)**: Token claims `email: "oktafmbul0@gmail.com"` with `email_verified: false` attempting admin write.
7. **Admin Self-Escalation**: Non-admin user attempts `create` on `/admins/{theirUid}` with `{ role: "admin" }`.
8. **Shadow / Ghost Field Injection**: Couple member creates `/wishlist/w1` or `/postcards/p1` with extra `{ isAdminOverride: true }` field.
9. **Creator / Sender Identity Spoofing**: Wulan creates `/postcards/p2` with `senderUid: "oktaf-uid-123"`.
10. **Orphan Secret Without Envelope**: User attempts `create` on `/postcards/nonexistent/secret/content` without parent envelope existing in same batch.
11. **Unauthorized Personal Wish Edit**: Wulan tries to edit Oktaf's `private` personal wish (`category: 'your'`).
12. **Terminal State Regression**: Non-admin tries to revert a `'completed'` wish back to `'dreaming'` in `/wishlist/{wishId}`.
