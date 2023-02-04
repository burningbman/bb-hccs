import { Task } from "grimoire-kolmafia";
import { Skill, Effect, toSkill, toEffect, myMp, mpCost, useSkill, getProperty, effectModifier, Item, use, cliExecute } from "kolmafia";
import { BeachComb, get, have } from "libram";

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
    };
}