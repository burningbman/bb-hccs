import { availableAmount, cliExecute, pvpAttacksLeft, use } from 'kolmafia';
import { $item } from 'libram';
import { ensureItem } from './lib';

use(Math.min(3, availableAmount($item`Meteorite-Ade`)), $item`Meteorite-Ade`);
use(1, $item`School of Hard Knocks Diploma`);

if (pvpAttacksLeft() > 0) {
  cliExecute('uberpvpoptimizer');
  cliExecute('pvp loot early');
}

cliExecute('refresh inventory');
ensureItem(1, $item`pixel star`);
cliExecute('philter');
