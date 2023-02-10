import { CSStrategy } from "./combatMacros";
import { commonFamiliarWeightBuffs, potionTask, restore, skillTask, songTask } from "./commons";
import { CSQuest } from "./engine";
import { hasNcBird, horse, horsery } from "./lib";
import { uniform } from "./outfit";
import { runChoice, runCombat, useSkill, visitUrl } from "kolmafia";
import { $effect, $effects, $familiar, $item, $skill, CommunityService, get, have } from "libram";

const Noncombat: CSQuest = {
    name: "Noncombat",
    type: "SERVICE",
    test: CommunityService.Noncombat,
    modifiers: ['Combat Rate'],
    outfit: () => ({
        modifier: '-combat',
        familiar: $familiar`Disgeist`,
    }),
    turnsSpent: 0,
    maxTurns: 1,
    tasks: [
        {
            name: "Horse",
            completed: () => horsery() === "dark",
            do: () => horse("dark"),
        },
        ...commonFamiliarWeightBuffs(),
        skillTask($effect`Smooth Movements`),
        skillTask($effect`Feeling Lonely`),
        skillTask($effect`Blessing of the Bird`),
        songTask($effect`The Sonata of Sneakiness`, $effect`Fat Leon's Phat Loot Lyric`),
        restore($effects`Smooth Movements, The Sonata of Sneakiness`),
        potionTask($item`shady shades`),
        {
            name: "Invisible Avatar",
            completed: () => have($effect`Invisible Avatar`),
            do: () => useSkill($skill`CHEAT CODE: Invisible Avatar`),
            outfit: { acc3: $item`Powerful Glove` },
        },
        {
            name: "Favourite Bird",
            completed: () => get("_favoriteBirdVisited"),
            ready: hasNcBird,
            do: () => useSkill($skill`Visit your Favorite Bird`),
        },
        // {
        //     name: "Swim Sprints",
        //     completed: () => get("_olympicSwimmingPool"),
        //     do: () => cliExecute("swim sprints"),
        // },
        {
            name: "God Lobster",
            completed: () => get("_godLobsterFights") >= 3,
            do: (): void => {
                visitUrl("main.php?fightgodlobster=1");
                runCombat();
                visitUrl("choice.php");
                runChoice(-1);
            },
            outfit: () =>
                uniform({
                    changes: {
                        familiar: $familiar`God Lobster`,
                        famequip: $item`God Lobster's Ring`,
                    },
                }),
            choices: { [1310]: 2 },
            combat: new CSStrategy(),
        },
    ],
};

export default Noncombat;