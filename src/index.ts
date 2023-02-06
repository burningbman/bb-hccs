import {
  abort,
  autosell,
  availableAmount,
  cliExecute,
  drink,
  eat,
  equip,
  equippedItem,
  getCampground,
  haveEffect,
  haveEquipped,
  myBasestat,
  myBuffedstat,
  myHp,
  myLevel,
  myMaxhp,
  myMeat,
  myMp,
  myThrall,
  numericModifier,
  restoreMp,
  runChoice,
  runCombat,
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
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  $stat,
  $thrall,
  adventureMacro,
  adventureMacroAuto,
  AutumnAton,
  BeachComb,
  Clan,
  CommunityService,
  ensureEffect,
  get,
  have,
  Requirement,
  set,
  SongBoom,
  SourceTerminal,
  TrainSet
} from "libram";
import { Macro } from "./combatMacros";
import { CSEngine } from "./engine";
import FamiliarWeight from "./familiar";
import HotRes from "./hotres";
import ItemDrop from "./item";
import {
  adventureWithCarolGhost,
  ensureItem,
  ensureSewerItem,
  ensureSong,
  mapMacro,
  multiFightAutoAttack,
  printModtrace,
  pullIfPossible,
  sausageFightGuaranteed,
  setChoice,
  synthExp,
  tryUse,
  useBestFamiliar,
  voterMonsterNow,
} from "./lib";
import Noncombat from "./noncombat";
import Spell from "./spell";
import Weapon from "./weapon";

enum TestEnum {
  HitPoints = CommunityService.HP.id,
  MUS = CommunityService.Muscle.id,
  MYS = CommunityService.Mysticality.id,
  MOX = CommunityService.Moxie.id,
  COIL_WIRE = CommunityService.CoilWire.id,
  DONATE = 30,
}

interface TestObject {
  id: TestEnum;
  spreadsheetTurns: number;
  test: CommunityService;
  doTestPrep: {
    (): void
  };
}

function handleOutfit(test: TestObject | undefined) {
  if (!test) return;
  test.test.maximize();
}

function ensureSaucestormMana() {
  if (myMp() < 12) {
    restoreMp(20);
  }
}

function upkeepHp() {
  if (myHp() < 0.8 * myMaxhp()) {
    if (get('_hotTubSoaks') < 5)
      cliExecute("hottub");
    else
      useSkill($skill`Cannelloni Cocoon`);
  }
}

function upkeepHpAndMp() {
  upkeepHp();
  if (myMp() < 500) {
    eat($item`magical sausage`);
  }
}

function doGuaranteedGoblin() {
  // kill a kramco for the sausage before coiling wire
  if (!haveEffect($effect`Feeling Lost`) && sausageFightGuaranteed()) {
    useBestFamiliar();
    ensureSaucestormMana();
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

function doVotingMonster() {
  if (voterMonsterNow()) {
    const acc3 = equippedItem($slot`acc3`);
    equip($item`"I Voted!" sticker`, $slot`acc3`);
    adventureMacro($location`Noob Cave`, Macro.default());
    equip(acc3, $slot`acc3`);
  }
}

function doAutumnaton() {
  if (AutumnAton.available()) {
    AutumnAton.sendTo($location`The Sleazy Back Alley`);
  }
}

function runTest(testId: TestEnum) {
  const test = tests.find((test) => test.id === testId);
  if (test && !test.test.isDone()) {
    doGuaranteedGoblin();
    doVotingMonster();
    doAutumnaton();

    if (test.test.run(test.doTestPrep, test.spreadsheetTurns) === "failed") {
      abort(
        `Didn't complete ${TestEnum[testId]} test. Expected ${test.spreadsheetTurns} turns, predicted ${test.test.prediction} turns`
      );
    }
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

function preCoilWireFights() {
  if (have($item`cherry`) || CommunityService.CoilWire.isDone()) return;

  new Requirement(
    ["100 mysticality experience percent, mysticality experience, ML"], {
    forceEquip: [...$items`Daylight Shavings Helmet`, $item`unbreakable umbrella`], // Setup PM to get 2nd buff after coiling wire
    preventEquip: $items`makeshift garbage shirt`, // Save exp boosts for scalers
  }
  ).maximize();
  useBestFamiliar();

  if (myHp() < myMaxhp()) {
    useSkill($skill`Cannelloni Cocoon`);
  }
}

function useStatGains() {
  if (!have($item`a ten-percent bonus`)) return;

  equipStatOutfit();

  if (haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
    visitUrl("place.php?whichplace=campaway&action=campaway_sky");
  }

  ensureEffect($effect`Inscrutable Gaze`);
  ensureEffect($effect`Thaumodynamic`);
  synthExp();

  if (Math.round(numericModifier("mysticality experience percent")) < 100) {
    throw "Insufficient +stat%.";
  }

  // Use ten-percent bonus
  tryUse(1, $item`a ten-percent bonus`);

  cliExecute("bastille myst brutalist");

  eat(1, $item`magical sausage`);
}

function buffBeforeGoblins() {
  if (have($effect`You Learned Something Maybe!`) || myLevel() >= 13) return;
  equip($slot`acc3`, $item`Powerful Glove`);
  tryUse(1, $item`MayDay™ supply package`);

  // craft potions after eating to ensure we have adventures
  if (!get("hasRange")) {
    if (myMeat() < 950) {
      useSkill($skill`Prevent Scurvy and Sobriety`);
      autosell($item`bottle of rum`, 3);
      autosell($item`grapefruit`, availableAmount($item`grapefruit`) - 1);
    }
    ensureItem(1, $item`Dramatic™ range`);
    use(1, $item`Dramatic™ range`);
  }

  ensureEffect($effect`Favored by Lyle`);
  ensureEffect($effect`Starry-Eyed`);
  ensureEffect($effect`Triple-Sized`);
  ensureEffect($effect`Feeling Excited`);
  ensureEffect($effect`Uncucumbered`); // boxing daycare
  ensureEffect($effect`Lapdog`); // VIP swimming pool
  BeachComb.tryHead($effect`We're All Made of Starfish`);
  if (myThrall() !== $thrall`Spaghetti Elemental`) {
    useSkill(1, $skill`Bind Spaghetti Elemental`);
  }

  // Plan is for these buffs to fall all the way through to hot res -> fam weight.
  ensureEffect($effect`Fidoxene`);
  ensureEffect($effect`Billiards Belligerence`);
  BeachComb.tryHead($effect`Do I Know You From Somewhere?`);
  BeachComb.tryHead($effect`You Learned Something Maybe!`);

  if (!haveEffect($effect`Holiday Yoked`)) {
    adventureWithCarolGhost($effect`Holiday Yoked`);
  }
}

function fightGodLob() {
  upkeepHp();
  ensureSaucestormMana();
  visitUrl("main.php?fightgodlobster=1");
  runCombat(Macro.delevel().itemSkills().attack().repeat().toString());
  multiFightAutoAttack();
  runChoice(-1);
}

function godLob() {
  if (get("_godLobsterFights") === 0) {
    equip($item`Fourth of May Cosplay Saber`);
    useFamiliar($familiar`God Lobster`);
    setChoice(1310, 1);
    fightGodLob();
    equip($slot`familiar`, $item`God Lobster's Scepter`);
    fightGodLob();
    equip($slot`familiar`, $item`God Lobster's Ring`);
    setChoice(1310, 2);
    fightGodLob();
  }
}

function setupNEP() {
  // Neverending Party
  if (get("_questPartyFair") === "unstarted") {
    setChoice(1322, 0);
    visitUrl("adventure.php?snarfblat=528");
    if (get("_questPartyFairQuest") === "food") {
      runChoice(1);
      setChoice(1324, 2);
      setChoice(1326, 3);
    } else if (get("_questPartyFairQuest") === "booze") {
      runChoice(1);
      setChoice(1324, 3);
      setChoice(1327, 3);
    } else {
      runChoice(2);
      setChoice(1324, 5);
    }
  }
}

function doFreeFights() {
  if (have($item`Desert Bus pass`)) return;

  equipStatOutfit();

  upkeepHp();

  ensureEffect($effect`Blessing of your favorite Bird`); // 75% myst
  ensureEffect($effect`Confidence of the Votive`); // PM candle
  ensureEffect($effect`Song of Bravado`);
  ensureSong($effect`Polka of Plenty`);
  ensureEffect($effect`Big`);
  ensureEffect($effect`Blood Bond`);
  ensureEffect($effect`Blood Bubble`);
  ensureEffect($effect`Feeling Excited`);
  ensureEffect($effect`Drescher's Annoying Noise`);
  ensureEffect($effect`Elemental Saucesphere`);
  ensureEffect($effect`Inscrutable Gaze`);
  ensureEffect($effect`Leash of Linguini`);
  ensureEffect($effect`Pride of the Puffin`);
  ensureEffect($effect`Singer's Faithful Ocelot`);
  ensureEffect($effect`Stevedave's Shanty of Superiority`);
  ensureEffect($effect`Ur-Kel's Aria of Annoyance`);

  // li'l ninja costume  
  if (!have($item`li'l ninja costume`)) {
    useBestFamiliar();
    equip($slot`acc3`, $item`Lil' Doctor™ bag`);
    mapMacro(
      $location`The Haiku Dungeon`,
      $monster`amateur ninja`,
      Macro.if_(
        `monsterid ${$monster`amateur ninja`.id}`,
        Macro.skill($skill`Feel Envy`)
          .skill($skill`Chest X-Ray`)
      ).step("abort")
    );
  }

  if (get('_speakeasyFreeFights', 0) === 0) {
    // speakeasy
    useBestFamiliar();
    adventureMacro($location`An Unusually Quiet Barroom Brawl`, Macro.easyFight().attack().repeat()); // use first free kill
    adventureMacro($location`An Unusually Quiet Barroom Brawl`, Macro.skill($skill`Portscan`).easyFight().attack().repeat()); // setup portscan

    // kill gov't agent with last speakeasy free kill
    equip($item`Lil' Doctor™ bag`);
    equip($item`vampyric cloake`);
    adventureMacro($location`An Unusually Quiet Barroom Brawl`,
      Macro.skill($skill`Giant Growth`).skill($skill`Become a Bat`).skill($skill`Otoscope`).kill());
  }

  equipStatOutfit();
  godLob();
  useBestFamiliar();

  // unequip saber
  equipStatOutfit();
  setupNEP();

  // Use 10 NEP free kills
  while (get("_neverendingPartyFreeTurns") < 10) {
    upkeepHp();
    useBestFamiliar();
    adventureMacro(
      $location`The Neverending Party`,
      Macro.externalIf(
        get("_neverendingPartyFreeTurns") > 0, // make sure bowling sideways before feel pride
        Macro.trySkill($skill`Feel Pride`)
      ).default(true)
    );
    if (
      get("lastEncounter").includes("Gone Kitchin") ||
      get("lastEncounter").includes("Forward to the Back")
    ) {
      setChoice(1324, 5);
    }
  }

  // Use other free kills
  equipStatOutfit();
  equip($slot`acc3`, $item`Lil' Doctor™ bag`);
  while (get("_shatteringPunchUsed") < 3 || get("_chestXRayUsed") < 3) {
    if (!have($effect`Everything Looks Yellow`)) {
      cliExecute('parka acid');
      equip($item`Jurassic Parka`);
    }
    useBestFamiliar();
    upkeepHpAndMp();
    adventureMacroAuto(
      $location`The Neverending Party`,
      Macro.trySkill($skill`Bowl Sideways`)
        .if_(
          "(monsterid 2104) || (monstername Black Crayon *)",
          new Macro().skill($skill`Saucegeyser`).repeat()
        )
        .trySkill($skill`Spit jurassic acid`)
        .trySkill($skill`Gingerbread Mob Hit`)
        .trySkill($skill`Shattering Punch`)
        .trySkill($skill`Chest X-Ray`)
    );
    !haveEquipped($item`makeshift garbage shirt`) && equip($item`makeshift garbage shirt`);
  }

  ensureItem(1, $item`Desert Bus pass`);
  cliExecute("fold wad of used tape"); // for stat and item tests

  if (
    get("_horseryCrazyMox").indexOf("-") === 0 ||
    get("_horseryCrazyMus").indexOf("-") === 0
  ) {
    cliExecute("horsery -combat");
  }
}

function doHpTest() {
  useSkill($skill`Bind Undead Elbow Macaroni`);
  cliExecute("retrocape muscle");
  handleOutfit(tests.find((test) => test.id === TestEnum.HitPoints));
  printModtrace(["Maximum HP", "Maximum HP Percent"]);
}

function doMoxTest() {
  if (get("_horseryCrazyMox").indexOf("+") === 0) {
    cliExecute("horsery stat");
  }

  useSkill($skill`Bind Penne Dreadful`);
  ensureEffect($effect`Blessing of the Bird`); // SA/PM have moxie bird
  ensureEffect($effect`Big`);
  ensureEffect($effect`Song of Bravado`);
  ensureSong($effect`Stevedave's Shanty of Superiority`);
  ensureSong($effect`The Moxious Madrigal`);
  BeachComb.tryHead($effect`Pomp & Circumsands`);
  if (have($item`runproof mascara`)) use($item`runproof mascara`);
  ensureEffect($effect`Quiet Desperation`);
  ensureEffect($effect`Disco Fever`);
  ensureEffect($effect`Mariachi Mood`);
  cliExecute("retrocape moxie");
  // use($item `pocket maze`);

  if (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`) < 1770) {
    useSkill(1, $skill`Acquire Rhinestones`);
    use(availableAmount($item`rhinestone`), $item`rhinestone`);
  }
  handleOutfit(tests.find((test) => test.id === TestEnum.MOX));


  printModtrace(["Moxie", "Moxie Percent"]);
}

function doMusTest() {
  if (get("_horseryCrazyMus").indexOf("+") === 0) {
    cliExecute("horsery stat");
  }

  useSkill($skill`Bind Undead Elbow Macaroni`);

  ensureEffect($effect`Big`);
  ensureEffect($effect`Song of Bravado`);
  ensureEffect($effect`Rage of the Reindeer`);
  BeachComb.tryHead($effect`Lack of Body-Building`);
  ensureSong($effect`Stevedave's Shanty of Superiority`);
  ensureSong($effect`Power Ballad of the Arrowsmith`);
  ensureEffect($effect`Quiet Determination`);
  ensureEffect($effect`Disdain of the War Snapper`);
  cliExecute("retrocape muscle");
  handleOutfit(tests.find((test) => test.id === TestEnum.MUS));

  printModtrace(['Muscle', 'Muscle Percent']);
}

const tests: TestObject[] = [{
  id: TestEnum.HitPoints,
  spreadsheetTurns: 1,
  test: CommunityService.HP,
  doTestPrep: doHpTest,
},
{
  id: TestEnum.MYS,
  spreadsheetTurns: 1,
  test: CommunityService.Mysticality,
  doTestPrep: () => {
    printModtrace(["Mysticality", "Mysticality Percent"]);
    return;
  },
},
{
  id: TestEnum.MUS,
  spreadsheetTurns: 4,
  test: CommunityService.Muscle,
  doTestPrep: doMusTest,
},
{
  id: TestEnum.MOX,
  spreadsheetTurns: 1,
  test: CommunityService.Moxie,
  doTestPrep: doMoxTest,
},
{
  id: TestEnum.COIL_WIRE,
  spreadsheetTurns: 60,
  test: CommunityService.CoilWire,
  doTestPrep: () => {
    setup();
    preCoilWireFights();
  },
},
];

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
    preCoilWireFights();
    doGuaranteedGoblin();
    doVotingMonster();
  }, 60);
  if (coilWireStatus === "failed") {
    abort(`Didn't coil wire.`);
  }

  useStatGains();
  buffBeforeGoblins();
  doFreeFights();

  if (availableAmount($item`astral six-pack`) === 1) {
    tryUse(1, $item`astral six-pack`);
    useSkill(2, $skill`The Ode to Booze`);
    drink(6, $item`astral pilsner`);
  }
  ensureSewerItem(1, $item`turtle totem`);

  runTest(TestEnum.MUS);
  runTest(TestEnum.HitPoints);
  runTest(TestEnum.MYS);
  runTest(TestEnum.MOX);
  CSEngine.runTests(Noncombat,
    HotRes,
    FamiliarWeight,
    Weapon,
    Spell,
    ItemDrop);
}