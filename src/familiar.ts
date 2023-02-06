import { commonFamiliarWeightBuffs, famPool, meteorShower, potionTask } from "./commons";
import { CSQuest } from "./engine";
import { unequip } from "./lib";
import { mySign, visitUrl } from "kolmafia";
import {
    $familiar,
    $item,
    CommunityService,
    get,
} from "libram";

const MODIFIERS = ['Familiar Weight'];

const FamiliarWeight: CSQuest = {
    name: "Familiar Weight",
    type: "SERVICE",
    modifiers: MODIFIERS,
    test: CommunityService.FamiliarWeight,
    outfit: () => ({
        modifier: MODIFIERS.join(','),
        familiar: $familiar`Mini-Trainbot`,
    }),
    turnsSpent: 0,
    maxTurns: 30,
    tasks: [
        ...commonFamiliarWeightBuffs(),
        potionTask($item`short stack of pancakes`),
        {
            name: "Tune Moon",
            ready: () => mySign() !== "Platypus",
            completed: () => get("moonTuned"),
            do: (): void => {
                unequip($item`hewn moon-rune spoon`);
                visitUrl("inv_use.php?whichitem=10254&pwd&doit=96&whichsign=4");
            }
        },
        meteorShower(),
        potionTask($item`silver face paint`),
        famPool()
    ],
};

export default FamiliarWeight;