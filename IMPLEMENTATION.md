# Continuous playlist playback in the web player

Implements the feature described in `TASK.md`: pressing play on a track shown
inside a track-list view (playlist, album, mix, search results, favorites, …)
now plays the **whole list** starting at the chosen track, advancing
automatically when each track ends. The floating player panel gains Previous
and Next controls. Play buttons outside any list context (e.g. the track
page header) keep the single-track behavior.

## How it works

- `app/src/provider/PlayerProvider.tsx`
  The player context now owns a playback queue: `queue` (the list snapshot
  taken when playback starts) and `queueIndex`. New actions:
  - `playQueue(tracks, startIndex)` — snapshot the list and play the chosen
    track.
  - `playNext()` / `playPrevious()` — step through the queue, returning
    whether a move happened. `stop()` clears the queue.
  - `hasNext` / `hasPrevious` — drive the enabled/disabled state of the new
    controls.
  - `userInitiated` — `true` when playback was started by a user action,
    `false` on automatic advancement. The floating panel only pops itself
    open for user-initiated plays, so auto-advance never re-opens a panel
    the user deliberately closed (playback itself continues regardless).

- `app/src/provider/TrackListProvider.tsx` (new)
  A small context that exposes "the enclosing list of tracks" to the play
  buttons rendered inside it. `Module` wraps its grid with it when the
  module type is `TRACK_LIST` or `ALBUM_ITEMS` (unwrapping the `.item`
  level and excluding videos, i.e. exactly what is rendered as tracks).
  Because every track-list view renders through `Module`, this covers
  playlist, album, mix, search and favorites lists without threading a
  `tracks` prop through every card component.

- `app/src/components/Buttons/PlayerButton.tsx`
  If a track-list context is present, pressing play calls
  `playQueue(list, indexOf(track))` instead of `play(track)`. Outside any
  list context the single-track `play()` is used, and the queue is cleared.

- `app/src/components/Player/PlayBack.tsx`
  - The audio `ended` handler now advances to the next queue track; when
    there is none it falls back to the previous behavior (`isPlaying`
    set to `false`). The handler reads `playNext` through a ref so queue
    state changes never restart the audio element.
  - New Previous / Next `IconButton`s (test ids `playback-previous` /
    `playback-next`), disabled at the queue boundaries.

- `app/src/components/Player/FloatingPlayer.tsx`
  The panel auto-opens only for user-initiated plays (see
  `userInitiated` above).

- `e2e/tests/continuousPlayback.spec.ts` (new) + `e2e/tests/utils/mock.ts`
  E2E coverage in the style of `playback.spec.ts`: starting from a chosen
  track, automatic advancement through the list (asserting the exact
  sequence of signed stream URLs), Previous/Next navigation, stopping at
  the end of the list, and single-track behavior on the track page.
  `mock.ts` gained reusable helpers `mockStreamEndpoints()` (sign/play
  route mocks with a signed-id callback) and `endCurrentTrack()`.

No new dependencies were added.

## Design notes

- The queue is a snapshot of the visible list at the moment play is
  pressed: paginated lists play everything loaded so far, without trying
  to auto-fetch further pages (out of scope, and "the whole list" of a
  paginated endpoint is ambiguous).

## Verification

- `tsc --noEmit` (app) — clean.
- `pnpm app-build` — clean.
- `pnpm lint` / `pnpm format-check` — clean (no new findings).
- The Docker/testcontainers e2e suite cannot run on this machine (no
  Docker daemon). Instead, the new spec and the existing
  `playback.spec.ts` scenarios were executed locally against the vite dev
  server with the same route mocks (plus container-less boot mocks for
  `/api/settings`, `/api/is-auth-active`, SSE, …): 4/4 new tests and 3/3
  regression scenarios passed, including a run where a real (silent) MP3
  was streamed to confirm audio keeps playing with the panel closed and
  auto-advance does not re-open it. The committed spec itself runs in the
  project's normal Docker-based e2e environment.
