import { beachTask, potionTask, restore, skillTask, thrallTask } from "./commons";
import { CSQuest } from "./engine";
import { itemAmount, myThrall, Thrall, use, useSkill } from "kolmafia";
import {
    $effect,
    $effects,
    $item,
    $items,
    $skill,
    $thrall,
    CommunityService,
    have,
} from "libram";
import { Task } from "grimoire-kolmafia";

const SKILL_BUFFS = {
    MUSCLE: $effects`Feeling Excited, Big, Song of Bravado, Rage of the Reindeer, Quiet Determination, Disdain of the War Snapper`,
    MYSTICALITY: $effects`Feeling Excited, Big, Song of Bravado`,
    MOXIE: $effects`Feeling Excited, Big, Song of Bravado, Blessing of the Bird, Quiet Desperation, Disco Fever, Blubbered Up, Mariachi Mood, Disco State of Mind`,
    HP: $effects`Feeling Excited, Big, Song of Starch, Rage of the Reindeer, Quiet Determination, Disdain of the War Snapper`,
};

function skillBuffTasks(key: keyof typeof SKILL_BUFFS): Task[] {
    return [...SKILL_BUFFS[key].map(skillTask), restore(SKILL_BUFFS[key])];
}

const Muscle: CSQuest = {
    name: "Muscle",
    type: "SERVICE",
    test: CommunityService.Muscle,
    modifiers: ['Muscle', 'Muscle Percent'],
    turnsSpent: 0,
    maxTurns: 1,
    outfit: () => ({
        modifier: ['Muscle', 'Muscle Percent'].join(',')
    }),
    tasks: [
        ...skillBuffTasks("MUSCLE"),
        thrallTask($thrall`Elbow Macaroni`),
        beachTask($effect`Lack of Body-Building`),
        { ...potionTask($item`Ben-Gal™ Balm`) },
    ],
};

const Mysticality: CSQuest = {
    name: "Mysticality",
    type: "SERVICE",
    test: CommunityService.Mysticality,
    modifiers: ['Mysticality', 'Mysticality Percent'],
    turnsSpent: 0,
    maxTurns: 1,
    tasks: [...skillBuffTasks("MYSTICALITY")],
    outfit: () => ({
        modifier: ['Mysticality', 'Mysticality Percent'].join(',')
    }),
};

const Moxie: CSQuest = {
    name: "Moxie",
    type: "SERVICE",
    test: CommunityService.Moxie,
    modifiers: ['Moxie', 'Moxie Percent'],
    turnsSpent: 0,
    maxTurns: 1,
    outfit: () => ({
        modifier: ['Moxie', 'Moxie Percent'].join(',')
    }),
    tasks: [
        ...skillBuffTasks("MOXIE"),
        ...$items`runproof mascara, confiscated love note, dollop of barbecue sauce`.map(
            potionTask
        ),
        {
            name: "Rhinestones",
            completed: () => !have($item`rhinestone`),
            do: (): void => {
                useSkill($skill`Acquire Rhinestones`);
                use(itemAmount($item`rhinestone`), $item`rhinestone`);
            }
        },
        thrallTask($thrall`Penne Dreadful`),
        potionTask($item`pocket maze`),
        beachTask($effect`Pomp & Circumsands`)
    ],
};

const Hitpoints: CSQuest = {
    name: "Hitpoints",
    type: "SERVICE",
    test: CommunityService.HP,
    turnsSpent: 0,
    maxTurns: 1,
    modifiers: ['Maximum HP', 'Maximum HP Percent'],
    outfit: () => ({
        modifier: ['Maximum HP', 'Maximum HP Percent'].join(',')
    }),
    tasks: [
        ...skillBuffTasks("HP"),
        thrallTask($thrall`Elbow Macaroni`),
    ],
};

export { Muscle, Mysticality, Moxie, Hitpoints };