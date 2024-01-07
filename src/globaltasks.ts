import { OutfitSpec, Quest, Task } from "grimoire-kolmafia";
import { abort, adv1, cliExecute, haveEffect, myAdventures, reverseNumberology, totalTurnsPlayed, useSkill } from "kolmafia";
import { $effect, $item, $location, $skill, Counter, get, have, withProperty } from "libram";
import { CSStrategy, Macro } from "./combatMacros";
import { getBestFamiliar, sausageFightGuaranteed, voterMonsterNow } from "./lib";
import { levelUniform } from "./outfit";

const GOBLIN_TASK: Task = {
    name: "Sausage Goblin",
    completed: () => totalTurnsPlayed() === get('_lastSausageMonsterTurn'),
    ready: () => sausageFightGuaranteed() && !have($effect`Feeling Lost`) && !haveEffect($effect`Meteor Showered`),
    outfit: (): OutfitSpec => {
        return levelUniform({
            changes: {
                offhand: $item`Kramco Sausage-o-Matic™`,
            }
        });
    },
    do: $location`Noob Cave`,
    combat: new CSStrategy(() => Macro.if_(
        '!monstername "sausage goblin"',
        new Macro().step("abort")
    ).itemSkills().easyFight().kill()),
    limit: { tries: 1 }
};

const PRE_QUEST: Quest<Task> = {
    name: "Pre-Quest Global", tasks: [
        {
            name: "Beaten Up!",
            completed: () => !have($effect`Beaten Up`),
            ready: () => "Poetic Justice" !== get("lastEncounter"),
            do: () => abort("Beaten up!"),
        },
        {
            name: "Numberology",
            ready: () => Object.values(reverseNumberology()).includes(69) && get("skillLevel144") <= 3 && myAdventures() > 0,
            completed: () => get("_universeCalculated") >= get("skillLevel144"),
            do: () => cliExecute("numberology 69"),
            limit: { tries: 1 }
        },
        {
            name: "June Cleaver",
            completed: () => get("_juneCleaverFightsLeft") > 0,
            ready: () => !have($effect`Meteor Showered`) && Counter.get("Portscan") === Infinity,
            do: () =>
                withProperty("recoveryScript", "", () => {
                    useSkill($skill`Cannelloni Cocoon`);
                    adv1($location`Noob Cave`, -1, "");
                    if (get("lastEncounter") === "Poetic Justice")
                        useSkill($skill`Tongue of the Walrus`);
                }),
            outfit: { weapon: $item`June cleaver` },
        }
    ]
};

const POST_QUEST: Quest<Task> = {
    name: "Post-Quest Global",
    tasks: [GOBLIN_TASK, {
        name: "Voting Monster",
        completed: () => totalTurnsPlayed() === get('lastVoteMonsterTurn'),
        ready: () => voterMonsterNow() && !have($effect`Feeling Lost`) && !haveEffect($effect`Meteor Showered`),
        outfit: (): OutfitSpec => {
            return {
                acc3: $item`"I Voted!" sticker`,
                familiar: getBestFamiliar()
            };
        },
        do: $location`Noob Cave`,
        combat: new CSStrategy(() => Macro.default()),
        limit: { tries: 1 }
    }
    ]
};

export { PRE_QUEST, POST_QUEST, GOBLIN_TASK };