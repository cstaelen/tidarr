const jsonLdMimeType = "application/ld+json";

type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type FetchStatusType = "error" | "empty" | "success";

type FetchResponseType = {
  status: FetchStatusType;
  response: Response;
};

const TOKEN = process.env.NEXT_PUBLIC_TIDAL_SEARCH_TOKEN;
const COUNTRY = process.env.NEXT_PUBLIC_TIDAL_COUNTRY_CODE;

export async function fetchTidal<T>(
    url: string,
    options: any = {}
): Promise<T> {
    options.headers = new Headers(options?.headers);

    const url_suffix = `&token=${TOKEN}&countryCode=${COUNTRY}&deviceType=BROWSER&locale=en_US`;
    // POST, PUT payload encoding
    if (
        "undefined" !== options.body &&
    !(options.body instanceof FormData) &&
    null === options.headers.get("Content-Type")
    ) {
        options.headers.set("Content-Type", jsonLdMimeType);
    }

    const response = await fetch(`${url}${url_suffix}`, {
        ...options,
    });

    // success

    if (response?.ok) {
        return await response.json();
    }

    // error

    if (500 <= response?.status) {
        throw new Error("An error occured");
    }
    if (403 === response?.status) {
        throw new Error("Authorization error");
    }
    if (404 === response?.status) {
        throw new Error("Not found");
    }

    throw new Error();
}