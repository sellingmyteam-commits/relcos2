import { GamePage } from "@/components/GamePage";
export default function Eaglercraft() {
  return (
    <GamePage
      src="/game/EaglercraftX_1.8_u53_Offline_Signed.html"
      title="Eaglercraft 1.8.8"
      gameId="eaglercraft"
      banner={
        <div className="bg-red-600/20 border-b border-red-500/30 py-2 px-4 text-center">
          <p className="text-red-500 font-bold text-sm">
            The game might take a while to load due to your ass laptops
          </p>
        </div>
      }
    />
  );
}
