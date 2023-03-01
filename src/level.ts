import { CSStrategy, Macro } from "./combatMacros";
import { beachTask, famPool, thrallTask } from "./commons";
import { CSQuest } from "./engine";
import { synthExp } from "./lib";
import { levelUniform, uniform } from "./outfit";
import { OutfitSpec } from "grimoire-kolmafia";
import {
    buy,
    cliExecute,
    create,
    eat,
    myDaycount,
    myHp,
    myLevel,
    myMaxhp,
    myMaxmp,
    myMp,
    numericModifier,
    runChoice,
    runCombat,
    toEffect,
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
    $thrall,
    Cartography,
    get,
    have,
} from "libram";

const levellingComplete = myLevel() >= 13 && (get("_neverendingPartyFreeTurns") >= 10 || myDaycount() > 1);
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
            outfit: () => uniform({ changes: { offhand: $item`Abracandalabra` } }),
        }));


const lovePotion = $item`Love Potion #0`;
const loveEffect = $effect`Tainted Love Potion`;
const Level: CSQuest = {
    type: "MISC",
    name: "Level",
    completed: () => levellingComplete,
    tasks: [
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
            outfit: () => uniform({ changes: { offhand: $item`familiar scrapbook` } }),
            effects: $effects`Inscrutable Gaze, Thaumodynamic`,
            do: () => use(1, $item`a ten-percent bonus`),
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
        thrallTask($thrall`Spaghetti Elemental`),
        famPool(),
        {
            name: 'Eat sausage',
            ready: () => have($item`magical sausage casing`),
            do: () => eat($item`magical sausage`),
            completed: () => myMp() === myMaxmp() || myMp() >= 999,
            limit: { tries: 1 },
            outfit: () => uniform({
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
            outfit: () =>
                uniform({
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
            outfit: () => levelUniform({ changes: { acc3: $item`Lil' Doctor™ bag` } }),
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
            outfit: () => levelUniform({
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
            outfit: () => levelUniform(),
            combat: new CSStrategy(() => Macro.skill($skill`Portscan`).easyFight().attack().repeat()),
        },
        {
            name: "Oliver's Place: Use Portscan",
            ready: () => get("_speakeasyFreeFights") === 2,
            completed: () => have($item`government cheese`),
            do: $location`An Unusually Quiet Barroom Brawl`,
            outfit: () =>
                levelUniform({
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
            name: "God Lobster",
            completed: () => get("_godLobsterFights") >= 2,
            ready: () => get("_godLobsterFights") < 3,
            do: (): void => {
                visitUrl("main.php?fightgodlobster=1");
                runCombat();
                visitUrl("choice.php");
                runChoice(-1);
            },
            outfit: (): OutfitSpec => {
                const gear =
                    $items`God Lobster's Crown, God Lobster's Robe, God Lobster's Rod, God Lobster's Ring, God Lobster's Scepter`.find(
                        (it) => have(it)
                    ) ?? $item`tiny stillsuit`;
                return levelUniform({ changes: { familiar: $familiar`God Lobster`, famequip: gear } });
            },
            choices: {
                // Stats
                [1310]: () => 1,
            },
            combat: new CSStrategy(),
        },
        {
            name: "Regular NEP",
            completed: () => get("_neverendingPartyFreeTurns") >= 10,
            do: $location`The Neverending Party`,
            outfit: levelUniform({
                changes: {
                    offhand: $item`Kramco Sausage-o-Matic™`
                }
            }),
            combat: new CSStrategy(() =>
                Macro.externalIf(
                    get("_neverendingPartyFreeTurns") > 1, // make sure bowling sideways before feel pride
                    Macro.trySkill($skill`Feel Pride`)
                ).default(true)
            ),
            choices: { [1324]: 5 },
        },
        {
            name: "Freekill NEP",
            completed: () =>
                get("_shatteringPunchUsed") >= 3 &&
                get("_gingerbreadMobHitUsed") &&
                have($effect`Everything Looks Yellow`) &&
                get("_chestXRayUsed") >= 3,
            do: $location`The Neverending Party`,
            outfit: (): OutfitSpec => {
                foldshirt();
                const killSource = !have($effect`Everything Looks Yellow`)
                    ? { shirt: $item`Jurassic Parka`, modes: { parka: "dilophosaur" as const } }
                    : get("_chestXRayUsed") < 3
                        ? { acc3: $item`Lil' Doctor™ bag` }
                        : {};
                const changes = {
                    ...killSource,
                };
                return levelUniform({ changes });
            },
            combat: new CSStrategy(() =>
                Macro.if_($monster`sausage goblin`, Macro.default())
                    .trySkill($skill`Spit jurassic acid`)
                    .trySkill($skill`Chest X-Ray`)
                    .trySkill($skill`Shattering Punch`)
                    .trySkill($skill`Gingerbread Mob Hit`)
                    .abort()
            ),
            choices: { [1324]: 5 },
        },
    ],
};

export default Level;