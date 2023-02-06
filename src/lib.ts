import {
  abort,
  adv1,
  availableAmount,
  buy,
  buyUsingStorage,
  choiceFollowsFight,
  cliExecute,
  cliExecuteOutput,
  create,
  eat,
  Effect,
  equip,
  equippedAmount,
  equippedItem,
  familiarWeight,
  getProperty,
  haveEffect,
  inMultiFight,
  Item,
  Location,
  Monster,
  myFamiliar,
  myMaxmp,
  myMp,
  print,
  pullsRemaining,
  restoreMp,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
  setProperty,
  shopAmount,
  Skill,
  Slot,
  storageAmount,
  sweetSynthesis,
  takeShop,
  toEffect,
  toInt,
  toString as toStringAsh,
  totalTurnsPlayed,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $location,
  $skill,
  $slot,
  ensureEffect,
  get,
  have,
  Macro,
  set,
} from "libram";

const FUDGE = $item`Crimbo fudge`;
const PECAN = $item`Crimbo candied pecan`;
const BARK = $item`Crimbo peppermint bark`;
const SUGAR_SHOTGUN = $item`sugar shotgun`;
const SUGAR_SHANK = $item`sugar shank`;
const SUGAR_SHORTS = $item`sugar shorts`;
const SUGAR_SHIRT = $item`sugar shirt`;

export function getPropertyInt(name: string): number {
  const str = getProperty(name);
  if (str === "") {
    throw `Unknown property ${name}.`;
  }
  return toInt(str);
}

export function incrementProperty(name: string): void {
  set(name, getPropertyInt(name) + 1);
}

export function setChoice(adv: number, choice: number): void {
  setProperty(`choiceAdventure${adv}`, `${choice}`);
}

export function myFamiliarWeight(): number {
  return familiarWeight(myFamiliar()) + weightAdjustment();
}

export function ensureItem(quantity: number, it: Item): void {
  if (availableAmount(it) < quantity) {
    buy(quantity - availableAmount(it), it);
  }
  if (availableAmount(it) < quantity) {
    throw `Could not buy ${quantity} of item ${it.name}: only ${availableAmount(
      it
    )}.`;
  }
}

export function ensureCreateItem(quantity: number, it: Item): void {
  if (availableAmount(it) < quantity) {
    create(quantity - availableAmount(it), it);
  }
  if (availableAmount(it) < quantity) {
    throw "Could not create item.";
  }
}

export function ensureSewerItem(quantity: number, it: Item): void {
  while (availableAmount(it) < quantity) {
    ensureItem(1, $item`chewing gum on a string`);
    use(1, $item`chewing gum on a string`);
  }
}

export function ensureHermitItem(quantity: number, it: Item): void {
  if (availableAmount(it) >= quantity) {
    return;
  }
  const count = quantity - availableAmount(it);
  while (
    availableAmount($item`worthless trinket`) +
    availableAmount($item`worthless gewgaw`) +
    availableAmount($item`worthless knick-knack`) <
    count
  ) {
    ensureItem(1, $item`chewing gum on a string`);
    use(1, $item`chewing gum on a string`);
  }
  ensureItem(1, $item`hermit permit`);
  retrieveItem(count, it);
}

export function ensureNpcEffect(
  ef: Effect,
  quantity: number,
  potion: Item
): void {
  if (haveEffect(ef) === 0) {
    ensureItem(quantity, potion);
    if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
      throw `Failed to get effect ${ef.name}`;
    }
  } else {
    print(`Already have effect ${ef.name}.`);
  }
}

export function ensurePotionEffect(ef: Effect, potion: Item): void {
  if (haveEffect(ef) === 0) {
    if (availableAmount(potion) === 0) {
      create(1, potion);
    }
    if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
      throw `Failed to get effect ${ef.name}.`;
    }
  } else {
    print(`Already have effect ${ef.name}.`);
  }
}

export function sausageFightGuaranteed(): boolean {
  const goblinsFought = getPropertyInt("_sausageFights");
  const nextGuaranteed =
    getPropertyInt("_lastSausageMonsterTurn") +
    4 +
    goblinsFought * 3 +
    Math.max(0, goblinsFought - 5) ** 3;
  return goblinsFought === 0 || totalTurnsPlayed() >= nextGuaranteed;
}

export function tryUse(quantity: number, it: Item): boolean {
  if (availableAmount(it) > 0) {
    return use(quantity, it);
  } else {
    return false;
  }
}

export function tryEquip(it: Item): boolean {
  if (availableAmount(it) > 0) {
    return equip(it);
  } else {
    return false;
  }
}

export function wishEffect(ef: Effect): void {
  if (haveEffect(ef) === 0) {
    cliExecute(`genie effect ${ef.name}`);
  } else {
    print(`Already have effect ${ef.name}.`);
  }
}

export function pullIfPossible(
  quantity: number,
  it: Item,
  maxPrice: number
): boolean {
  if (pullsRemaining() > 0) {
    const quantityPull = Math.max(0, quantity - availableAmount(it));
    if (shopAmount(it) > 0) {
      takeShop(Math.min(shopAmount(it), quantityPull), it);
    }
    if (storageAmount(it) < quantityPull) {
      buyUsingStorage(quantityPull - storageAmount(it), it, maxPrice);
    }
    cliExecute(`pull ${quantityPull} ${it.name}`);
    return true;
  } else return false;
}

export function ensurePullEffect(ef: Effect, it: Item): void {
  if (haveEffect(ef) === 0) {
    if (availableAmount(it) > 0 || pullIfPossible(1, it, 50000))
      ensureEffect(ef);
  }
}

export function shrug(ef: Effect): void {
  if (haveEffect(ef) > 0) {
    cliExecute(`shrug ${ef.name}`);
  }
}

// We have Stevedave's, Ur-Kel's on at all times during leveling (managed via mood); third and fourth slots are variable.
const songSlots = [
  $effects`Stevedave's Shanty of Superiority`,
  $effects`Ur-Kel's Aria of Annoyance`,
  $effects`Power Ballad of the Arrowsmith, The Magical Mojomuscular Melody, The Moxious Madrigal, Ode to Booze, Jackasses' Symphony of Destruction`,
  $effects`Carlweather's Cantata of Confrontation, The Sonata of Sneakiness, Fat Leon's Phat Loot Lyric, Polka of Plenty`,
];
const allKnownSongs = ([] as Effect[]).concat(...songSlots);
const allSongs = Skill.all()
  .filter(
    (skill) =>
      toStringAsh(skill.class as unknown as string) === "Accordion Thief" &&
      skill.buff
  )
  .map((skill) => toEffect(skill));
export function openSongSlot(song: Effect): void {
  for (const songSlot of songSlots) {
    if (songSlot.includes(song)) {
      for (const shruggable of songSlot) {
        shrug(shruggable);
      }
    }
  }
  for (const badSong of allSongs) {
    if (!allKnownSongs.includes(badSong)) {
      shrug(badSong);
    }
  }
}

export function ensureSong(ef: Effect): void {
  if (haveEffect(ef) === 0) {
    openSongSlot(ef);
    if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
      throw `Failed to get effect ${ef.name}`;
    }
  } else {
    print(`Already have effect ${ef.name}.`);
  }
}

export function withMacro<T>(macro: Macro, action: () => T): T {
  macro.save();
  try {
    return action();
  } finally {
    Macro.clearSaved();
  }
}

export function adventureWithCarolGhost(effect: Effect, macro?: Macro): void {
  if (haveEffect($effect`Feeling Lost`))
    abort("Attempting to Carol Ghost while feeling lost");

  if (
    have($effect`Holiday Yoked`) ||
    have($effect`Do You Crush What I Crush?`) ||
    have(
      $effect`Let It Snow/Boil/Stink/Frighten/Grease` ||
      have($effect`Crimbo Wrapping`)
    )
  ) {
    // allow carol ghosting again if getting same effect and have a custom macro
    if (!have(effect) || !macro) {
      abort("Attempting to Carol Ghost with previous effect active.");
    }
  }

  const offHand = equippedItem($slot`off-hand`);
  let location = $location`Noob Cave`;
  equip($item`familiar scrapbook`); // ensure no kramco

  switch (effect) {
    case $effect`Holiday Yoked`:
      break;
    case $effect`Do You Crush What I Crush?`:
      if (sausageFightGuaranteed()) {
        equip($item`Kramco Sausage-o-Matic™`);
      } else {
        location = $location`The Dire Warren`;
      }
      break;
    case $effect`Let It Snow/Boil/Stink/Frighten/Grease`:
      location = $location`The Haunted Kitchen`;
      break;
  }

  if (get("_reflexHammerUsed") >= 3 && get("_chestXRayUsed") >= 3 && !macro) {
    throw "No free-kill for Carol Ghost!";
  }

  useFamiliar($familiar`Ghost of Crimbo Carols`);
  equip($slot`acc3`, $item`Lil' Doctor™ bag`);

  if (macro) {
    macro.setAutoAttack();
  } else {
    Macro.trySkill($skill`Reflex Hammer`)
      .skill($skill`Chest X-Ray`)
      .setAutoAttack();
  }

  adv1(location);
  setAutoAttack(0);

  equip(offHand);

  // hit an NC or something, try again
  if (!haveEffect(effect)) {
    throw `Didn't get ${effect} while using Carol Ghost.`;
  }
}

export function synthExp(): void {
  if (have($effect`Synthesis: Learning`)) {
    return;
  }
  if (availableAmount(FUDGE) >= 2) {
    sweetSynthesis(FUDGE, FUDGE);
  } else if (have(PECAN)) {
    if (have(BARK)) {
      sweetSynthesis(PECAN, BARK);
    } else {
      create(1, SUGAR_SHOTGUN);
      sweetSynthesis(PECAN, SUGAR_SHOTGUN);
    }
  } else if (have(BARK)) {
    create(1, SUGAR_SHANK);
    sweetSynthesis(BARK, SUGAR_SHANK);
  }
  if (!have($effect`Synthesis: Learning`)) {
    throw "Couldn't get Synthesis: Learning";
  }
}

export function synthItem(): void {
  if (have($effect`Synthesis: Collection`)) {
    return;
  }
  if (availableAmount(BARK) >= 2) {
    sweetSynthesis(BARK, BARK);
  } else if (have(BARK)) {
    create(1, SUGAR_SHOTGUN);
    sweetSynthesis(BARK, SUGAR_SHOTGUN);
  } else if (have(FUDGE)) {
    create(1, SUGAR_SHORTS);
    sweetSynthesis(FUDGE, SUGAR_SHORTS);
  } else if (have(PECAN)) {
    create(1, SUGAR_SHIRT);
    sweetSynthesis(PECAN, SUGAR_SHIRT);
  }
  if (!have($effect`Synthesis: Collection`)) {
    throw "Couldn't get Synthesis: Collection";
  }
}

export function multiFightAutoAttack(): void {
  while (choiceFollowsFight() || inMultiFight()) {
    visitUrl("choice.php");
  }
}

export function useBestFamiliar(): void {
  if (get("camelSpit") !== 100) {
    useFamiliar($familiar`Melodramedary`);
    equip($slot`familiar`, $item`dromedary drinking helmet`);
  } else if (get("_hipsterAdv") < 7) {
    useFamiliar($familiar`Artistic Goth Kid`);
  } else if (!have($item`short stack of pancakes`)) {
    useFamiliar($familiar`Shorter-Order Cook`);
  } else {
    useFamiliar($familiar`Shorter-Order Cook`);
  }
}

export function mapMacro(
  location: Location,
  monster: Monster,
  macro: Macro
): void {
  macro.setAutoAttack();
  useSkill($skill`Map the Monsters`);
  if (!get("mappingMonsters"))
    throw `I am not actually mapping anything. Weird!`;
  else {
    while (get("mappingMonsters")) {
      visitUrl(toUrl(location));
      runChoice(1, `heyscriptswhatsupwinkwink=${monster.id}`);
      runCombat(macro.toString());
    }
  }
}

export function voterMonsterNow(): boolean {
  return (
    totalTurnsPlayed() % 11 === 1 &&
    get("lastVoteMonsterTurn") < totalTurnsPlayed()
  );
}

function replaceAll(str: string, searchValue: string, replaceValue: string): string {
  const newStr = str.replace(searchValue, replaceValue);
  if (newStr === str) return newStr;
  return replaceAll(newStr, searchValue, replaceValue);
}

export function printModtrace(modifiers: string | string[], baseModifier?: string): void {
  if (typeof modifiers === "string") {
    return printModtrace([modifiers], modifiers);
  } else {
    if (!baseModifier) {
      const baseModifiers = new Map(
        modifiers.map((key) => {
          return [key, 1];
        })
      );

      modifiers.forEach((keyThis) => {
        for (const keyNext of modifiers) {
          if (keyThis === keyNext) continue;
          if (keyThis.includes(keyNext)) {
            baseModifiers.set(keyThis, 0);
            break;
          }
        }
      });

      modifiers.forEach((keyThis) => {
        if (baseModifiers.get(keyThis) ?? 0 !== 0) {
          const modifiersSubset = [keyThis];

          for (const keyNext of modifiers) {
            if (keyThis === keyNext) continue;
            if (keyNext.includes(keyThis)) modifiersSubset.push(keyNext);
          }

          printModtrace(modifiersSubset, keyThis);
        }
      });
    } else {
      let htmlOutput = cliExecuteOutput(`modtrace ${baseModifier}`);
      let htmlHeader = htmlOutput.substring(
        htmlOutput.indexOf("<tr>") + 4,
        htmlOutput.indexOf("</tr>")
      );
      let headers = [] as string[];
      let headerMatches = htmlHeader.match("(>)(.*?)(</td>)");
      while (headerMatches) {
        const header = headerMatches[2];
        headers.push(header);

        const idx = headerMatches[0].length + htmlHeader.search("(>)(.*?)(</td>)");
        htmlHeader = htmlHeader.substring(idx);
        headerMatches = htmlHeader.match("(>)(.*?)(</td>)");
      }
      headers = headers.slice(2);

      const exactModifierColIdx = headers.findIndex(
        (header) => header.toLowerCase() === baseModifier.toLowerCase()
      );

      if (exactModifierColIdx === -1) {
        print(
          `Could not find exact string match of ${baseModifier} in ${modifiers.toString()}`,
          "red"
        );
        return;
      }

      let totalVal = 0.0;
      // Maps modifier name to its value
      const modifierVals = new Map(
        headers.map((header) => {
          return [header, 0];
        })
      );

      const lowerCaseModifiers = modifiers.map((modifier) => modifier.toLowerCase());

      if (baseModifier.toLowerCase() === "familiar weight") {
        totalVal += familiarWeight(myFamiliar());
        print(`[Familiar Weight] Base weight (${totalVal})`);
      }

      htmlOutput = htmlOutput.substring(
        htmlOutput.indexOf("</tr>") + 5,
        htmlOutput.indexOf("</table>")
      );

      while (htmlOutput.length > 0) {
        const idxStart = htmlOutput.indexOf("<tr>");
        const idxEnd = htmlOutput.indexOf("</tr>");
        if (idxStart === -1) break;

        let row = replaceAll(htmlOutput.substring(idxStart + 4, idxEnd), "></td>", ">0</td>");
        const rowArr = [] as string[];
        let rowMatches = row.match("(>)(.*?)(</td>)");
        while (rowMatches) {
          rowArr.push(rowMatches[2]);
          row = row.replace(rowMatches[0], "");
          rowMatches = row.match("(>)(.*?)(</td>)");
        }
        rowArr
          .slice(2)
          .filter((e, idx) => idx % 2 === 0)
          .forEach((e, idx) => {
            const val = parseInt(e);
            modifierVals.set(headers[idx], (modifierVals.get(headers[idx]) ?? 0) + val);
            if (val !== 0 && lowerCaseModifiers.includes(headers[idx].toLowerCase())) {
              print(`[${headers[idx]}] ${rowArr[1]} (${val.toFixed(1)})`);
            }
          });

        htmlOutput = htmlOutput.substring(idxEnd + 5);
      }

      let total = 0.0;
      for (const modifier of headers) {
        if (lowerCaseModifiers.includes(modifier.toLowerCase())) {
          let totalVal = modifierVals.get(modifier) ?? 0;
          if (modifier.toLowerCase() === "weapon damage") {
            if (have($effect`Bow-Legged Swagger`)) {
              print(`[Weapon Damage] Bow-Legged Swagger (${totalVal.toFixed(1)})`);
              totalVal += totalVal;
            }
          } else if (modifier.toLowerCase() === "weapon damage percent") {
            if (have($effect`Bow-Legged Swagger`)) {
              print(`[Weapon Damage Percent] Bow-Legged Swagger (${totalVal.toFixed(1)})`);
              totalVal += totalVal;
            }
          }
          print(`${modifier} => ${totalVal.toFixed(1)}`, "purple");

          total += totalVal;
        }
      }

      print(`Total ${baseModifier}: ${total.toFixed(1)}`, "blue");
    }
  }
}

export function unequip(item: Item): void {
  while (equippedAmount(item) > 0) {
    const slot = Slot.all().find((equipmentSlot) => equippedItem(equipmentSlot) === item);
    if (!slot) return;
    equip(slot, $item`none`);
  }
}

type Horse = "dark" | "normal" | "crazy" | "pale" | null;

export function horsery(): Horse {
  return (get("_horsery").split(" ")[0] as Horse) ?? null;
}

export function horse(horse: Horse): void {
  if (horsery() !== horse) cliExecute(`horsery ${horse} horse`);
}

export function ensureMp(mp: number): void {
  if (myMp() > mp) return;
  if (mp > myMaxmp()) throw `Insufficient maximum mp!`;
  while (
    have($item`magical sausage`) ||
    (have($item`magical sausage casing`) && myMp() < mp && get("_sausagesEaten") < 23)
  ) {
    retrieveItem($item`magical sausage`);
    eat($item`magical sausage`);
  }

  if (myMp() < mp) restoreMp(mp);
}

export function hasNcBird(): boolean {
  return get("yourFavoriteBirdMods")
    .split(",")
    .some((mod) => mod.includes("Combat Rate: -"));
}