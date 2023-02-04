import { OutfitSpec } from "grimoire-kolmafia";
import { Familiar, Item } from "kolmafia";
import {
    $effect,
    $familiar,
    $item,
    $items,
    CommunityService,
    DaylightShavings,
    get,
    have,
} from "libram";

const DEFAULT_UNIFORM = (): OutfitSpec => ({
    hat: DaylightShavings.buffAvailable()
        ? DaylightShavings.helmet
        : $items`astral chapeau, Iunion Crown`,
    shirt: $items`Jurassic Parka, fresh coat of paint`,
    pants: $items`designer sweatpants, old sweatpants`,
    weapon:
        get("_juneCleaverFightsLeft") > 0 && get("_juneCleaverEncounters") < 2
            ? $item`June cleaver`
            : $item`Fourth of May Cosplay Saber`,
    offhand: $item`unbreakable umbrella`,
    acc3: $items`Powerful Glove`,
    back: $items`unwrapped knock-off retro superhero cape`,
    modes: {
        retrocape: ["heck", "thrill"],
        umbrella: "broken",
    },
});

const FAMILIAR_PICKS = [
    {
        familiar: $familiar`Melodramedary`,
        famequip: $item`dromedary drinking helmet`,
        condition: () => get("camelSpit") < 100 && !have($effect`Spit Upon`),
    },
    {
        familiar: $familiar`Shorter-Order Cook`,
        condition: () =>
            ![$effect`Shortly Stacked`, $item`short stack of pancakes`].some((x) => have(x)) &&
            !CommunityService.FamiliarWeight.isDone(),
    },
];

function chooseFamiliar(canAttack: boolean): { familiar: Familiar; famequip: Item } {
    const pick = FAMILIAR_PICKS.find(
        ({ condition, familiar }) =>
            condition() &&
            have(familiar) &&
            (canAttack || !(familiar.elementalDamage || familiar.physicalDamage))
    );
    if (pick) {
        return { famequip: pick.famequip ?? $item`tiny stillsuit`, familiar: pick.familiar };
    }
    return { famequip: $item`tiny stillsuit`, familiar: $familiar`Artistic Goth Kid` };
}

type UniformOptions = { changes: OutfitSpec; canAttack: boolean };
const DEFAULT_OPTIONS = { changes: {} as OutfitSpec, canAttack: true };
export default function uniform(options: Partial<UniformOptions> = {}): OutfitSpec {
    const { changes, canAttack } = { ...DEFAULT_OPTIONS, ...options };
    if ("familiar" in changes && !("famequip" in changes)) changes.famequip = $item`tiny stillsuit`;
    return { ...DEFAULT_UNIFORM(), ...chooseFamiliar(canAttack), ...changes };
}