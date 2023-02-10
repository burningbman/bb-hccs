import { CSStrategy, Macro } from "./combatMacros";
import {
    beachTask,
    doYouCrush,
    meteorShower,
    potionTask,
    restore,
    skillTask,
    songTask,
} from "./commons";
import { CSQuest } from "./engine";
import { horse, horsery } from "./lib";
import { uniform } from "./outfit";
import {
    cliExecute,
    create,
    myLevel,
    retrieveItem,
    use,
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

const buffs = $effects`Carol of the Hells, Arched Eyebrow of the Archmage, Song of Sauce`;
// const chefstaves = $items`Staff of the Roaring Hearth, Staff of Kitchen Royalty, Staff of the Deepest Freeze, Staff of Frozen Lard, Staff of the Peppermint Twist, Staff of the Roaring Hearth`;

const Spell: CSQuest = {
    name: "Spell Damage",
    type: "SERVICE",
    test: CommunityService.SpellDamage,
    turnsSpent: 1,
    maxTurns: 31,
    modifiers: ["Spell Damage", "Spell Damage Percent"],
    outfit: () => {
        return {
            modifier: ["Spell Damage", "Spell Damage Percent"].join(','),
            modes: {
                umbrella: 'constantly twirling'
            }
        };
    },
    tasks: [
        skillTask($skill`Simmer`),
        doYouCrush(),
        songTask($effect`Jackasses' Symphony of Destruction`, $effect`The Sonata of Sneakiness`),
        ...buffs.map(skillTask),
        restore(buffs),
        beachTask($effect`We're All Made of Starfish`),
        {
            name: "Weeping Willow Wand",
            completed: () => have($item`weeping willow wand`),
            do: (): void => {
                if (!have($item`flimsy hardwood scraps`)) use($item`SpinMaster™ lathe`);
                retrieveItem($item`weeping willow wand`);
            },
        },
        {
            name: "Mariachi Hat",
            completed: () => have($item`mariachi hat`),
            do: () => retrieveItem($item`mariachi hat`),
        },
        {
            name: "Tea Party",
            completed: () => get("_madTeaParty"),
            do: () => cliExecute("hatter mariachi hat"),
            prepare: (): void => {
                visitUrl("clan_viplounge.php?action=lookingglass&whichfloor=2");
                use($item`"DRINK ME" potion`);
            },
        },
        skillTask($skill`Spirit of Cayenne`),
        potionTask($item`flask of baconstone juice`),
        {
            name: "Saucefingers",
            completed: () => have($effect`Saucefingers`),
            ready: () => myLevel() >= 15,
            do: $location`The Dire Warren`,
            prepare: () => horsery() === "pale" && horse("dark"),
            outfit: () => uniform({ changes: { familiar: $familiar`Mini-Adventurer` } }),
            combat: new CSStrategy(() =>
                Macro.trySkill($skill`Feel Hatred`)
                    .trySkill($skill`Snokebomb`)
                    .abort()
            ),
            choices: { [768]: 4 },
            limit: { tries: 2 }
        },
        meteorShower(),
        potionTask($item`pixel star`),
        potionTask($item`cordial of concentration`),
        {
            name: "Play Pool",
            completed: () => get("_poolGames") >= 3 || have($effect`Mental A-cue-ity`),
            do: () => cliExecute("pool 1"),
        },
        {
            name: 'Create sugar chapeau',
            ready: () => have($item`sugar sheet`),
            completed: () => have($item`sugar chapeau`),
            do: () => create($item`sugar chapeau`)
        }
        // {
        //     name: "Pull Staff",
        //     completed: () => chefstaves.some((staff) => have(staff)),
        //     core: "soft",
        //     do: (): void => {
        //         const staff = chefstaves.find((s) => storageAmount(s) > 0 && canEquip(s));
        //         if (staff) takeStorage(staff, 1);
        //     },
        // },
    ],
};

export default Spell;