# Cuebooker bookings scale

Updated: 16 September 2026
Status: product/implementation contract for real bookings

## Why

The sample inbox contains only a few local examples. Production must remain usable with tens, hundreds or thousands of requests without turning the left request list into an endless scroll.

Do not implement fake pagination only for sample data. The scalable behaviour belongs to the real bookings data source.

## Desktop composition

Keep the approved list + Request Detail continuous surface.

Above the request list/detail surface add one compact control row:

- search;
- status filters;
- optional date range;
- result count;
- clear filters when active.

Search should match, at minimum:

- venue;
- promoter/contact;
- city;
- event name;
- booking/request identifier;
- artist when a manager workspace contains multiple artists.

The selected request remains open while filters change when it still belongs to the result set. If it disappears, select the first visible result or show the empty-detail state deliberately.

## Mobile composition

Keep the horizontally scrollable request selector already established for mobile.

Search and filters sit above it. Avoid a separate full-screen filter flow for the initial implementation. If filters later grow substantially, use a dedicated compact filter sheet.

## Pagination

Real bookings should use server-side pagination/cursoring rather than loading the complete inbox and slicing it in Vue.

Initial target:

- 25 items per page on desktop;
- 15–20 items per batch on narrow/mobile layouts;
- preserve search/filter query when moving between pages;
- keep stable ordering by most recently updated first unless the user chooses another sort.

Cursor pagination is preferred when the backend query supports it reliably. Offset pagination is acceptable for the first production version if the data source/query layer is simpler that way.

## Filtering

Status remains a first-class filter. Later useful filters can include:

- date/date range;
- city;
- venue;
- fee range;
- source/channel;
- artist for manager accounts;
- archived/history state.

Do not expose every filter at once. Start with search + status + date range, then add filters based on real usage.

## URL/state

When real bookings are connected, useful inbox state should be reflected in query params where practical, for example search/status/page. This improves reload/back behaviour without turning every small UI interaction into navigation.

## Performance

- debounce server search (roughly 200–300 ms);
- cancel stale requests;
- do not hydrate thousands of booking rows;
- request only the fields required for the list, then fetch/retain full Request Detail as needed;
- keep previously opened detail cached for fast back-and-forth navigation.

## Sample mode

Sample mode may support local search for demonstration, but it must not dictate the persistence or pagination architecture of real bookings.
