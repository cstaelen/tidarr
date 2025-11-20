export function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formatter = new Intl.DateTimeFormat(
    navigator.language || "en-US",
    options,
  );
  return formatter.format(date);
}

export function getApiUrl(url: string): string {
  let apiUrl = url;
  if (import.meta.env.MODE !== "development") {
    apiUrl = apiUrl.replace("http://localhost:8484", "");
  }

  return apiUrl;
}
