import { createFileRoute } from "@tanstack/react-router";
import { GetFirstMovie } from "~/components/get-first-movie";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <GetFirstMovie />
    </div>
  );
}
