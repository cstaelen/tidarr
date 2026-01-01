import { useState } from "react";
import { Box } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";
import { ModuleResponseType, useModules } from "src/hooks/useModules";
import {
	AlbumType,
	ArtistType,
	ModuleTypeKeys,
	PlaylistType,
	TrackType,
	VideoType,
} from "src/types";

import PagerButton from "../Buttons/PagerButton";
import Module from "./Module";

export function ModulePager({
	data,
	type,
}: {
	data: ModuleResponseType;
	type?: ModuleTypeKeys;
}) {
	const {
		pagedModuleLoading,
		actions: { queryModulePage },
	} = useModules();

	const [page, setPage] = useState(1);
	const [paginatedData, setPaginatedData] = useState<
		(AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[] | undefined
	>(
		// initial page = items already provided in the module
		(data.pagedList?.items as
			| (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
			| undefined) ?? undefined,
	);

	const url = data.pagedList?.dataApiPath
		? `/v1/${data.pagedList.dataApiPath}`
		: undefined;

	const limit = data?.pagedList?.limit || TIDAL_ITEMS_PER_PAGE;
	const nbPages = Math.ceil(
		(data.pagedList?.totalNumberOfItems || 0) / limit,
	);

	// Called whenever the user chooses a page in the pager
	const handlePageChange = async (newPage: number) => {
		if (!url) return;

		// Convert 1-based page number (UI) to 0-based index (API offset math)
		const apiPageIndex = newPage - 1;

		const pageData = await queryModulePage(url, apiPageIndex, limit);

		setPage(newPage);
		setPaginatedData(
			(pageData?.items as
				| (AlbumType | TrackType | PlaylistType | ArtistType | VideoType)[]
				| undefined) ?? [],
		);
	};

	if (isNaN(nbPages) || !url) return null;

	return (
		<Box sx={{ my: 2 }}>
			<Module type={type} data={paginatedData} loading={pagedModuleLoading} />
			<PagerButton
				page={page}
				setPage={handlePageChange}
				itemPerPage={limit}
				totalItems={data.pagedList?.totalNumberOfItems}
			/>
		</Box>
	);
}
