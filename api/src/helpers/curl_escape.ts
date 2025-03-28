export function curl_escape_all(str: string) {
  const regexQuote = new RegExp("'", "g");
  const regexDoubleQuote = new RegExp('"', "g");
  return str.replace(regexQuote, "'\\''").replace(regexDoubleQuote, '\\"');
}

export function curl_escape_double_quote(str: string) {
  const regexDoubleQuote = new RegExp('"', "g");
  return str.replace(regexDoubleQuote, '\\"');
}
