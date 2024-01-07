import { chooseQuest, chooseRift, rufusTarget } from "libram/dist/resources/2023/ClosedCircuitPayphone";
import { CSStrategy, Macro } from "./combatMacros";
import { beachTask, famPool } from "./commons";
import { CSQuest } from "./engine";
import { synthExp } from "./lib";
import { levelUniform, uniform } from "./outfit";
import { CombatStrategy } from "grimoire-kolmafia";
import {
    Item,
    Location,
    buy,
    cliExecute,
    create,
    eat,
    equip,
    getMonsters,
    itemDrops,
    mallPrice,
    myDaycount,
    myHp,
    myLevel,
    myMaxhp,
    myMaxmp,
    myMp,
    numericModifier,
    restoreHp,
    restoreMp,
    runChoice,
    runCombat,
    toEffect,
    toItem,
    use,
    useSkill,
    visitUrl,
} from "kolmafia";
import {
    $effect,
    $effects,
    $familiar,
    $item,
    $items,
    $location,
    $monster,
    $skill,
    $skills,
    $slot,
    Cartography,
    clamp,
    get,
    have,
    sum,
    withChoice,
} from "libram";

let _bestShadowRift: Location | null = null;
export function bestShadowRift(): Location {
    if (!_bestShadowRift) {
        _bestShadowRift =
            chooseRift({
                canAdventure: true,
                sortBy: (l: Location) => {
                    const drops = getMonsters(l)
                        .map((m) =>
                            [
                                ...Object.keys(itemDrops(m)).map((s) => toItem(s)),
                                m === $monster`shadow guy` && have($skill`Just the Facts`)
                                    ? $item`pocket wish`
                                    : $item.none,
                            ].filter((i) => i !== $item.none)
                        )
                        .reduce((acc, val) => acc.concat(val), []);
                    return sum(drops, mallPrice);
                },
            }) ?? $location.none;
        if (_bestShadowRift === $location.none && have($item`closed-circuit pay phone`)) {
            throw new Error("Failed to find a suitable Shadow Rift to adventure in");
        }
    }
    return _bestShadowRift;
}

const levellingComplete = myLevel() >= 15 && (get("_neverendingPartyFreeTurns") >= 10 || myDaycount() > 1);
let lovePotionConsidered = false;

const foldshirt = (): void => {
    if (!have($item`makeshift garbage shirt`)) cliExecute("fold makeshift garbage shirt");
};

const CastSkills =
    $skills`Prevent Scurvy and Sobriety, Advanced Saucecrafting, Stevedave's Shanty of Superiority, Fat Leon's Phat Loot Lyric, The Polka of Plenty, Leash of Linguini, Empathy of the Newt, Blood Bond, Blood Bubble, Song of Bravado, Get Big, Feel Excitement, Drescher's Annoying Noise, Elemental Saucesphere, Pride of the Puffin, Ur-Kel's Aria of Annoyance, Singer's Faithful Ocelot`
        .map((s) => ({
            name: s.name,
            do: (): void => {
                useSkill(s);
            },
            completed: () => (s.buff ? have(toEffect(s)) : s.timescast > 0),
            limit: { tries: 1 }
        }))
        .map((task) => ({
            ...task,
            // outfit: () => uniform({ changes: { offhand: $item`Abracandalabra` } }),
        }));


const lovePotion = $item`Love Potion #XYZ`;
const loveEffect = $effect`Tainted Love Potion`;
const Level: CSQuest = {
    type: "MISC",
    name: "Level",
    completed: () => levellingComplete,
    tasks: [
        {
            name: "Flaming Leaflets",
            prepare: (): void => {
                restoreHp(clamp(1000, myMaxhp() / 2, myMaxhp()));
                if (have($item`Lil' Doctor™ bag`) && get("_otoscopeUsed") < 3)
                    equip($slot`acc3`, $item`Lil' Doctor™ bag`);
                restoreMp(50);
            },
            completed: () =>
                get("_leafMonstersFought", 0) >= 5 ||
                !have($item`inflammable leaf`, 11) ||
                get("instant_saveLeafFights", false),
            do: (): void => {
                visitUrl("campground.php?preaction=leaves");
                visitUrl("choice.php?pwd&whichchoice=1510&option=1&leaves=11");
            },
            combat: new CombatStrategy().macro(Macro.trySkill($skill`Otoscope`).default()),
            outfit: uniform({
                changes: { modifier: "Item Drop, -equip tinsel tights, -equip wad of used tape, -equip kramco" }
            }),
            limit: { tries: 5 },
        },
        {
            name: "Maintain HP",
            ready: () => myHp() < 0.8 * myMaxhp(),
            completed: () => myHp() > 0.8 * myMaxhp(),
            do: (): void => {
                if (get('_hotTubSoaks') < 5)
                    cliExecute("hottub");
                else
                    useSkill($skill`Cannelloni Cocoon`);
            }
        },
        {
            name: "That's Just Cloud Talk, Man",
            completed: () => !!get("_campAwayCloudBuffs"),
            do: () => visitUrl("place.php?whichplace=campaway&action=campaway_sky"),
        },
        {
            name: "Synth: Learning",
            completed: () => have($effect`Synthesis: Learning`),
            do: synthExp,
        },
        {
            name: "Ten-Percent Bonus",
            completed: () => !have($item`a ten-percent bonus`),
            outfit: uniform({ changes: { offhand: $item`familiar scrapbook` } }),
            effects: $effects`Inscrutable Gaze, Thaumodynamic`,
            do: () => use(1, $item`a ten-percent bonus`),
        }, {
            name: 'Nellyville',
            completed: () => have(toEffect('Hot in Herre')),
            do: () => use(toItem(`Charter: Nellyville`))
        },
        {
            name: "Bastille",
            completed: () => get("_bastilleGames") > 0,
            do: () => cliExecute("bastille myst brutalist"),
        },
        {
            name: "Get Love Potion",
            completed: () => $skill`Love Mixology`.timescast > 0,
            do: () => useSkill(1, $skill`Love Mixology`),
            limit: { tries: 1 }
        },
        {
            name: "Consider Love Potion",
            completed: () => lovePotionConsidered,
            do: (): void => {
                visitUrl(`desc_effect.php?whicheffect=${loveEffect.descid}`);
                lovePotionConsidered = true;

                if (
                    numericModifier(loveEffect, "mysticality") > 10 &&
                    numericModifier(loveEffect, "muscle") > -30 &&
                    numericModifier(loveEffect, "moxie") > -30 &&
                    numericModifier(loveEffect, "maximum hp percent") > -0.001
                ) {
                    use(1, lovePotion);
                }
            },
        },
        {
            name: "Favourite Bird",
            completed: () => get("_favoriteBirdVisited"),
            ready: () =>
                get("yourFavoriteBirdMods")
                    .split(",")
                    .some((mod) => mod.includes("Mysticality Percent: +")),
            do: () => useSkill($skill`Visit your Favorite Bird`),
        },
        {
            name: "Boxing Daybuff",
            completed: () => get("_daycareSpa"),
            do: () => cliExecute("daycare mysticality"),
        },
        {
            name: "Smile of Lyle",
            completed: () => get("_lyleFavored"),
            do: () => cliExecute("monorail buff"),
        },
        {
            name: "Telescope",
            completed: () => get("telescopeLookedHigh"),
            do: () => cliExecute("telescope look high"),
        },
        {
            name: "Glittering Eyelashes",
            completed: () => have($effect`Glittering Eyelashes`),
            do: (): void => {
                const mascara = $item`glittery mascara`;
                if (!have(mascara)) buy(1, mascara);
                use(1, mascara);
            },
        },
        {
            name: "Triple-Sized",
            completed: () => have($effect`Triple-Sized`),
            do: () => useSkill($skill`CHEAT CODE: Triple Size`, 1),
            outfit: { acc3: $item`Powerful Glove` },
        },
        {
            name: "Misc Items",
            completed: () =>
                $items`votive of confidence, natural magick candle, MayDay™ supply package`.every(
                    (i) => !have(i)
                ),
            do: () =>
                $items`votive of confidence, natural magick candle, MayDay™ supply package`.forEach(
                    (i) => have(i) && use(i)
                ),
        },
        {
            // not strictly necessary
            name: "Acquire Casting Items",
            completed: () => $items`turtle totem, saucepan`.every((i) => have(i)),
            do: () =>
                $items`turtle totem, saucepan`.forEach(
                    (i) => !have(i) && cliExecute(`acquire ${i}`)
                ),
        },
        {
            name: "Lapdog",
            completed: () => get("_olympicSwimmingPool"),
            do: () => cliExecute("swim ml"),
        },
        {
            name: 'Fold Shirt',
            do: foldshirt,
            completed: () => have($item`makeshift garbage shirt`)
        },
        famPool(),
        {
            name: 'Eat sausage',
            ready: () => have($item`magical sausage casing`),
            do: () => eat($item`magical sausage`),
            completed: () => myMp() === myMaxmp() || myMp() >= 999,
            limit: { tries: 1 },
            outfit: uniform({
                changes: {
                    modifier: 'Maximum MP'
                }
            })
        },
        beachTask($effect`You Learned Something Maybe!`),
        beachTask($effect`We're All Made of Starfish`),
        ...CastSkills,
        {
            name: "Make & Use Ointment",
            completed: () => have($effect`Mystically Oiled`),
            ready: () => have($item`grapefruit`),
            do: (): void => {
                if (!have($item`ointment of the occult`)) {
                    create(1, $item`ointment of the occult`);
                }
                if (have($item`ointment of the occult`)) {
                    use(1, $item`ointment of the occult`);
                }
            },
            limit: { tries: 1 }
        },
        {
            name: "Holiday Yoked",
            completed: () => have($effect`Holiday Yoked`),
            do: $location`Noob Cave`,
            ready: () => (Boolean(!$effects`Holiday Yoked, Do You Crush What I Crush?, Let It Snow/Boil/Stink/Frighten/Grease, All I Want For Crimbo Is Stuff, Crimbo Wrapping`.find((eff) => have(eff)))),
            outfit: uniform({
                changes: {
                    familiar: $familiar`Ghost of Crimbo Carols`,
                    famequip: $item.none,
                    avoid: $items`Kramco Sausage-o-Matic™`,
                    acc3: $item`Lil' Doctor™ bag`
                },
            }),
            combat: new CSStrategy(() =>
                Macro.skill($skill`Giant Growth`)
                    .skill($skill`Reflex Hammer`)
            ),
            limit: { tries: 1 }
        },
        {
            name: "Map Ninja",
            completed: () => have($item`li'l ninja costume`),
            do: (): void => {
                Cartography.mapMonster($location`The Haiku Dungeon`, $monster`amateur ninja`);
            },
            combat: new CSStrategy(() =>
                Macro.if_($monster`amateur ninja`, Macro.skill($skill`Chest X-Ray`)).abort()
            ),
            outfit: levelUniform({ changes: { acc3: $item`Lil' Doctor™ bag` } }),
        },
        {
            name: "NEP Quest",
            completed: () => get("_questPartyFair") !== "unstarted",
            do: (): void => {
                visitUrl("adventure.php?snarfblat=528");
                const choice = ["food", "booze"].includes(get("_questPartyFairQuest")) ? 1 : 2;
                runChoice(choice);
            },
        },
        {
            name: "Oliver's Place: First free fight",
            completed: () => get("_speakeasyFreeFights") > 0,
            ready: () => get("_speakeasyFreeFights") === 0,
            do: $location`An Unusually Quiet Barroom Brawl`,
            combat: new CSStrategy(() => Macro.skill($skill`Launch spikolodon spikes`).easyFight().attack().repeat()),
            outfit: levelUniform({
                changes: {
                    shirt: $item`Jurassic Parka`,
                    modes: {
                        parka: 'spikolodon'
                    }
                }
            })
        },
        {
            name: "NEP Myst boost",
            ready: () => get('_spikolodonSpikeUses') === 1,
            completed: () => have($effect`Tomes of Opportunity`),
            do: $location`The Neverending Party`,
            choices: { 1324: 1, 1325: 2 },
            limit: { tries: 1 }
        },
        {
            name: "Oliver's Place: Prime Portscan",
            completed: () => get("_speakeasyFreeFights") > 1,
            ready: () => get("_speakeasyFreeFights") === 1,
            do: $location`An Unusually Quiet Barroom Brawl`,
            outfit: levelUniform(),
            combat: new CSStrategy(() => Macro.skill($skill`Portscan`).easyFight().attack().repeat()),
        },
        {
            name: "Oliver's Place: Use Portscan",
            ready: () => get("_speakeasyFreeFights") === 2,
            completed: () => have($item`government cheese`),
            do: $location`An Unusually Quiet Barroom Brawl`,
            outfit: levelUniform({
                changes: { back: $item`vampyric cloake`, acc3: $item`Lil' Doctor™ bag` },
            }),
            combat: new CSStrategy(() =>
                Macro.skill($skill`Become a Bat`)
                    .skill($skill`Otoscope`)
                    .kill()
            ),
            limit: { tries: 1 }
        },
        {
            name: "Get Rufus Quest",
            completed: () => get("_shadowAffinityToday") || !have($item`closed-circuit pay phone`),
            do: () => chooseQuest(() => 2),
            limit: { tries: 1 },
        },
        {
            name: "Shadow Rift",
            completed: () =>
                have($item`Rufus's shadow lodestone`) ||
                (!have($effect`Shadow Affinity`) && get("encountersUntilSRChoice") !== 0) ||
                !have($item`closed-circuit pay phone`),
            do: bestShadowRift(),
            combat: new CombatStrategy().macro(
                Macro.trySkill($skill`Recall Facts: %phylum Circadian Rhythms`)
                    .default()
            ),
            outfit: () => levelUniform(),
            post: (): void => {
                if (have(rufusTarget() as Item)) {
                    withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
                }
            },
            limit: { tries: 12 },
        },
        {
            name: "God Lobster",
            completed: () => get("_godLobsterFights") >= 2,
            ready: () => get("_godLobsterFights") < 3,
            do: (): void => {
                visitUrl("main.php?fightgodlobster=1");
                runCombat();
                visitUrl("choice.php");
                runChoice(-1);
            },
            outfit: () => {
                return levelUniform({
                    changes: {
                        familiar: $familiar`God Lobster`, famequip: $items`God Lobster's Crown, God Lobster's Robe, God Lobster's Rod, God Lobster's Ring, God Lobster's Scepter`.find(
                            (it) => have(it)
                        ) ?? $item`tiny stillsuit`
                    }
                });
            },
            choices: {
                // Stats
                [1310]: 1,
            },
            combat: new CSStrategy(),
        },
        {
            name: "Regular NEP",
            completed: () => get("_neverendingPartyFreeTurns") >= 10,
            do: $location`The Neverending Party`,
            outfit: () => {
                return levelUniform({
                    changes: {
                        offhand: $item`Kramco Sausage-o-Matic™`
                    }
                });
            },
            combat: new CSStrategy(() =>
                Macro.externalIf(
                    get("_neverendingPartyFreeTurns") > 1, // make sure bowling sideways before feel pride
                    Macro.trySkill($skill`Feel Pride`)
                ).default(true)
            ),
            choices: { [1324]: 5 },
        }
    ],
};

export default Level;