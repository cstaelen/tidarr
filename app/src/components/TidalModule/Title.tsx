export function ModuleTitle({
  title,
  total,
}: {
  title: string;
  total?: number;
}) {
  if (!title) return <br />;
  return (
    <div className="module-title">
      <h2>
        {title.toLowerCase() === "featured albums" ? "Albums" : title}{" "}
        {total ? `(${total})` : ""}
      </h2>
      <hr />
      <br />
    </div>
  );
}
