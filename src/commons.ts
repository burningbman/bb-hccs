import { Task } from "grimoire-kolmafia";
import { Skill, Effect, toSkill, toEffect, myMp, mpCost, useSkill, getProperty, effectModifier, Item, use, cliExecute, adv1, create, eat, handlingChoice, runChoice, Thrall, myThrall } from "kolmafia";
import { $effect, $effects, $familiar, $item, $location, $skill, BeachComb, get, have, set } from "libram";
import { CSStrategy, Macro } from "./combatMacros";
import { horsery, horse } from "./lib";
import { uniform } from "./outfit";

export function skillTask(x: Skill | Effect): Task {
    {
        const skill = x instanceof Skill ? x : toSkill(x);
        const effect = x instanceof Effect ? x : toEffect(x);
        return {
            name: skill.name,
            completed: () => have(effect),
            ready: () => myMp() >= mpCost(skill),
            do: () => useSkill(skill),
        };
    }
}

export function beachTask(effect: Effect): Task {
    const num = 1 + BeachComb.headBuffs.indexOf(effect);
    return {
        name: `Beach Head: ${effect}`,
        completed: () => getProperty("_beachHeadsUsed").split(",").includes(num.toFixed(0)),
        ready: () =>
            get("_freeBeachWalksUsed") < 11 &&
            get("beachHeadsUnlocked").split(",").includes(num.toFixed(0)),
        do: () => BeachComb.tryHead(effect),
        limit: { tries: 1 }
    };
}

export function potionTask(item: Item): Task {
    const effect = effectModifier(item, "Effect");
    return {
        name: `${effect}`,
        completed: () => have(effect),
        ready: () => have(item),
        do: () => use(item),
    };
}

export function songTask(song: Effect | Skill, shrugSong: Effect | Skill): Task {
    const { wantedSongSkill, wantedSongEffect } =
        song instanceof Effect
            ? { wantedSongSkill: toSkill(song), wantedSongEffect: song }
            : { wantedSongSkill: song, wantedSongEffect: toEffect(song) };
    const shrugSongEffect = shrugSong instanceof Effect ? shrugSong : toEffect(shrugSong);
    return {
        name: song.name,
        completed: () => have(wantedSongEffect),
        ready: () => myMp() >= mpCost(wantedSongSkill),
        do: (): void => {
            if (have(shrugSongEffect)) cliExecute(`shrug ${shrugSongEffect}`);
            useSkill(wantedSongSkill);
        },
        limit: { tries: 1 }
    };
}

export function thrallTask(thrall: Thrall): Task {
    return {
        name: thrall.toString(),
        completed: () => myThrall() === thrall,
        do: () => useSkill(thrall.skill),
    };
}

export function restore(effects: Effect[]): Task {
    return {
        name: "Restore",
        completed: () => effects.every((e) => have(e)),
        do: () => {
            if (!have($item`magical sausage`) && have($item`magical sausage casing`)) {
                create(1, $item`magical sausage`);
            }
            if (have($item`magical sausage`)) {
                eat(1, $item`magical sausage`);
            }
        },
        limit: {
            tries: 1
        }
    };
}

let showers = get("_meteorShowerUses");
export function meteorShower(): Task {
    return {
        name: "Meteor Showered",
        ready: () => get("_meteorShowerUses") < 5 && get("_saberForceUses") < 5,
        completed: () => have($effect`Meteor Showered`),
        prepare: () => horsery() === "pale" && horse("dark"),
        do: () => {
            adv1($location`The Dire Warren`, -1, "");
            if (handlingChoice()) runChoice(-1);
        },
        outfit: () =>
            uniform({
                changes: {
                    familiar: $familiar.none,
                    famequip: $item.none,
                    weapon: $item`Fourth of May Cosplay Saber`,
                },
            }),
        choices: { [1387]: 3 },
        combat: new CSStrategy(() =>
            Macro.skill($skill`Meteor Shower`).skill($skill`Use the Force`)
        ),
        post: () => {
            if (have($effect`Meteor Showered`)) showers++;
            set("_meteorShowerUses", showers);
        },
    };
}

export function doYouCrush(): Task {
    return {
        name: "Do You Crush What I Crush?",
        completed: () => have($effect`Do You Crush What I Crush?`),
        ready: () => !have($effect`Holiday Yoked`),
        do: $location`The Dire Warren`,
        outfit: () =>
            uniform({
                changes: { familiar: $familiar`Ghost of Crimbo Carols`, famequip: $item.none },
            }),
        prepare: () => horsery() === "pale" && horse("dark"),
        combat: new CSStrategy(() =>
            Macro.trySkill($skill`Feel Hatred`)
                .trySkill($skill`Snokebomb`)
                .abort()
        ),
    };
}

export function commonFamiliarWeightBuffs(): Task[] {
    const buffs = $effects`Empathy, Leash of Linguini, Blood Bond`;
    return [
        ...buffs.map(skillTask),
        restore(buffs),
        {
            name: "Fidoxene",
            completed: () => get("_freePillKeeperUsed"),
            do: () => cliExecute("pillkeeper familiar"),
        },
        // {
        //     name: "Suzie's Blessing",
        //     completed: () => get("_clanFortuneBuffUsed"),
        //     do: () => cliExecute("fortune buff familiar"),
        // },
        beachTask($effect`Do I Know You From Somewhere?`),
    ];
}

export function famPool(): Task {
    return {
        name: "Play Pool",
        ready: () => get('_poolGames') < 3,
        completed: () => have($effect`Billiards Belligerence`),
        do: () => cliExecute("pool 1"),
    };
}