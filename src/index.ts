import {
    abort,
    adv1,
    autosell,
    availableAmount,
    buy,
    chew,
    cliExecute,
    containsText,
    create,
    drink,
    eat,
    equip,
    equippedAmount,
    equippedItem,
    familiarWeight,
    gametimeToInt,
    getProperty,
    handlingChoice,
    haveEffect,
    haveOutfit,
    haveSkill,
    mallPrice,
    myAdventures,
    myBasestat,
    myBuffedstat,
    myClass,
    myFamiliar,
    myFullness,
    myHp,
    myInebriety,
    myLevel,
    myMaxhp,
    myMeat,
    myMp,
    mySpleenUse,
    myTurncount,
    numericModifier,
    outfit,
    print,
    putShop,
    restoreHp,
    restoreMp,
    runChoice,
    runCombat,
    setAutoAttack,
    setProperty,
    shopPrice,
    toInt,
    toItem,
    use,
    useFamiliar,
    userConfirm,
    useSkill,
    visitUrl,
    weightAdjustment,
} from 'kolmafia';
import {
    $class,
    $effect,
    $familiar,
    $item,
    $items,
    $location,
    $monster,
    $skill,
    $slot,
    $stat,
    get,
    have,
    Macro,
    Mood,
    set,
} from 'libram';
import {
    adventureWithCarolGhost,
    eatPizza,
    ensureCreateItem,
    ensureEffect,
    ensureItem,
    ensureNpcEffect,
    ensurePotionEffect,
    ensurePullEffect,
    ensureSewerItem,
    ensureSong,
    getPropertyInt,
    mapAndSaberMonster,
    mapMonster,
    pullIfPossible,
    sausageFightGuaranteed,
    setChoice,
    setClan,
    tryUse,
    wishEffect,
} from './lib';

enum Test {
    HP = 1,
    MUS = 2,
    MYS = 3,
    MOX = 4,
    FAMILIAR = 5,
    WEAPON = 6,
    SPELL = 7,
    NONCOMBAT = 8,
    ITEM = 9,
    HOT_RES = 10,
    COIL_WIRE = 11,
    DONATE = 30,
}

interface TestObject {
    id: Test,
    spreadsheetTurns: number,
    getPredictedTurns: { (): number },
    doTestPrep: { (): void }
}

function ensureMeteorShowerAndCarolGhostEffect() {
    if (!haveEffect($effect`Do You Crush What I Crush?`) || !haveEffect($effect`Meteor Showered`)) {
        equip($item`Fourth of May Cosplay Saber`);
        adventureWithCarolGhost($effect`Do You Crush What I Crush?`, Macro
            .skill($skill`Meteor Shower`)
            .skill($skill`Use the Force`)
        );
        if (handlingChoice()) runChoice(3);
    }
}

function upkeepHpAndMp() {
    if (myHp() < 0.8 * myMaxhp()) {
        cliExecute('hottub');
    }
    if (myMp() < 500) {
        eat($item`magical sausage`);
    }
}

function doGuaranteedGoblin() {
    // kill a kramco for the sausage before coiling wire
    if (!haveEffect($effect`Feeling Lost`) && sausageFightGuaranteed()) {
        if (myMp() < 12) {
            restoreMp(20);
        }
        const offHand = equippedItem($slot`off-hand`);
        equip($item`Kramco Sausage-o-Matic™`);
        Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
            .trySkill($skill`Barrage of Tears`)
            .trySkill($skill`Spittoon Monsoon`)
            .trySkill($skill`Beach Combo`)
            .skill($skill`Saucestorm`)
            .repeat().setAutoAttack();
        adv1($location`Noob Cave`);
        equip(offHand);
    }
}

function testDone(testNum: number) {
    print(`Checking test ${testNum}...`);
    return get(`_hccsTestActual${testNum}`) !== -1;
}

function clickTestButton(test: Test) {
    const turnsBeforeTest = myTurncount();
    visitUrl('council.php');
    visitUrl(`choice.php?whichchoice=1089&option=${test}`);

    if (test !== Test.DONATE && myTurncount() === turnsBeforeTest) {
        throw `Failed to do test ${Test[test]}. Maybe we are out of turns.`;
    }

    set(`_hccsTestActual${test}`, myTurncount() - turnsBeforeTest);
}

function runTest(testId: Test) {
    const test = tests.find((test) => test.id === testId);
    if (test) {
        if (!testDone(testId)) {
            doGuaranteedGoblin();
            test.doTestPrep();
            if (haveOutfit(`hccs_${Test[testId]}`)) outfit(`hccs_${Test[testId]}`);
            let predictedTurns = 60;
            if (testId !== Test.DONATE && testId !== Test.COIL_WIRE) {
                predictedTurns = test.getPredictedTurns();
                if (predictedTurns > test.spreadsheetTurns) {
                    if (!userConfirm(`${Test[testId]} taking ${predictedTurns} instead of ${test.spreadsheetTurns}. Continue?`)) {
                        throw 'Test taking too long.'
                    }
                }

                while (predictedTurns > myAdventures()) {
                    eat(1, $item`magical sausage`);
                }

                // [$slot`hat`, $slot`back`, $slot`weapon`, $slot`off-hand`, $slot`pants`, $slot`shirt`, $slot`acc1`, $slot`acc2`, $slot`acc3`, $slot`familiar`].forEach((slot) =>
                //     print(`${slot.toString()}: ${equippedItem(slot)}`)
                // )
            }
            set(`_hccsTestExpected${testId}`, predictedTurns);
            clickTestButton(testId);
        } else {
            print(`Test ${testId} already completed.`);
        }
    }
}

// const getBatteries = () => {
//     // use the power plant
//     cliExecute("inv_use.php?pwd&whichitem=10738");
//
//     for (let i = 1; i < 8; i++) {
//         cliExecute(`choice.php?pwd&whichchoice=1448&option=1&pp=${i}`);
//     }
// };

const ensureDeepDarkVisions = () => {
    if (have($effect`Visions of the Deep Dark Deeps`)) return;
    // Deep Dark Visions
    useFamiliar($familiar`Exotic Parrot`);
    ensureEffect($effect`Feeling Peaceful`);
    cliExecute('retrocape vampire hold');

    upkeepHpAndMp();
    if (Math.round(numericModifier('spooky resistance')) < 10) {
        ensureEffect($effect`Does It Have a Skull In There??`);
        if (Math.round(numericModifier('spooky resistance')) < 10) {
            throw 'Not enough spooky res for Deep Dark Visions.';
        }
    }
    useSkill(1, $skill`Deep Dark Visions`);
}

function setup() {
    if (availableAmount($item`blood-faced volleyball`) > 0 || myLevel() > 1) return;

    set('bb_ScriptStartCS', gametimeToInt());
    set('autoSatisfyWithNPCs', true);
    set('autoSatisfyWithCoinmasters', true);
    set('hpAutoRecovery', .8);

    // reset actual counts for validation
    for (const test in Test) {
        set(`_hccsTestActual${Test[test]}`, -1);
    }

    setClan('Bonus Adventures from Hell');

    use($item`Bird-a-Day calendar`);

    // Sell pork gems + tent
    visitUrl('tutorial.php?action=toot');
    tryUse(1, $item`letter from King Ralph XI`);
    tryUse(1, $item`pork elf goodies sack`);
    autosell(5, $item`baconstone`);
    autosell(5, $item`porquoise`);
    autosell(5, $item`hamethyst`);

    visitUrl('council.php'); // Initialize council.
    visitUrl('clan_viplounge.php?action=fwshop'); // manual visit to fireworks shop to allow purchases
    visitUrl('clan_viplounge.php?action=lookingglass&whichfloor=2'); // get DRINK ME potion
    visitUrl('shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd'); // lathe wand

    ensureItem(1, $item`toy accordion`);

    cliExecute('mood apathetic');
    cliExecute('ccs bean-hccs');
    cliExecute('backupcamera reverser on');
    cliExecute('backupcamera ml');
    cliExecute('boombox fists');
    cliExecute('mcd 10');
    cliExecute('retrocape mysticality thrill');
    cliExecute('fold makeshift garbage shirt');

    setChoice(1340, 3); // Turn off Lil' Doctor quests.
    setChoice(1387, 3); // set saber to drop items
    setChoice(1410, 2); // pick mushroom

    // Upgrade saber for fam wt
    visitUrl('main.php?action=may4');
    runChoice(4);

    // pull and use borrowed time
    if (availableAmount($item`borrowed time`) === 0 && !get('_borrowedTimeUsed')) {
        if (pullIfPossible(1, $item`borrowed time`, 20000)) {
            use($item`borrowed time`);
        } else {
            abort("Couldn't get borrowed time");
        }
    }

    if (!get('_floundryItemCreated')) {
        cliExecute('acquire fish hatchet');
    }

    // getBatteries();

    // ensureSewerItem(1, $item`turtle totem`);
    ensureSewerItem(1, $item`saucepan`);

    // get blood-faced volleyball
    // cliExecute('acquire seal tooth');
    // cliExecute('acquire volleyball');
    // use($item`seal tooth`);
    // use($item`volleyball`);
    pullIfPossible(1, $item`blood-faced volleyball`, 2000);
}

function getPizzaIngredients() {
    if (have($item`cherry`) || myLevel() > 1) return;

    // Put on some regen gear
    outfit('hccs_pizza');

    // get antique packet of ketchup for MAL pizza
    if (!have($item`antique packet of ketchup`)) {
        Macro.skill($skill`Feel Envy`).skill($skill`Chest X-Ray`).setAutoAttack();
        mapMonster($location`The Haunted Kitchen`, $monster`possessed silverware drawer`);
        runCombat();
    }

    // Saber tomato (reagent potion)
    if (!have($item`tomato`)) {
        mapMonster($location`The Haunted Pantry`, $monster`possessed can of tomatoes`);
        runCombat();
    }

    // Cherry and grapefruit in skeleton store (Saber YR)
    if (getProperty('questM23Meatsmith') === 'unstarted') {
        visitUrl('shop.php?whichshop=meatsmith&action=talk');
        runChoice(1);
    }
    adv1($location`The Skeleton Store`);
    mapAndSaberMonster($location`The Skeleton Store`, $monster`novelty tropical skeleton`);
}

function useStatGains() {
    if (!have($item`a ten-percent bonus`)) return;

    outfit('hccs_pizza');

    if (get('getawayCampsiteUnlocked') && haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
        visitUrl('place.php?whichplace=campaway&action=campaway_sky');
    }

    ensureEffect($effect`Inscrutable Gaze`);
    ensureEffect($effect`Thaumodynamic`);
    ensurePullEffect($effect`Category`, $item`abstraction: category`);
    ensurePullEffect($effect`Different Way of Seeing Things`, $item`non-Euclidean angle`);

    if (Math.round(numericModifier('mysticality experience percent')) < 125) {
        throw 'Insufficient +stat%.';
    }

    // Use ten-percent bonus
    tryUse(1, $item`a ten-percent bonus`);

    // Scavenge for gym equipment
    if (!get('_hccsMinRealTime') && toInt(get('_daycareGymScavenges')) < 1) {
        visitUrl('/place.php?whichplace=town_wrong&action=townwrong_boxingdaycare');
        const pg = runChoice(3);
        if (containsText(pg, '[free]')) runChoice(2);
        runChoice(5);
        runChoice(4);
    }
}

function buffBeforeGoblins() {
    if (have($effect`Holiday Yoked`) || myLevel() >= 13) return;

    // MAL pizza
    if (!haveEffect($effect`Mallowed Out`)) {
        // pull giant pearl to ensure 100 turns
        if (availableAmount($item`giant pearl`) === 0 && !haveEffect($effect`Mallowed Out`)) {
            if (!pullIfPossible(1, $item`giant pearl`, 24000)) {
                abort("Couldn't get giant pearl");
            }
        }

        useSkill($skill`Advanced Cocktailcrafting`); // get M and L
        eatPizza(
            $item`magical ice cubes`,
            $item`antique packet of ketchup`,
            $item`little paper umbrella`,
            $item`giant pearl`
        );
    }

    // craft potions after eating to ensure we have adventures
    if (!get('hasRange')) {
        ensureItem(1, $item`Dramatic™ range`);
        use(1, $item`Dramatic™ range`);
    }

    if (haveSkill($skill`Advanced Saucecrafting`)) useSkill(1, $skill`Advanced Saucecrafting`);
    ensurePotionEffect($effect`Tomato Power`, $item`tomato juice of powerful power`);
    ensurePotionEffect($effect`Mystically Oiled`, $item`ointment of the occult`);

    [$item`tomato juice of powerful power`, $item`ointment of the occult`].forEach((item) =>
        autosell(availableAmount(item), item)
    )

    ensureEffect($effect`Favored by Lyle`);
    ensureEffect($effect`Starry-Eyed`);
    ensureEffect($effect`Triple-Sized`);
    ensureEffect($effect`Feeling Excited`);
    ensureEffect($effect`Uncucumbered`); // boxing daycare
    ensureSong($effect`The Magical Mojomuscular Melody`);
    ensureEffect($effect`Hulkien`);
    ensureEffect($effect`Lapdog`);

    // Plan is for these buffs to fall all the way through to item -> hot res -> fam weight.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Do I Know You From Somewhere?`);
    ensureEffect($effect`You Learned Something Maybe!`);

    if (!haveEffect($effect`Holiday Yoked`)) {
        adventureWithCarolGhost($effect`Holiday Yoked`);
    }
}

function doFreeFights() {
    if (get('_neverendingPartyFreeTurns') === 10) return;

    outfit('hccs_freefights');

    useFamiliar($familiar`Hovering Sombrero`);
    equip($slot`familiar`, $item`miniature crystal ball`);

    upkeepHpAndMp();

    ensureEffect($effect`Blessing of your favorite Bird`); // Should be 75% myst for now.
    ensureEffect($effect`Song of Bravado`);
    ensureSong($effect`Polka of Plenty`);
    ensureEffect($effect`Big`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Blood Bubble`);
    ensureEffect($effect`Drescher's Annoying Noise`);
    ensureEffect($effect`Elemental Saucesphere`);
    // ensureEffect($effect`Empathy`);
    ensureEffect($effect`Inscrutable Gaze`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Pride of the Puffin`);
    ensureEffect($effect`Singer's Faithful Ocelot`);
    haveSkill($skill`Stevedave's Shanty of Superiority`) &&
        ensureEffect($effect`Stevedave's Shanty of Superiority`);
    ensureEffect($effect`Ur-Kel's Aria of Annoyance`);
    ensureEffect($effect`Feeling Excited`);

    // kill the mushroom and chew mushroom tea
    if (!get('_mushroomGardenVisited')) {
        equip($item`familiar scrapbook`); // don't try to find kramco here
        Macro.skill($skill`Barrage of Tears`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucestorm`)
            .repeat()
            .setAutoAttack();
        adv1($location`Your Mushroom Garden`);
        adv1($location`Your Mushroom Garden`);
        use($item`free-range mushroom`);
        outfit('hccs_freefights');
    }

    if (!haveEffect($effect`Mush-Maw`)) {
        ensureCreateItem(1, $item`mushroom tea`);
        chew($item`mushroom tea`); // get Mush-Maw (+20 ML), 1 spleen
    }

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

    Macro.trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`Saucestorm`).setAutoAttack();

    while (get('_neverendingPartyFreeTurns') < 10) {
        upkeepHpAndMp();
        adv1($location`The Neverending Party`);
    }

    // kill a Kramco to prep the back-up camera
    // if (sausageFightGuaranteed()) {
    //     upkeepHpAndMp();
    //     equip($item`Kramco Sausage-o-Matic™`);
    //     Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
    //         .skill($skill`Barrage of Tears`)
    //         .skill($skill`Spittoon Monsoon`)
    //         .skill($skill`Saucestorm`).setAutoAttack();
    //     adv1($location`Noob Cave`);
    // }

    // 10x back-up sausage fight @ The Dire Warren with Sombrero
    // Macro.skill($skill`back-up to your last enemy`)
    //     .if_('!monstername "sausage goblin"', new Macro().step('abort'))
    //     .trySkill($skill`Feel Pride`)
    //     .skill($skill`Barrage of Tears`)
    //     .skill($skill`Spittoon Monsoon`)
    //     .skill($skill`saucestorm`).setAutoAttack();
    //
    // while (get('_backUpUses') < 10) {
    //     upkeepHpAndMp();
    //     adv1($location`The Dire Warren`, -1, '');
    // }

    restoreHp(myMaxhp());

    cliExecute('fold wad of used tape'); // for stat and item tests
}

function doHpTest() {
    ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);
    cliExecute('retrocape muscle');

    // QUEST - Donate Blood (HP)
    if (myMaxhp() - myBuffedstat($stat`muscle`) - 3 < 1770) {
        useSkill(1, $skill`Chubby and Plump`);
        use($item`Chubby and Plump bar`);
    }
}

function doMoxTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Penne Dreadful`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    // Sauceror has 75% moxie bird
    ensureEffect($effect`Blessing of the Bird`);
    ensureEffect($effect`Big`);
    ensureEffect($effect`Song of Bravado`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    ensureSong($effect`The Moxious Madrigal`);
    // ensureEffect($effect`Quiet Desperation`);
    // ensureEffect($effect`Disco Fever`);
    // ensureEffect($effect`Mariachi Mood`);
    cliExecute('retrocape moxie');

    if (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`) < 1770) {
        useSkill(1, $skill`Acquire Rhinestones`);
        use(availableAmount($item`rhinestone`), $item`rhinestone`);
    }
}

function doMusTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Undead Elbow Macaroni`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    ensureEffect($effect`Big`);
    ensureEffect($effect`Song of Bravado`);
    ensureEffect($effect`Rage of the Reindeer`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    // ensureSong($effect`Power Ballad of the Arrowsmith`);
    // ensureEffect($effect`Quiet Determination`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    // cliExecute('retrocape muscle');
}

function doItemTest() {
    ensureItem(1, $item`oversized sparkler`);

    // Create CER pizza
    if (!haveEffect($effect`Certainty`)) {
        useFamiliar($familiar`Exotic Parrot`);
        if (!have($item`runproof mascara`)) ensureSewerItem(1, $item`ravioli hat`);
        eatPizza(
            have($item`cosmetic football`) ? $item`cosmetic football` : $item`coconut shell`,
            $item`ear candle`,
            have($item`runproof mascara`) ? $item`runproof mascara` : $item`ravioli hat`,
            $item`blood-faced volleyball` // get that cracker
        );

        ensureItem(1, $item`cracker`);
        equip($slot`familiar`, $item`cracker`);
    }

    // cyclops eyedrops
    if (!haveEffect($effect`One Very Clear Eye`)) {
        cliExecute('pillkeeper semirare');
        adv1($location`The Limerick Dungeon`);
        use($item`cyclops eyedrops`);
    }

    !get('_clanFortuneBuffUsed') && cliExecute('fortune buff item');
    !haveEffect($effect`Infernal Thirst`) && cliExecute('genie effect Infernal Thirst');
    // !haveEffect($effect`Lantern-Charged`) && use($item`battery (lantern)`);
    ensureEffect($effect`Singer's Faithful Ocelot`);
    ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
    ensureEffect($effect`The Spirit of Taking`);
    ensureEffect($effect`Steely-Eyed Squint`);
    ensureEffect($effect`Blessing of the Bird`);
    ensureEffect($effect`Nearly All-Natural`); // bag of grain
    ensureEffect($effect`El Aroma de Salsa`); // Salsa Caliente™ candle
}

function doFamiliarTest() {
    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);

    // These should have fallen through all the way from leveling.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    // ensureEffect($effect`Empathy`);

    equip($item`Fourth of May Cosplay Saber`);

    if (!have($effect`Meteor Showered`)) {
        Macro.skill($skill`Meteor Shower`).skill($skill`Use the Force`).setAutoAttack();
        adv1($location`The Dire Warren`);
        if (handlingChoice()) runChoice(3);
    }
}

function doWeaponTest() {
    ensureMeteorShowerAndCarolGhostEffect();
    ensureDeepDarkVisions(); // do this for spell test before getting cowrrupted

    if (!haveEffect($effect`Cowrruption`)) {
        wishEffect($effect`Cowrruption`);
    }

    // OU pizza (pulverize sweatpants for useless powder)
    if (!haveEffect($effect`Outer Wolf™`)) {
        ensureItem(1, $item`tenderizing hammer`);
        !have($item`useless powder`) && cliExecute('pulverize old sweatpants');
        eatPizza(
            $item`oil of expertise`,
            $item`useless powder`,
            $item`mushroom filet`,
            $item`mushroom filet`
        );
    }

    if (!haveEffect($effect`In a Lather`) && myMeat() >= 500) {
        useSkill($skill`The Ode to Booze`);
        cliExecute('drink Sockdollager');
    }

    if (availableAmount($item`twinkly nuggets`) > 0) {
        ensureEffect($effect`Twinkly Weapon`);
    }

    ensureEffect($effect`Carol of the Bulls`);
    ensureEffect($effect`Song of the North`);
    ensureEffect($effect`Rage of the Reindeer`);
    ensureEffect($effect`Frenzied, Bloody`);
    ensureEffect($effect`Scowl of the Auk`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    // ensureEffect($effect`Tenacity of the Snapper`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Lack of Body-Building`);
    ensureEffect($effect`Bow-Legged Swagger`);

    if (have($item`Punching Potion`)) {
        ensurePotionEffect($effect`Feeling Punchy`, $item`Punching Potion`);
    }
    if (!haveEffect($effect`Rictus of Yeg`)) {
        cliExecute('cargo pick 284');
        use($item`Yeg's Motel toothbrush`);
    }

    // Tea party
    if (!get('_madTeaParty')) {
        ensureItem(1, $item`goofily-plumed helmet`);
        ensureEffect($effect`Weapon of Mass Destruction`);
    }

    cliExecute('boombox fists');
    cliExecute('fold broken champagne bottle');
}

function doSpellTest() {
    ensureDeepDarkVisions(); // should already have this from weapon test

    if (get('_poolGames') < 3) {
        ensureEffect($effect`Mental A-cue-ity`);
    }

    // Tea party
    if (!get('_madTeaParty')) {
        ensureSewerItem(1, $item`mariachi hat`);
        ensureEffect($effect`Full Bottle in front of Me`);
    }

    useSkill(1, $skill`Spirit of Cayenne`);
    ensureEffect($effect`Elemental Saucesphere`);
    // ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`We're All Made of Starfish`);
    ensureEffect($effect`Simmering`);
    ensureEffect($effect`Song of Sauce`);
    // ensureEffect($effect`AAA-Charged`);
    ensureEffect($effect`Carol of the Hells`);
    // ensureEffect($effect`Arched Eyebrow of the Archmage`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);

    ensureMeteorShowerAndCarolGhostEffect();

    outfit('hccs_SPELL');
    if (Math.round(numericModifier('spell damage percent')) % 50 >= 40) {
        ensureItem(1, $item`soda water`);
        ensurePotionEffect($effect`Concentration`, $item`cordial of concentration`);
    }
}

function doHotResTest() {
    if (!have($effect`Fireproof Foam Suit`)) { // eslint-disable-line
        // Get Fireproof Foam Suit
        Macro.skill($skill`Fire Extinguisher: Foam Yourself`) // eslint-disable-line
            .skill($skill`Use the Force`).setAutoAttack();
        equip($slot`weapon`, $item`industrial fire extinguisher`); // eslint-disable-line
        equip($slot`off-hand`, $item`Fourth of May Cosplay Saber`);
        adv1($location`Noob Cave`);
        if (!have($effect`Fireproof Foam Suit`)) throw `Error, not foamy enough`; // eslint-disable-line
    }

    ensureEffect($effect`Elemental Saucesphere`);
    // ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    // ensureEffect($effect`Empathy`);
    ensureEffect($effect`Feeling Peaceful`);

    // ensurePullEffect($effect`Fireproof Lips`, $item`SPF 451 lip balm`);
    ensureEffect($effect`Hot-Headed`);
    use($item`pocket maze`);
    ensureEffect($effect`Rainbowolin`);

    cliExecute('retrocape vampire hold');
}

function doNonCombatTest() {
    useFamiliar($familiar`Disgeist`);

    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    // ensureEffect($effect`Empathy`);

    ensureEffect($effect`The Sonata of Sneakiness`);
    ensureEffect($effect`Smooth Movements`);
    if (get('_powerfulGloveBatteryPowerUsed') <= 95) ensureEffect($effect`Invisible Avatar`);
    ensureEffect($effect`Feeling Lonely`);
    ensureEffect($effect`A Rose by Any Other Material`);
    ensureEffect($effect`Throwing Some Shade`);

    wishEffect($effect`Disquiet Riot`);

    // cliExecute('acquire porkpie-mounted popper');
    // equip($item`porkpie-mounted popper`);
    equip($item`fish hatchet`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);
}

const statDiff = (stat: Stat) => Math.floor((myBuffedstat(stat) - myBasestat(stat)) / 30)

const tests: TestObject[] = [
    {
        id: Test.HP,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - Math.floor((myMaxhp() - myBuffedstat($stat`muscle`) - 3) / 30),
        doTestPrep: doHpTest
    }, {
        id: Test.MYS,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`mysticality`),
        doTestPrep: () => { return }
    }, {
        id: Test.MUS,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`muscle`),
        doTestPrep: doMusTest
    }, {
        id: Test.MOX,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`moxie`),
        doTestPrep: doMoxTest
    }, {
        id: Test.ITEM,
        spreadsheetTurns: 8, //1,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('item drop') / 30 + 0.001) -
            Math.floor(numericModifier('booze drop') / 15 + 0.001),
        doTestPrep: doItemTest
    }, {
        id: Test.HOT_RES,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - numericModifier('hot resistance'),
        doTestPrep: doHotResTest
    }, {
        id: Test.FAMILIAR,
        spreadsheetTurns: 39,
        getPredictedTurns: () => 60 - Math.floor((familiarWeight(myFamiliar()) + weightAdjustment()) / 5),
        doTestPrep: doFamiliarTest
    }, {
        id: Test.WEAPON,
        spreadsheetTurns: 2,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('weapon damage') / 25 + 0.001) -
            Math.floor(numericModifier('weapon damage percent') / 25 + 0.001),
        doTestPrep: doWeaponTest
    }, {
        id: Test.SPELL,
        spreadsheetTurns: 38, //35,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('spell damage') / 50 + 0.001) -
            Math.floor(numericModifier('spell damage percent') / 50 + 0.001),
        doTestPrep: doSpellTest
    }, {
        id: Test.NONCOMBAT,
        spreadsheetTurns: 3, //1,
        getPredictedTurns: () => 60 + (20 + numericModifier('combat rate')) * 3,
        doTestPrep: doNonCombatTest
    }, {
        id: Test.COIL_WIRE,
        spreadsheetTurns: 60,
        getPredictedTurns: () => 60,
        doTestPrep: () => { return }
    }];

const printTime = () => {
    const totalSeconds = (gametimeToInt() - getPropertyInt('bb_ScriptStartCS')) / 1000;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    print(`Total seconds for sanity check: ${totalSeconds}`);
    print(`That only took ${min}:${sec.toFixed(2)} and ${myTurncount()} turns!`, 'green');
    print(`Organ use: ${myFullness()}/${myInebriety()}/${mySpleenUse()}`, 'green');
    for (let i = 1; i <= 10; i++) {
        const spreadsheetTurns = tests.find((test) => test.id === i) ?.spreadsheetTurns || 60;
        print(
            `Test ${Test[i].padEnd(9)} estimated: ${get(`_hccsTestExpected${i}`).toString().padStart(2)} actual: ${get(`_hccsTestActual${i}`).toString().padStart(2)} spreadsheet: ${spreadsheetTurns.toString().padStart(2)}`,
            'blue'
        );
    }
}

const endRunAndStartAftercore = () => {
    clickTestButton(Test.DONATE);
    set('hpAutoRecovery', .8);

    cliExecute('mood default');
    cliExecute('ccs default');
    cliExecute('boombox food');
    cliExecute('refresh all');

    // Tune moon sign to Wombat (for meat farming).
    if (!get('moonTuned')) {
        // Unequip spoon.
        equip($slot`acc1`, $item`Retrospecs`);
        equip($slot`acc2`, $item`Powerful Glove`);
        equip($slot`acc3`, $item`Lil' Doctor™ bag`);

        // Actually tune the moon.
        visitUrl('inv_use.php?whichitem=10254&doit=96&whichsign=7');
    }

    $items`blood-drive sticker`.forEach((item) =>
        putShop(shopPrice(item), 0, 1, item)
    )

    cliExecute('hagnk all');
    cliExecute('acquire bitchin meatcar');
    buy($item`clockwork maid`, 1, 3500);
    use($item`clockwork maid`);
    set('_hccsMinRealTime', false);
    visitUrl('peevpee.php?action=smashstone&confirm=on');

    // Create a key lime pie
    const keyIndex = Math.floor(Math.random() * 3) + 1;
    setChoice(1414, keyIndex);
    useSkill($skill`Lock Picking`);
    create($items`Boris's key lime pie, Jarlsberg's key lime pie, Sneaky Pete's key lime pie`[keyIndex - 1]);

    cliExecute('bb_login');
}

export function main(input: string): void {
    setAutoAttack(0);

    set('_hccsMinRealTime', Boolean(input && input.match(/fast/)));

    setup();
    getPizzaIngredients();

    runTest(Test.COIL_WIRE);

    useStatGains();
    buffBeforeGoblins();
    doFreeFights();

    runTest(Test.MYS);
    runTest(Test.HP);
    runTest(Test.MUS);
    runTest(Test.MOX);

    if (availableAmount($item`astral six-pack`) === 1) {
        tryUse(1, $item`astral six-pack`);
        useSkill(2, $skill`The Ode to Booze`);
        drink(6, $item`astral pilsner`);
    }

    runTest(Test.ITEM);
    runTest(Test.HOT_RES);
    runTest(Test.FAMILIAR);
    runTest(Test.WEAPON);
    runTest(Test.SPELL);
    runTest(Test.NONCOMBAT);

    printTime();
    endRunAndStartAftercore();
}
