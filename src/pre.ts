import { availableAmount, cliExecute, pvpAttacksLeft, use } from "kolmafia";
import { $item, get } from "libram";
import { ensureItem } from "./lib";

use(Math.min(3, availableAmount($item`Meteorite-Ade`)), $item`Meteorite-Ade`);
use(1, $item`School of Hard Knocks Diploma`);

const season = get("currentPVPSeason");

const PVP_STANCE: { [key: string]: string } = {
  bear: "Maul Power",
  pirate: "Smellin' Like a Stinkin' Rose",
  glitch: "Installation Wizard",
  numeric: "A Nice Cold One"
};

const getTarget = () => {
  switch (season) {
    case "bear":
      return "fame";
    default:
      return "loot";
  }
};

if (pvpAttacksLeft() > 0) {
  cliExecute("uberpvpoptimizer");
  cliExecute(`pvp ${getTarget()} ${PVP_STANCE[season]}`);
}

cliExecute("refresh inventory");
if (get('questL02Larva') !== 'unstarted') {
  ensureItem(1, $item`pixel star`);
}
// cliExecute('philter');
