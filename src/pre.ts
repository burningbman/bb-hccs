import { abort, availableAmount, cliExecute, pvpAttacksLeft, use } from "kolmafia";
import { $item } from "libram";
import { ensureItem } from "./lib";

use(Math.min(3, availableAmount($item`Meteorite-Ade`)), $item`Meteorite-Ade`);
use(1, $item`School of Hard Knocks Diploma`);

let noError = true;

if (pvpAttacksLeft() > 0) {
  noError = cliExecute("uberpvpoptimizer");
  noError = noError && cliExecute(`PVP_MAB`);
}

cliExecute("refresh inventory");
cliExecute('av-snapshot');
cliExecute('greenbox');
ensureItem(1, $item`pixel star`);

!noError && abort();