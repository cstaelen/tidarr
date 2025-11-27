import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { TIDAL_ITEMS_PER_PAGE } from "../contants";
import { PlaylistType, TidalPagedListType, TrackType } from "../types";

type SortField = "dateAdded" | "title" | "duration";
type SortDirection = "asc" | "desc";

type PlaylistContextType = {
	loading: boolean;
	playlist: PlaylistType | undefined;
	tracks: TrackType[] | undefined;
	page: number;
	total: number;
	sortField: SortField;
	sortDirection: SortDirection;
	actions: {
		queryPlaylist: () => void;
		setPage: (page: number) => void;
		setSort: (field: SortField, direction: SortDirection) => void;
	};
};

export const usePlaylist = (id?: string): PlaylistContextType => {
	const { fetchTidal } = useFetchTidal();

	const [loading, setLoading] = useState(false);
	const [playlist, setPlaylist] = useState<PlaylistType | undefined>(undefined);
	const [allTracks, setAllTracks] = useState<TrackType[]>([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);

	// Default: treat API order as "date added (oldest → newest)"
	// and show it inverted (newest first) on initial load.
	const [sortField, setSortField] = useState<SortField>("dateAdded");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const fetchAllTracks = useCallback(
		async (playlistId: string): Promise<TrackType[]> => {
			const collected: TrackType[] = [];

			let offset = 0;
			// Use a larger chunk size than the UI page size to avoid tons of API calls.
			const limit = TIDAL_ITEMS_PER_PAGE * 5;
			let totalItems: number | undefined;
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const data = await fetchTidal<
					TidalPagedListType<{ item: TrackType }>
				>(
					`/v1/playlists/${playlistId}/items`,
					{},
					{ limit, offset },
				);

				const items = data?.items?.map((p) => p.item) ?? [];
				collected.push(...items);

				totalItems =
					data?.totalNumberOfItems ??
					(data as any)?.total ??
					totalItems ??
					0;

				if (!items.length || collected.length >= (totalItems ?? 0)) {
					break;
				}

				offset += limit;
			}

			setTotal(totalItems ?? collected.length);
			return collected;
		},
		[fetchTidal],
	);

	const queryPlaylist = useCallback(async () => {
		if (!id) {
			setPlaylist(undefined);
			setAllTracks([]);
			setTotal(0);
			return;
		}

		setLoading(true);
		try {
			const pl = await fetchTidal<PlaylistType>(`/v1/playlists/${id}`);
			setPlaylist(pl);

			// Full track list (fetched in chunks) — used for global sorting + paging
			const tracks = await fetchAllTracks(id);
			setAllTracks(tracks);
		} catch (error) {
			console.error("Error fetching playlist", error);
			setPlaylist(undefined);
			setAllTracks([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [id, fetchTidal, fetchAllTracks]);

  // Reload playlist whenever ID changes
  useEffect(() => {
    if (!id) return;
    setPage(1);
    void queryPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

	/**
	 * Apply sorting to the full track list.
	 * - "dateAdded": use original playlist order, flip for desc
	 * - "title": A–Z / Z–A
	 * - "duration": short→long / long→short
	 */
	const sortedTracks = useMemo(() => {
		const items = [...allTracks];
		if (!items.length) return items;

		if (sortField === "title") {
			items.sort((a, b) =>
				(a.title || "").localeCompare(b.title || "", undefined, {
					sensitivity: "base",
				}),
			);
		} else if (sortField === "duration") {
			items.sort((a, b) => (a.duration || 0) - (b.duration || 0));
		} else {
			// "dateAdded": keep API order as-is for ASC
			// (TIDAL returns tracks in "oldest added → newest added")
		}

		// For any sort mode, DESC just reverses the ASC ordering.
		if (sortDirection === "desc") {
			items.reverse();
		}

		return items;
	}, [allTracks, sortField, sortDirection]);

	/**
	 * Slice sortedTracks into the current page.
	 */
	const pagedTracks = useMemo(() => {
		if (!sortedTracks.length) return [] as TrackType[];

		const start = (page - 1) * TIDAL_ITEMS_PER_PAGE;
		const end = start + TIDAL_ITEMS_PER_PAGE;

		return sortedTracks.slice(start, end);
	}, [sortedTracks, page]);

	const handleSetPage = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);

	const handleSetSort = useCallback(
		(field: SortField, direction: SortDirection) => {
			setSortField(field);
			setSortDirection(direction);
			// Go back to page 1 when sort changes so the user
			// lands at the top of the new ordering.
			setPage(1);
		},
		[],
	);

	return {
		loading,
		playlist,
		tracks: pagedTracks,
		page,
		total,
		sortField,
		sortDirection,
		actions: {
			queryPlaylist,
			setPage: handleSetPage,
			setSort: handleSetSort,
		},
	};
};
