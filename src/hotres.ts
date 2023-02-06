import { CSStrategy, Macro } from "./combatMacros";
import { beachTask, commonFamiliarWeightBuffs, skillTask } from "./commons";
import { CSQuest } from "./engine";
import { horse, horsery } from "./lib";
import uniform from "./outfit";
import {
    adv1,
    handlingChoice,
    runChoice,
    visitUrl,
} from "kolmafia";
import {
    $effect,
    $effects,
    $familiar,
    $item,
    $location,
    $skill,
    CommunityService,
    get,
    have,
} from "libram";

const buffs = $effects`Elemental Saucesphere, Astral Shell, Feeling Peaceful`;

const MODIFIERS = ['Hot Resistance'];

const HotRes: CSQuest = {
    name: "Hot Res",
    type: "SERVICE",
    test: CommunityService.HotRes,
    modifiers: MODIFIERS,
    outfit: () => ({
        modifiers: MODIFIERS.join(','),
        familiar: $familiar`Exotic Parrot`,
    }),
    turnsSpent: 0,
    maxTurns: 1,
    tasks: [
        ...buffs.map(skillTask),
        ...commonFamiliarWeightBuffs(),
        beachTask($effect`Hot-Headed`),
        beachTask($effect`Does It Have a Skull In There??`),
        {
            name: "Extinguisher",
            completed: () => have($effect`Fireproof Foam Suit`),
            ready: () => get("_saberForceUses") < 5,
            do: (): void => {
                adv1($location`The Dire Warren`, -1, "");
                if (handlingChoice()) runChoice(-1);
            },
            choices: { [1387]: 3 },
            outfit: () =>
                uniform({
                    changes: {
                        familiar: $familiar.none,
                        famequip: $item.none,
                        weapon: $item`Fourth of May Cosplay Saber`,
                        offhand: $item`industrial fire extinguisher`,
                    },
                }),
            combat: new CSStrategy(() =>
                Macro.skill($skill`Fire Extinguisher: Foam Yourself`).skill($skill`Use the Force`)
            ),
            post: () =>
                visitUrl(`desc_item.php?whichitem=${$item`industrial fire extinguisher`.descid}`),
        },
        {
            name: "Pale Horse",
            completed: () => horsery() === "pale",
            do: () => horse("pale"),
        },
    ],
};

export default HotRes;