import { Box, Pagination } from "@mui/material";
import { TIDAL_ITEMS_PER_PAGE } from "src/contants";

export default function PagerButton({
    page,
    totalItems,
    itemPerPage = TIDAL_ITEMS_PER_PAGE,
    setPage,
}: {
    page: number;
    totalItems: number;
    itemPerPage?: number;
    setPage: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / itemPerPage));
    if (totalPages <= 1) return null;

    const handleChange = (_: React.ChangeEvent<unknown>, value: number) => {
        // Prefer absolute page navigation if consumer accepts an argument.
        if (setPage.length && setPage.length > 0) {
            setPage(value);
            return;
        }
        // Legacy fallback (increment-only handlers)
        if (value > page) {
            const steps = value - page;
            for (let i = 0; i < steps; i++) setPage(0 as unknown as number);
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <Pagination
                count={totalPages}
                page={Math.min(page, totalPages)}
                onChange={handleChange}
                showFirstButton
                showLastButton
                size="large"
            />
        </Box>
    );
}
