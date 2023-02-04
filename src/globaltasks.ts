import { Quest, Task } from "grimoire-kolmafia";
import { abort, adv1, cliExecute, reverseNumberology, useSkill } from "kolmafia";
import { $effect, $item, $location, $skill, Counter, get, have, withProperty } from "libram";

const GLOBAL_TASKS: Task[] = [
    {
        name: "Beaten Up!",
        completed: () => !have($effect`Beaten Up`),
        ready: () => "Poetic Justice" !== get("lastEncounter"),
        do: () => abort("Beaten up!"),
    },
    {
        name: "Numberology",
        ready: () => Object.values(reverseNumberology()).includes(69) && get("skillLevel144") <= 3,
        completed: () => get("_universeCalculated") >= get("skillLevel144"),
        do: () => cliExecute("numberology 69"),
    },
    {
        name: "June Cleaver",
        completed: () => get("_juneCleaverFightsLeft") > 0,
        ready: () => Counter.get("Portscan") === Infinity,
        do: () =>
            withProperty("recoveryScript", "", () => {
                adv1($location`Noob Cave`, -1, "");
                if (get("lastEncounter") === "Poetic Justice")
                    useSkill($skill`Tongue of the Walrus`);
            }),
        outfit: { weapon: $item`June cleaver` },
    },
];

const GLOBAL_QUEST: Quest<Task> = { name: "Global", tasks: GLOBAL_TASKS };

export default GLOBAL_QUEST;