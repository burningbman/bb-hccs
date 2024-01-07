import {
  autosell,
  buy,
  canAdventure,
  changeMcd,
  cliExecute,
  currentMcd,
  equip,
  familiarEquippedEquipment,
  getCampground,
  runChoice,
  setAutoAttack,
  toItem,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $coinmaster,
  $familiar,
  $item,
  $location,
  $skill,
  Clan,
  CommunityService,
  get,
  have,
  set,
  SongBoom,
  SourceTerminal,
  TrainSet
} from "libram";
import Drink from "./drink";
import { CSEngine, CSQuest } from "./engine";
import FamiliarWeight from "./familiar";
import HotRes from "./hotres";
import ItemDrop from "./item";
import Level from "./level";
import {
  ensureItem,
  ensureSewerItem,
  pullIfPossible,
  setChoice,
  tryUse,
} from "./lib";
import Noncombat from "./noncombat";
import Spell from "./spell";
import { Hitpoints, Moxie, Muscle, Mysticality } from "./stattest";
import Weapon from "./weapon";
import { OutfitSpec } from "grimoire-kolmafia";
import { GOBLIN_TASK } from "./globaltasks";

const Setup: CSQuest = {
  type: "SERVICE",
  name: "Setup",
  test: CommunityService.CoilWire,
  completed: () => false,
  maxTurns: 60,
  outfit: (): OutfitSpec => ({}),
  tasks: [{
    name: 'Council and VIP',
    completed: () => have($item`"DRINK ME" potion`),
    do: () => {
      visitUrl("council.php"); // Initialize council.
      visitUrl("clan_viplounge.php?action=fwshop"); // manual visit to fireworks shop to allow purchases
      visitUrl("clan_viplounge.php?action=lookingglass&whichfloor=2"); // get DRINK ME potion
    }
  },
  {
    name: 'Get fish hatchet',
    completed: () => get("_floundryItemCreated"),
    do: () => {
      Clan.join('Reddit United');
      cliExecute("acquire fish hatchet");
    }
  }, {
    name: 'Join BAfH',
    completed: () => Clan.get().name === "Bonus Adventures from Hell",
    do: () => Clan.join("Bonus Adventures from Hell")
  }, {
    name: 'Get bird calendar',
    completed: () => get('_canSeekBirds'),
    do: () => use($item`Bird-a-Day calendar`)
  }, {
    name: 'Stat horse',
    ready: () => get("_horseryCrazyMys").indexOf("+") === 0,
    completed: () => get('_horsery') === 'crazy horse',
    do: () => cliExecute("horsery stat")
  }, {
    name: 'Vote',
    completed: () => have($item`"I Voted!" sticker`),
    do: () => {
      visitUrl("place.php?whichplace=town_right&action=townright_vote");
      visitUrl(
        "choice.php?option=1&whichchoice=1331&g=2&local%5B%5D=2&local%5B%5D=3"
      );
      visitUrl("place.php?whichplace=town_right&action=townright_vote"); // Let mafia see the voted values
    }
  }, {
    name: 'Setup cape',
    completed: () => get('retroCapeSuperhero') === 'heck' && get('retroCapeWashingInstructions') === 'hold',
    do: () => cliExecute("retrocape mysticality hold")
  }, {
    name: 'Get garbage shirt',
    completed: () => have($item`makeshift garbage shirt`),
    do: () => cliExecute("fold makeshift garbage shirt")
  }, {
    name: 'Setup SongBoom',
    completed: () => SongBoom.song() === 'Total Eclipse of Your Meat',
    do: () => SongBoom.setSong("Total Eclipse of Your Meat")
  }, {
    name: 'Summon Crimbo Candy',
    completed: () => get('_candySummons') === 1,
    do: () => useSkill($skill`Summon Crimbo Candy`)
  }, {
    name: 'Summon Sugar Sheets',
    completed: () => get('_sugarSummons') === 3,
    do: () => useSkill($skill`Summon Sugar Sheets`, 3)
  }, {
    name: 'Saber fam weight',
    completed: () => get('_saberMod') === 4,
    do: () => cliExecute('saber fam')
  }, {
    name: 'Mummery on Camel',
    completed: () => get('_mummeryMods').includes('Experience (Mysticality): [4*fam(Melodramedary)]'),
    do: () => {
      useFamiliar($familiar`Melodramedary`);
      cliExecute("mummery myst");
    }
  }, {
    name: 'Equip stillsuit',
    completed: () => familiarEquippedEquipment($familiar`Shorter-Order Cook`) === $item`tiny stillsuit`,
    do: () => equip($familiar`Shorter-Order Cook`, $item`tiny stillsuit`)
  }, {
    name: 'Setup Source Terminal',
    completed: () => SourceTerminal.getSkills().includes($skill`Extract`) && SourceTerminal.getSkills().includes($skill`Portscan`),
    do: () => SourceTerminal.educate([$skill`Extract`, $skill`Portscan`])
  }, {
    name: 'Pantogram',
    completed: () => have($item`pantogram pants`),
    do: () => cliExecute("pantogram mysticality|hot|drops of blood|some self-respect|your hopes|silent")
  }, {
    name: 'Lathe wand',
    completed: () => have($item`weeping willow wand`),
    do: () => visitUrl("shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd")
  }, {
    name: 'Toot Oriole',
    completed: () => get('questM05Toot') === 'finished' && !have($item`pork elf goodies sack`),
    do: () => {
      // Sell pork gems + tent
      visitUrl("tutorial.php?action=toot");
      tryUse(1, $item`letter from King Ralph XI`);
      tryUse(1, $item`pork elf goodies sack`);
      autosell(5, $item`baconstone`);
      autosell(5, $item`porquoise`);
      autosell(5, $item`hamethyst`);
    }
  }, {
    name: 'Setup train set',
    completed: () => getCampground()[$item`model train set`.name] === 1,
    do: () => {
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
  }, {
    name: 'Unlock Shops',
    completed: () => get('questM25Armorer') === 'started',
    do: () => {
      // unlock shops
      visitUrl("shop.php?whichshop=meatsmith&action=talk");
      runChoice(1);
      visitUrl("shop.php?whichshop=doc&action=talk");
      runChoice(1);
      visitUrl("shop.php?whichshop=armory&action=talk");
      runChoice(1);
    }
  }, {
    name: 'Misc',
    completed: () => get('backupCameraMode') === 'ml',
    do: () => {
      set("autoSatisfyWithNPCs", true);
      set("autoSatisfyWithCoinmasters", true);
      set("hpAutoRecovery", 0.8);

      setChoice(1340, 3); // Turn off Lil' Doctor quests.
      setChoice(1387, 3); // set saber to drop items

      cliExecute("mood apathetic");
      cliExecute("ccs bb-hccs");
      cliExecute("backupcamera reverser on");
      cliExecute("backupcamera ml");
    }
  }, {
    name: 'MCD',
    ready: () => canAdventure($location`Camp Logging Camp`),
    do: () => changeMcd(11),
    completed: () => currentMcd() === 11
  }, {
    name: 'Get Accordion',
    completed: () => have($item`toy accordion`),
    do: () => ensureItem(1, $item`toy accordion`)
  }, {
    name: 'Get Saucepan',
    completed: () => have($item`saucepan`),
    do: () => ensureSewerItem(1, $item`saucepan`)
  }, {
    name: 'Borrowed Time',
    completed: () => get("_borrowedTimeUsed"),
    do: () => {
      pullIfPossible(1, $item`borrowed time`, 50000);
      use($item`borrowed time`);
    },
    limit: {
      tries: 1
    }
  }, {
    name: 'S.I.T. Course',
    completed: () => get('_sitCourseCompleted'),
    do: () => use(toItem(`S.I.T. Course Completion Certificate`))
  }, {
    name: 'Mr. Store 2002',
    completed: () => get('_2002MrStoreCreditsCollected') && get('availableMrStore2002Credits', 0) === 0,
    do: () => {
      set('choiceAdventure1506', 3);
      buy($coinmaster`Mr. Store 2002`, 1, toItem(`Letter from Carrie Bradshaw`));
      use(toItem(`Letter from Carrie Bradshaw`));
      buy($coinmaster`Mr. Store 2002`, 1, toItem(`Loathing Idol Microphone`));
      buy($coinmaster`Mr. Store 2002`, 1, toItem(`Charter: Nellyville`));
    }
  }, {
    name: 'Pull yule battery',
    completed: () => have($item`overloaded Yule battery`),
    do: () => pullIfPossible(1, $item`overloaded Yule battery`, 20000)
  }, {
    name: 'Pull dromedary drinking helmet',
    completed: () => have($item`dromedary drinking helmet`),
    do: () => pullIfPossible(1, $item`dromedary drinking helmet`, 20000)
  }, {
    name: 'Pull green mana',
    completed: () => have($item`green mana`),
    do: () => pullIfPossible(1, $item`green mana`, 50000),
    limit: {
      tries: 1
    }
  }, {
    name: 'Pull pixel star',
    completed: () => have($item`pixel star`),
    do: () => pullIfPossible(1, $item`pixel star`, 20000)
  }, GOBLIN_TASK
  ]
};

export function main(): void {
  setAutoAttack(0);

  CSEngine.runTests(Setup,
    Level,
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