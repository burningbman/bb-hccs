import { OutfitSpec } from "grimoire-kolmafia";
import { availableAmount, canAdventure, cliExecute, create, knollAvailable, use, visitUrl } from "kolmafia";
import { $effect, $familiar, $item, $items, $location, $skill, CommunityService, get, have, SourceTerminal } from "libram";
import { CSStrategy, Macro } from "./combatMacros";
import { songTask, skillTask, potionTask } from "./commons";
import { CSQuest } from "./engine";
import { ensureItem, synthItem } from "./lib";
import { uniform } from "./outfit";

const MODIFIERS = ['item drop', 'booze drop'];

const ItemDrop: CSQuest = {
    name: "Booze Drop",
    type: "SERVICE",
    test: CommunityService.BoozeDrop,
    turnsSpent: 0,
    maxTurns: 1,
    modifiers: MODIFIERS,
    tasks: [{
        name: "Bowling Ball & Batform",
        ready: () => !get('_latteBanishUsed'),
        completed: () => have($effect`Bat-Adjacent Form`),
        do: $location`The Dire Warren`,
        outfit: () =>
            uniform({
                changes: {
                    back: $item`vampyric cloake`,
                    offhand: $item`latte lovers member's mug`,
                },
                canAttack: false,
            }),
        combat: new CSStrategy(() =>
            Macro.skill($skill`Bowl Straight Up`).skill($skill`Become a Bat`).skill($skill`Throw Latte on Opponent`)
        ),
    },
    songTask($effect`Fat Leon's Phat Loot Lyric`, $effect`Ode to Booze`),
    skillTask($skill`The Spirit of Taking`),
    skillTask($skill`Singer's Faithful Ocelot`),
    ...$items`Salsa Caliente™ candle, lavender candy heart, bag of grain, emergency glowstick, autumn leaf`.map(
        potionTask
    ),
    {
        name: "Items.enh",
        completed: () => have($effect`items.enh`),
        do: () => SourceTerminal.enhance($effect`items.enh`),
    },
    {
        name: "Play Pool",
        completed: () => have($effect`Hustlin'`) || get('_poolGames') === 3,
        do: () => cliExecute("pool 3"),
    },
    {
        name: "Unlock Beach",
        ready: () => have($item`government cheese`),
        completed: () => canAdventure($location`South of the Border`),
        do: (): void => {
            const desertAccessItem = knollAvailable()
                ? $item`bitchin' meatcar`
                : $item`Desert Bus pass`;
            if (!have(desertAccessItem)) {
                cliExecute(`acquire ${desertAccessItem.name}`);
            }
        },
    },
    {
        name: "Get Anticheese",
        ready: () => canAdventure($location`South of the Border`),
        completed: () => get("lastAnticheeseDay") > 0,
        do: () => visitUrl("place.php?whichplace=desertbeach&action=db_nukehouse"),
    },
    {
        name: "Government",
        ready: () => have($item`anticheese`) && have($item`government cheese`),
        completed: () => have($effect`I See Everything Thrice!`),
        do: () => create(1, $item`government`) && use(1, $item`government`),
    },
    {
        name: 'Get Sparkler',
        ready: () => !get('_fireworksShopEquipmentBought'),
        completed: () => availableAmount($item`oversized sparkler`) > 0,
        do: () => ensureItem(1, $item`oversized sparkler`)
    }, {
        name: 'Fortune Buff',
        completed: () => get("_clanFortuneBuffUsed"),
        do: () => cliExecute("fortune buff item")
    },
    {
        name: 'Synth Item',
        completed: () => have($effect`Synthesis: Collection`),
        do: () => synthItem()
    },
    skillTask($skill`Feel Lost`),
    skillTask($skill`Steely-Eyed Squint`)
    ],
    outfit: (): OutfitSpec => {
        if (!have($item`wad of used tape`)) cliExecute("fold wad of used tape");
        return {
            modifier: MODIFIERS.join(','),
            familiar: $familiar`Trick-or-Treating Tot`,
            avoid: $items`broken champagne bottle`
        };
    }
};

export default ItemDrop;