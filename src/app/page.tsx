import GameCanvas from "@/components/GameCanvas";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Pinball 🎮</h1>
      <GameCanvas />
    </main>
  );
}
