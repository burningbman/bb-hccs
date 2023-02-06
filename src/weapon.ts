import { CSStrategy, Macro } from "./combatMacros";
import { beachTask, doYouCrush, famPool, potionTask, restore, skillTask, songTask } from "./commons";
import { CSQuest } from "./engine";
import uniform from "./outfit";
import {
    availableAmount,
    handlingChoice,
    myHp,
    myMaxhp,
    runChoice,
    useSkill,
} from "kolmafia";
import {
    $effect,
    $effects,
    $familiar,
    $item,
    $monster,
    $skill,
    CombatLoversLocket,
    CommunityService,
    ensureEffect,
    get,
    have,
    set,
    SongBoom,
} from "libram";
import { ensureMp } from "./lib";

const buffs = $effects`Carol of the Bulls, Song of the North, Rage of the Reindeer, Scowl of the Auk, Disdain of the War Snapper, Tenacity of the Snapper, Blessing of the Bird`;

let meteors: number;
const Weapon: CSQuest = {
    name: "Weapon Damage",
    type: "SERVICE",
    test: CommunityService.WeaponDamage,
    modifiers: ["Weapon Damage", "Weapon Damage Percent"],
    outfit: () => {
        return {
            modifier: ["Weapon Damage", "Weapon Damage Percent"].join(',')
        };
    },
    turnsSpent: 0,
    maxTurns: 1,
    tasks: [
        {
            name: "Deep Dark Visions",
            completed: () => have($effect`Visions of the Deep Dark Deeps`, 40),
            do: (): void => {
                while (myHp() < myMaxhp()) {
                    ensureMp(20);
                    useSkill(1, $skill`Cannelloni Cocoon`);
                }
                ensureMp(100);
                useSkill(1, $skill`Deep Dark Visions`);
            },
            outfit: {
                modifier: "10 spooky res, 10 cold res, HP",
                familiar: $familiar`Exotic Parrot`,
            },
        },
        ...buffs.map(skillTask),
        restore(buffs),
        skillTask($effect`Frenzied, Bloody`),
        potionTask($item`vial of hamethyst juice`),
        beachTask($effect`Lack of Body-Building`),
        songTask($effect`Jackasses' Symphony of Destruction`, $effect`The Sonata of Sneakiness`),
        famPool(),
        doYouCrush(),
        {
            name: "Spit Ungulith",
            completed: () => have($effect`Spit Upon`),
            ready: () => get("camelSpit") >= 100,
            do: (): void => {
                meteors = get("_meteorShowerUses");
                CombatLoversLocket.reminisce($monster`ungulith`);
                if (handlingChoice()) runChoice(-1);
            },
            choices: { [1387]: 3 },
            outfit: () =>
                uniform({
                    changes: {
                        familiar: $familiar`Melodramedary`,
                        weapon: $item`Fourth of May Cosplay Saber`,
                    },
                }),
            post: (): void => {
                if (have($effect`Spit Upon`)) set("camelSpit", 0);
                if (meteors && have($effect`Meteor Showered`))
                    set("_meteorShowerUses", meteors + 1);

                const ungId = $monster`ungulith`.id.toFixed(0);
                const locketIdStrings = get("_locketMonstersFought")
                    .split(",")
                    .map((x) => x.trim())
                    .filter((x) => x.length > 0);
                if (!locketIdStrings.includes(ungId)) {
                    locketIdStrings.push(ungId);
                    set("_locketMonstersFought", locketIdStrings.join(","));
                }
            },
            combat: new CSStrategy(() =>
                Macro.trySkill($skill`%fn, spit on me!`)
                    .trySkill($skill`Meteor Shower`)
                    .skill($skill`Use the Force`)
            ),
        },
        potionTask($item`corrupted marrow`),
        {
            name: "Swagger",
            completed: () => get("_bowleggedSwaggerUsed"),
            do: () => useSkill($skill`Bow-Legged Swagger`),
        },
        {
            name: "Songboom",
            completed: () => (SongBoom.song() === "These Fists Were Made for Punchin'"),
            do: () => (SongBoom.setSong("These Fists Were Made for Punchin'"))
        },
        {
            name: 'Twinkly Weapon',
            ready: () => availableAmount($item`twinkly nuggets`) > 0,
            completed: () => have($effect`Twinkly Weapon`),
            do: () => ensureEffect($effect`Twinkly Weapon`)
        },
        potionTask($item`pixel star`),
    ],
};

export default Weapon;