import React, { ReactNode, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetchTidal } from "src/hooks/useFetchTidal";

import { TIDAL_ITEMS_PER_PAGE } from "../contants";
import { TidalResponseType } from "../types";

import { useConfigProvider } from "./ConfigProvider";

type SearchContextType = {
	searchResults: TidalResponseType;
	keywords: string | undefined;
	loading: boolean;
	page: number;
	actions: {
		setPage: (page: number) => void;
		runSearch: (keywords: string) => void;
		// keep the original type signature for compatibility
		queryTidal: (query: string, page: number) => void;
	};
};

const SearchContext = React.createContext<SearchContextType>({} as SearchContextType);

export function SearchProvider({ children }: { children: ReactNode }) {
	const [loading, setLoading] = useState<boolean>(false);
	const [page, setPage] = useState<number>(1);
	const [keywords, setKeywords] = useState<string>();
	const { config } = useConfigProvider();

	const [searchResults, setSearchResults] = useState<TidalResponseType>({} as TidalResponseType);

	const params = useParams();

	const { fetchTidal } = useFetchTidal();

	async function runSearch(searchString: string) {
		setLoading(true);
		await queryTidal(searchString);
		setLoading(false);
	}

	// NOTE: keep the original signature (only 'query' arg) for compatibility with callers.
	async function queryTidal(query: string) {
		const results = await fetchTidal<TidalResponseType>(
			"/v1/search",
			{},
			{
				query: query,
				offset: (page - 1) * TIDAL_ITEMS_PER_PAGE,
				limit: TIDAL_ITEMS_PER_PAGE,
			},
		);

		// IMPORTANT: Replace (do not append) so page navigation shows the current slice only.
		const data = {
			albums: {
				...results?.albums,
				items: results?.albums?.items || [],
				// keep if the API provides it; harmless if the type doesn't require it
				totalNumberOfItems:
					results?.albums?.totalNumberOfItems ??
					(results as any)?.albums?.total ??
					0,
			},
			artists: {
				...results?.artists,
				items: results?.artists?.items || [],
				totalNumberOfItems:
					results?.artists?.totalNumberOfItems ??
					(results as any)?.artists?.total ??
					0,
			},
			tracks: {
				...results?.tracks,
				items: results?.tracks?.items || [],
				totalNumberOfItems:
					results?.tracks?.totalNumberOfItems ??
					(results as any)?.tracks?.total ??
					0,
			},
			playlists: {
				...results?.playlists,
				items: results?.playlists?.items || [],
				totalNumberOfItems:
					results?.playlists?.totalNumberOfItems ??
					(results as any)?.playlists?.total ??
					0,
			},
			videos: {
				...results?.videos,
				items: results?.videos?.items || [],
				totalNumberOfItems:
					results?.videos?.totalNumberOfItems ??
					(results as any)?.videos?.total ??
					0,
			},
		};

		setSearchResults(data as TidalResponseType);
	}

	// Fetch on page change
	useEffect(() => {
		// eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, react-hooks/set-state-in-effect
		if (keywords) runSearch(keywords);
	}, [page]);

	// Reset results + page when the keyword changes
	useEffect(() => {
		if (keywords) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSearchResults({} as TidalResponseType);
			if (page > 1) {
				setPage(1);
				return;
			}

			runSearch(keywords);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [keywords]);

	// If url query exists on load
	useEffect(() => {
		if (!params.keywords || !config) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setKeywords(undefined);
			return;
		}

		setKeywords(params.keywords);
	}, [params, config]);

	const value = {
		searchResults,
		loading,
		keywords,
		page,
		actions: {
			setPage,
			// keep assignment compatible with the original actions type
			queryTidal: (q: string) => {
				void queryTidal(q);
			},
			runSearch,
		},
	};

	return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export const useSearchProvider = () => {
	return useContext(SearchContext);
};
