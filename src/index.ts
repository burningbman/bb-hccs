import {
  abort,
  autosell,
  availableAmount,
  cliExecute,
  equip,
  equippedItem,
  getCampground,
  haveEffect,
  myLevel,
  myMp,
  restoreMp,
  runChoice,
  setAutoAttack,
  toItem,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $skill,
  $slot,
  adventureMacro,
  Clan,
  CommunityService,
  get,
  have,
  Requirement,
  set,
  SongBoom,
  SourceTerminal,
  TrainSet
} from "libram";
import { Macro } from "./combatMacros";
import Drink from "./drink";
import { CSEngine } from "./engine";
import FamiliarWeight from "./familiar";
import HotRes from "./hotres";
import ItemDrop from "./item";
import Level from "./level";
import {
  ensureItem,
  ensureMp,
  ensureSewerItem,
  pullIfPossible,
  sausageFightGuaranteed,
  setChoice,
  tryUse,
  useBestFamiliar,
} from "./lib";
import Noncombat from "./noncombat";
import Spell from "./spell";
import { Hitpoints, Moxie, Muscle, Mysticality } from "./stattest";
import Weapon from "./weapon";

function ensureSaucestormMana() {
  if (myMp() < 20) {
    restoreMp(20);
  }
}

function doGuaranteedGoblin() {
  // kill a kramco for the sausage before coiling wire
  if (!haveEffect($effect`Feeling Lost`) && sausageFightGuaranteed()) {
    ensureMp(12);
    useBestFamiliar();
    ensureSaucestormMana();
    equipStatOutfit();
    const offHand = equippedItem($slot`off-hand`);
    equip($item`Kramco Sausage-o-Matic™`);
    adventureMacro(
      $location`Noob Cave`,
      Macro.if_(
        '!monstername "sausage goblin"',
        new Macro().step("abort")
      ).step(
        Macro.itemSkills().easyFight().kill()
      )
    );
    equip(offHand);
  }
}

const getBatteries = () => {
  // use the power plant
  cliExecute("inv_use.php?pwd&whichitem=10738");

  for (let i = 1; i < 8; i++) {
    cliExecute(`choice.php?pwd&whichchoice=1448&option=1&pp=${i}`);
  }
};

function vote() {
  if (!get("_voteToday")) {
    visitUrl("place.php?whichplace=town_right&action=townright_vote");
    visitUrl(
      "choice.php?option=1&whichchoice=1331&g=2&local%5B%5D=2&local%5B%5D=3"
    );
    visitUrl("place.php?whichplace=town_right&action=townright_vote"); // Let mafia see the voted values
  }
}

function equipStatOutfit() {
  cliExecute('umbrella ml');
  new Requirement(
    ["100 mysticality experience percent, mysticality experience"], {
    forceEquip: [$item`makeshift garbage shirt`, $item`unbreakable umbrella`],
  }
  ).maximize();
}

function setup() {
  if (availableAmount($item`dromedary drinking helmet`) > 0 || myLevel() > 1) return;

  // Sell pork gems + tent
  visitUrl("tutorial.php?action=toot");
  tryUse(1, $item`letter from King Ralph XI`);
  tryUse(1, $item`pork elf goodies sack`);
  autosell(5, $item`baconstone`);
  autosell(5, $item`porquoise`);
  autosell(5, $item`hamethyst`);

  if (getCampground()[$item`model train set`.name] !== 1) {
    use(toItem(`model train set`));
    TrainSet.setConfiguration([TrainSet.Station.COAL_HOPPER,
    TrainSet.Station.BRAIN_SILO,
    TrainSet.Station.VIEWING_PLATFORM,
    TrainSet.Station.WATER_BRIDGE,
    TrainSet.Station.BRAWN_SILO,
    TrainSet.Station.GROIN_SILO,
    TrainSet.Station.GAIN_MEAT,
    TrainSet.Station.CANDY_FACTORY]);
  }

  set("autoSatisfyWithNPCs", true);
  set("autoSatisfyWithCoinmasters", true);
  set("hpAutoRecovery", 0.8);

  cliExecute("mood apathetic");
  cliExecute("ccs bb-hccs");
  cliExecute("backupcamera reverser on");
  cliExecute("backupcamera ml");
  cliExecute("mcd 10");

  ensureItem(1, $item`toy accordion`);
  ensureSewerItem(1, $item`saucepan`);

  setChoice(1340, 3); // Turn off Lil' Doctor quests.
  setChoice(1387, 3); // set saber to drop items

  // pull and use borrowed time
  if (
    availableAmount($item`borrowed time`) === 0 &&
    !get("_borrowedTimeUsed")
  ) {
    if (pullIfPossible(1, $item`borrowed time`, 20000)) {
      use($item`borrowed time`);
    } else {
      abort("Couldn't get borrowed time");
    }
  }

  // unlock shops
  visitUrl("shop.php?whichshop=meatsmith&action=talk");
  runChoice(1);
  visitUrl("shop.php?whichshop=doc&action=talk");
  runChoice(1);
  visitUrl("shop.php?whichshop=armory&action=talk");
  runChoice(1);

  use(toItem('S.I.T. Course Completion Certificate'));

  pullIfPossible(1, $item`overloaded Yule battery`, 20000);
  pullIfPossible(1, $item`dromedary drinking helmet`, 2000);
  pullIfPossible(1, $item`green mana`, 10000);
  pullIfPossible(1, $item`pixel star`, 35000);
}

function doDailies() {
  if (have($item`pantogram pants`)) return;

  Clan.join("Bonus Adventures from Hell");

  use($item`Bird-a-Day calendar`);

  visitUrl("council.php"); // Initialize council.
  visitUrl("clan_viplounge.php?action=fwshop"); // manual visit to fireworks shop to allow purchases
  visitUrl("clan_viplounge.php?action=lookingglass&whichfloor=2"); // get DRINK ME potion
  visitUrl(
    "shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd"
  ); // lathe wand

  vote();

  cliExecute("retrocape mysticality hold");
  cliExecute("fold makeshift garbage shirt");
  SongBoom.setSong("Total Eclipse of Your Meat");

  if (!get("_floundryItemCreated")) {
    Clan.join('Reddit United');
    cliExecute("acquire fish hatchet");
    Clan.join("Bonus Adventures from Hell");
  }

  if (get("_horseryCrazyMys").indexOf("+") === 0) {
    cliExecute("horsery stat");
  }

  getBatteries();

  useSkill($skill`Summon Crimbo Candy`);
  useSkill($skill`Summon Sugar Sheets`, 3);

  // Upgrade saber for fam wt
  cliExecute('saber fam');

  useFamiliar($familiar`Melodramedary`);
  cliExecute("mummery myst");

  equip($familiar`Shorter-Order Cook`, $item`tiny stillsuit`);

  SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);

  cliExecute(
    "pantogram mysticality|hot|drops of blood|some self-respect|your hopes|silent"
  );
}

export function main(): void {
  setAutoAttack(0);
  doDailies();

  const coilWireStatus = CommunityService.CoilWire.run(() => {
    setup();
    doGuaranteedGoblin();
  }, 60);
  if (coilWireStatus === "failed") {
    abort(`Didn't coil wire.`);
  }

  CSEngine.runTests(Level,
    Muscle,
    Hitpoints,
    Mysticality,
    Moxie,
    Drink,
    Noncombat,
    HotRes,
    FamiliarWeight,
    Weapon,
    Spell,
    ItemDrop);
}