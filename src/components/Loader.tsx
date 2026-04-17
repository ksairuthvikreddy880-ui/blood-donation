/**
 * Reusable square loader — use instead of spinner everywhere.
 * <Loader /> — centered fullscreen
 * <Loader inline /> — inline small version
 */
interface LoaderProps {
  inline?: boolean;
}

export default function Loader({ inline = false }: LoaderProps) {
  const loader = (
    <div className="loader">
      <div className="loader-square" />
      <div className="loader-square" />
      <div className="loader-square" />
      <div className="loader-square" />
      <div className="loader-square" />
      <div className="loader-square" />
      <div className="loader-square" />
    </div>
  );

  if (inline) return loader;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {loader}
    </div>
  );
}
