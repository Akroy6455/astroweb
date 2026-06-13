import React from 'react';

interface Props {
  data: any;
}

export default function AwasthaResults({ data }: Props) {
  if (!data || !data.awasthas || !data.positions || !data.yogaState) return null;

  const getPlanetPos = (name: string) => data.positions.find((p: any) => p.name === name);
  const getHouse = (name: string) => data.yogaState.planets[name]?.house;
  
  const sunPos = getPlanetPos('Sun');
  const moonPos = getPlanetPos('Moon');

  // Helper functions
  const isConjunct = (p1: string, p2: string) => {
    const pos1 = getPlanetPos(p1);
    const pos2 = getPlanetPos(p2);
    return pos1 && pos2 && pos1.rasi.index === pos2.rasi.index;
  };

  const getSign = (planet: string) => {
    const pos = getPlanetPos(planet);
    return pos ? pos.rasi.index : -1;
  };

  const isExalted = (planet: string) => {
    const sign = getSign(planet);
    const EXALTATION: Record<string, number> = {
      Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6
    };
    return sign !== -1 && EXALTATION[planet] === sign;
  };

  const isOwnSign = (planet: string) => {
    const sign = getSign(planet);
    const RULERS: Record<number, string> = {
      0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
      6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
    };
    return sign !== -1 && RULERS[sign] === planet;
  };

  const isFriendlySign = (planet: string) => {
    const sign = getSign(planet);
    const RULERS: Record<number, string> = {
      0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
      6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
    };
    const ruler = RULERS[sign];
    if (ruler === planet) return false;

    const FRIENDS: Record<string, string[]> = {
      Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
      Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'],
      Saturn: ['Mercury', 'Venus'], Rahu: ['Jupiter', 'Venus', 'Saturn'], Ketu: ['Mars', 'Venus', 'Saturn']
    };
    return FRIENDS[planet]?.includes(ruler);
  };

  const isMaleficSign = (planet: string) => {
    const sign = getSign(planet);
    // Malefic ruled signs: Aries (0), Scorpio (7) - Mars; Capricorn (9), Aquarius (10) - Saturn; Leo (4) - Sun
    return [0, 4, 7, 9, 10].includes(sign);
  };

  let moonPhase = 'Waxing';
  if (sunPos && moonPos) {
    const diff = (moonPos.lon - sunPos.lon + 360) % 360;
    if (diff > 180) {
      moonPhase = 'Waning';
    }
  }

  const renderPlanetResult = (planet: string) => {
    const awasthaObj = data.awasthas[planet];
    if (!awasthaObj || !awasthaObj.sayanadi) return null;

    const awastha = awasthaObj.sayanadi;
    const cleanAwastha = awastha.toLowerCase().trim();
    const house = getHouse(planet);
    const sign = getSign(planet);
    let result = '';
    let extraContext = '';

    if (planet === 'Sun') {
      if (cleanAwastha.includes('sayana')) result = "The native will incur digestive deficiency, many diseases, stoutness of legs, bilious vitiation, ulcer in the anus, and heart strokes.";
      else if (cleanAwastha.includes('upaves')) result = "The native will suffer poverty, will carry loads, will indulge in litigations, be hard-hearted, wicked, and will lose in his undertakings.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will always be happy, wise, helpful to others, endowed with prowess and wealth, very happy, and will gain royal favors.";
      else if (cleanAwastha.includes('prakash')) result = "The native will be liberal in disposition, will have plenty of wealth, be a significant speaker in the assembly, will perform many meritorious acts, be greatly strong, and be endowed with charming beauty.";
      else if (cleanAwastha.includes('gaman')) result = "The native will be disposed to live in foreign places, be miserable, indolent, bereft of intelligence and wealth, be distressed due to fear, and be short-tempered.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will be interested in other's wives, be devoid of his own men, be interested in movements, skillful in doing evil deeds, be dirty, ill disposed, and be a tale-bearer.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will be distressed due to enemies, fickle-minded, evil-minded, emaciated, devoid of virtuous acts, and intoxicated with pride.";
      }
      else if (cleanAwastha.includes('sabha')) result = "The native will be disposed to help others, be always endowed with wealth and gems, be virtuous, endowed with lands, new houses and robes, be very strong, very affectionate to his friends, and be very kindly disposed.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will experience pains in joints, will lose money on account of others' females, will have strength declining off and on, be untruthful, will incur headaches, will eat remnant food, and will take to bad ways.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will be honored by the learned, be himself a scholar, will have knowledge of poetry, etc, and be adored by kings on the earth.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will always be happy, be endowed with spiritual knowledge, will perform sacrificial rites, will move amid kings, will have fear from enemies, be charming faced, and be endowed with knowledge of poetry.";
      else if (cleanAwastha.includes('nidra')) result = "The native will possess eyes laden with sleepiness (i. e. always drowsy), will live in foreign (or distant) places, will incur harm to wife, and will face financial destruction.";
    } 
    else if (planet === 'Moon') {
      extraContext = `(${moonPhase} Moon)`;
      if (cleanAwastha.includes('sayana')) result = "The native will be honorable, sluggish, given to sexual lust, and will face financial destruction.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be troubled by diseases, be dull-witted, be not endowed with mentionable wealth (i. e. will have only negligible wealth), be heard-hearted, will do unworthy acts, and will steal others' wealth.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will be troubled by great diseases (long lasting in nature), be very garrulous, wicked, and will indulge in bad deeds.";
      else if (cleanAwastha.includes('prakash')) result = "The native will be famous in the world, will have his virtues exposed through royal patronage, be surrounded by horses, elephants, females, and ornaments, and will visit shrines.";
      else if (cleanAwastha.includes('gaman')) result = moonPhase === 'Waxing' ? "The native will be distressed due to fear." : "The native will be sinful, cruel and always troubled by afflictions of sight.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will be honorable, will suffer diseases of feet, will secretly indulge in sinful acts, be poor and devoid of intelligence and happiness.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "No explicit effects mentioned in the translation.";
      }
      else if (cleanAwastha.includes('sabha')) result = "The native will be eminent among men, honored by kings, and kings of kings, be very beautiful, will subdue the passion of women, be skillful in sexual acts, and be virtuous.";
      else if (cleanAwastha.includes('bhojana')) result = moonPhase === 'Waxing' ? "The native will be endowed with honor, conveyances, attendants, social status, wife and daughters." : "These auspicious effects will fail to come.";
      else if (cleanAwastha.includes('nrityalipsa')) result = moonPhase === 'Waxing' ? "The native will be strong, will have knowledge of songs and be a critic of beauty of things." : "The person will be sinful.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will atain kingship, lordship over wealth, and skill in sexual acts and in sporting with harlots.";
      else if (cleanAwastha.includes('nidra')) result = isConjunct('Moon', 'Jupiter') ? "The native will be quite eminent." : "The native will be quite eminent. However, devoid of Jupiter's conjunction, the native will lose his wealth on account of females, and female jackals will be crying around his abode (as though it were a cemetery).";
    }
    else if (planet === 'Mars') {
      if (cleanAwastha.includes('sayana')) result = "The native will be troubled by wounds, itch and ulcer.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be strong, sinful, untruthful, eminent, wealthy, and bereft of virtues.";
      else if (cleanAwastha.includes('netrapani')) result = "Generally brings penury, but in favorable houses, this state will confer rulership of a city.";
      else if (cleanAwastha.includes('prakash')) {
        if (house === 5) result = "The native will shine with virtues and will be honored by the king. However, Mars in the 5th house will cause loss of children and of wife.";
        else result = "The native will shine with virtues and will be honored by the king.";
        if (isConjunct('Mars', 'Rahu')) result += " Since Mars is conjunct Rahu, a severe (positional) fall will descend on the native.";
      }
      else if (cleanAwastha.includes('gaman')) result = "The native will be always roaming, will have fear of multiple ulcers, will incur misunderstandings with females, will be afflicted with boils, itches etc. , and will incur financial decline.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will be virtuous, endowed with precious gems, will adore a sharp sword, will walk with the (majestic) gait of an elephant (imparting surprise in the onlooker), will destroy his enemies, and will remove the miseries of his people.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will be devoid of virtues and good deeds, will be distressed by diseases, will acquire diseases of the foot of the ears and severe gout pains, be timid, and will befriend evil lot.";
      }
      else if (cleanAwastha.includes('sabha')) {
        if (isExalted('Mars')) result = "The native will be skillful in conducting wars, will hold the flag of righteousness aloft and be wealthy.";
        else if (house === 5 || house === 9) result = "The native will be bereft of learning.";
        else if (house === 12) result = "Childlessness and no wife and no friends will result.";
        else result = "The native will be a scholar in a king's court, be very wealthy, honorable, and charitable.";
      }
      else if (cleanAwastha.includes('bhojana')) result = "The native will eat sweet food, and if be devoid of strength, the native will indulge in base acts and be dishonorable.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will earn wealth through king and will be endowed with fullness of gold, diamonds and corals in his house.";
      else if (cleanAwastha.includes('kautuka')) result = isExalted('Mars') ? "The native will be curious in disposition and be endowed with friends and sons. Since Mars is exalted, the native will be honored by the king and be himself virtuous." : "The native will be curious in disposition and be endowed with friends and sons.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be short-tempered, devoid of intelligence and wealth, be wicked, fallen from virtuous path, and troubled by diseases.";
    }
    else if (planet === 'Mercury') {
      if (cleanAwastha.includes('sayana')) result = house === 1 ? "The native will be lame and will have reddish eyes." : "The native will be addicted to licentious pleasures and be wicked.";
      else if (cleanAwastha.includes('upaves')) result = house === 1 ? "In the ascendant, the native will possess the seven principle virtues. If aspected by or conjunct malefics, penury will result and if by benefics financial happiness will follow." : "If aspected by or conjunct malefics, penury will result and if by benefics financial happiness will follow.";
      else if (cleanAwastha.includes('netrapani')) result = house === 5 ? "The native will be bereft of happiness from wife and son, be endowed with (more) female children, and will gain abundant finance through royal patronage." : "The native will be devoid of learning, wisdom, wellwishers, and satisfaction but be honorable.";
      else if (cleanAwastha.includes('prakash')) result = "The native will be charitable, merciful, meritorious, will cross the boundaries of ocean in respect of many branches of learning, be endowed with great faculty of discrimination, and will destroy evil people.";
      else if (cleanAwastha.includes('gaman')) result = "The native will visit the court of kings on many occaisions and Goddess Lakshmi (denoting wealth) will dwell in his abode.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The same effects due to his being in Gamanavastha will fructify: The native will visit the court of kings on many occaisions and Goddess Lakshmi will dwell in his abode.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will serve base men and gain wealth thereby and will have two sons and one fame-bringing daughter.";
      }
      else if (cleanAwastha.includes('sabha')) result = isExalted('Mercury') ? "The native will be affluent and meritorious at all times, be equal to Kubera (the lord of wealth), or be a king or a minister, be devoted to Lord Vishnu and Lord Siva, be virtuous, and will attain final emancipation." : "The native will be affluent and meritorious at all times.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will face financial losses through litigations, will physically lose on account of fear from king (i. e will become thin due to royal wrath), fickle-minded, and will be bereft of physical and conjugal felicity.";
      else if (cleanAwastha.includes('nrityalipsa')) {
        result = "The native will be endowed with honor, conveyances, corals, sons, friends, prowess, and recognition in assembly due to his scholarship.";
        if (isMaleficSign('Mercury')) result += " Since Mercury is in a malefic's sign the native will be addicted to prostitutes and will long for licentious pleasures.";
      }
      else if (cleanAwastha.includes('kautuka')) {
        if (house === 1) result = "The native will be skillful in music.";
        else if (house === 7 || house === 8) result = "The native will be addicted to courtezans.";
        else if (house === 9) result = "The native will be meritorious and attain heavens after death.";
        else result = "The native will be skillful in music or addicted to pleasures depending on the house.";
      }
      else if (cleanAwastha.includes('nidra')) result = "The native will not enjoy comfortable sleep, be afflicted by neck or neck joint diseases, be devoid of coborn, afflicted by miseries galore, will enter into litigations with his own men, will lose wealth and honor.";
    }
    else if (planet === 'Jupiter') {
      if (cleanAwastha.includes('sayana')) result = "The native will be strong but will speak in whispers, be very tawny in complexion, will have prominent cheeks, and will have fear from enemies.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be garrulous, very proud, be troubles by king and enemies, and will have ulcers on feet, shanks, face and hands.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will be afflicted by diseases, devoid of wealth, be fond of music and dances, libidinous, tawny in complexion, and be attached to other castemen.";
      else if (cleanAwastha.includes('prakash')) result = isExalted('Jupiter') ? "The native will attain greatness among men, be equal to Kubera - the lord of wealth." : "The native will enjoy virtues, be happy, splendorous, and will visit places holy to Lord Krishna.";
      else if (cleanAwastha.includes('gaman')) result = "The native will be adventurous, be happy on account of friends, scholarly, and endowed with various kinds of wealth and with Vedic learning.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "Serving force, excellent women, and the goddess of wealth will never leave the native's abode.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will be endowed with various conveyances, honors, retinue, children, wife, friends, and learning, be equal to a king, extremely noble, fond of literature, and will take to virtuous path.";
      }
      else if (cleanAwastha.includes('sabha')) result = "The native will attain comparability with Jupiter (the God of speech) in the matter of speech, be endowed with superior corals, rubies, and wealth, be rich with elephants, horses and chariots, and will be supremely learned.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will always beget excellent food and horses, elephants and chariots while Lakshmi, the goddess of Lucre, will never leave his house.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will receive royal honors, be wealthy, endowed with knowledge or moral law and Tantra, be supreme among the learned , and be a great grammarian.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will be curious in disposition, very rich, will shine like the Sun in his circles, be exceedingly kind, be happy, honored by the kings, endowed with sons, wealth and just disposition, be very strong, and be a scholar in the the king's court.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be foolish in all his undertakings, will suffer irredeemable penury, and will be devoid of righteous acts.";
    }
    else if (planet === 'Venus') {
      if (cleanAwastha.includes('sayana')) result = "The native , although strong, will incur dental diseases, be very short-tempered, bereft of wealth, will seek union with courtezans, and be licentious.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be endowed with multitude of nine gems and golden ornaments, be ever happy, will destroy enemies, be honored by the king, and will have highly increased honors.";
      else if (cleanAwastha.includes('netrapani')) result = [1, 7, 10].includes(house) ? "There will be loss of wealth on account of sight afflictions." : "There will be large houses owned by the native.";
      else if (cleanAwastha.includes('prakash')) {
        result = "The native will sport like a lofty elephant, be equal to a king, and be skillful in poetry and music.";
        if (isOwnSign('Venus') || isExalted('Venus') || isFriendlySign('Venus')) {
          result = "Since Venus is in own/exaltation/friendly sign, the native will sport like a lofty elephant, be equal to a king, and be skillful in poetry and music.";
        }
      }
      else if (cleanAwastha.includes('gaman')) result = "The native will not have a long living mother, will lament over separation from his own people, and will have fear from enemies.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will command abundant wealth, will undertake to visit superior shrines, be ever enthusiastic, and will contract diseases of hand and foot.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "There will be no advent of wealth but troubles from enemies, separation from children and relatives, diseases and lack of pleasures from the wife.";
      }
      else if (cleanAwastha.includes('sabha')) result = "The native will earn eminence in the king's court, be very virtuous, will destroy enemies, be equal to Kubera in wealth, charitable, will ride on horses, and will be excellent among men.";
      else if (cleanAwastha.includes('bhojana')) result = (sign === 5) ? "Since placed in Virgo, the native will be very rich and will be honored by scholars." : "The native will be distressed due to hunger, diseases and many kinds of fear from enemies.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will be skillful in literature, intelligent, will play musical instruments like lute, taber etc. , be meritorious and very affluent.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will be equal to Lord Indra, will attain greatness in the assembly, be learned and will have Lakshmi always dweeling in his abode.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be interested in serving others, will blame others, be heroic, garrulous, and wandering all over the earth.";
    }
    else if (planet === 'Saturn') {
      if (cleanAwastha.includes('sayana')) result = "The native will be troubled by hunger and thirst, will incur diseases in boyhood and later on will become wealthy.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be trouble greatly by enemies, will contract dangers, will have ulcers all over the body, be self-respected, and punished by the king.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will be endowed with a charming female, wealth, royal favor and friends, will have knowledge of many arts, and be an eloquent speaker.";
      else if (cleanAwastha.includes('prakash')) result = "The native will be very virtuous, very wealthy, intelligent, sportive, splendorous, merciful, and devoted to Lord Siva.";
      else if (cleanAwastha.includes('gaman')) result = "The native will be very rich, endowed with sons; will grab enemy's lands, and be a scholar at royal court.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will be akin to a donkey (i. e. foolish), bereft of happiness from wife and children, will always roam pitiably without anybody's patronage.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will incur diseases, and will not be skillful in earning royal patronage.";
      }
      else if (cleanAwastha.includes('sabha')) result = "The native will have suprising (i. e. great) possessions of abundant precious stones and gold, be endowed with great judicial (or political) knowledge, and be extremely brilliant.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will enjoy tastes of food, be weak-sighted and be fickle-minded due to mental delusion.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will be righteous, extremely opulent, honored by the king, brave, and be heroic in warfield.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will be endowed with lands and wealth, be happy, endowed with pleasures through charming females, and learned in poetry, arts, etc.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be rich, endowed with charming virtues, valorous, will destroy even fierce enemies, and be skillful in seeking pleasures through harlots.";
    }
    else if (planet === 'Rahu') {
      if (cleanAwastha.includes('sayana')) result = [1, 2, 5, 0].includes(sign) ? "Since Rahu is in Taurus, Gemini, Virgo, or Aries, the native will be endowed with wealth and grains." : "The native will experience miseries galore.";
      else if (cleanAwastha.includes('upaves')) result = "The native will be distressed due to ulcers, be endowed with royal association, highly honorable, and ever devoid of financial happiness.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will be troubled by eye diseases, will have fear from wicked people, snakes, and thieves, and will incur financial decline.";
      else if (cleanAwastha.includes('prakash')) result = "The native will acquire a high position, will perform auspicious acts, will obtain elevation of financial state, be highly virtuous, be a chief in the king's court, be charming like freshly formed clouds, and be very prosperous in foreign places.";
      else if (cleanAwastha.includes('gaman')) result = "The native will be endowed with numerous children, be scholarly, wealthy, charitable, and honored by the king.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will be always mentally distressed, will have fear from enemies and litigations with enemies, be bereft of his own men, will face financial destruction, and be crafty and emaciated.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "No explicit effects mentioned in the translation.";
      }
      else if (cleanAwastha.includes('sabha')) result = "No explicit effects mentioned in the translation.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will be distressed without food, dull-witted, be not bold in his acts, and be bereft of conjugal and progenic happiness.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will contract a great and unsubduing disease, will have afflicted eyes and fear from enemies, and will decline financially and righteously.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will be devoid of a position (or a place), be interested in others' females, and will steal others' wealth.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be a repository of virtues, be endowed with wife and children, bold, proud, and very affluent.";
    }
    else if (planet === 'Ketu') {
      if (cleanAwastha.includes('sayana')) result = [0, 1, 2, 5].includes(sign) ? "There will be plenty of wealth." : "Increased diseases will follow.";
      else if (cleanAwastha.includes('upaves')) result = "The native will suffer from ulcers and will have fear from enemies, windy diseases, snakes, and thieves.";
      else if (cleanAwastha.includes('netrapani')) result = "The native will contact eye diseases, and will have fear from wicked people, snakes, enemies and people of royal family.";
      else if (cleanAwastha.includes('prakash')) result = "The native will be wealthy, righteous, will live in foreign places, be enthusiastic and genuine, and will serve the king.";
      else if (cleanAwastha.includes('gaman')) result = "The native will be endowed with many sons, abundant wealth, be scholarly, virtuous, charitable, and be excellent among men.";
      else if (cleanAwastha.includes('agmana') || (cleanAwastha.includes('agama') && !cleanAwastha.includes('agmana'))) {
        if (cleanAwastha === 'agmana' || cleanAwastha === 'aagamana') result = "The native will incur many disease, will face loss of wealth, will hurt (others) with his teeth, be a talebearer, and will blame others.";
        else if (cleanAwastha === 'agama' || cleanAwastha === 'aagama') result = "The native will be a notorious sinner, will enter in to litigations with his relatives, be wicked and troubled by diseases and enemies.";
      }
      else if (cleanAwastha.includes('sabha')) result = "No explicit effects mentioned in the translation.";
      else if (cleanAwastha.includes('bhojana')) result = "The native will always be distressed with hunger, penury and diseases, and will roam all over the earth.";
      else if (cleanAwastha.includes('nrityalipsa')) result = "The native will be distressed due to diseases, will have a floral mark on the the eye, be impertinent, wicked, and will plan evils.";
      else if (cleanAwastha.includes('kautuka')) result = "The native will seek union with dancing females (i. e. prostitutes), will suffer positional displacement, will take to evil paths, and will roam all over.";
      else if (cleanAwastha.includes('nidra')) result = "The native will be endowed with wealth and corns, be virtuous, and will spend his time sportively.";
    }

    if (!result || result.includes("No explicit effects")) return null;

    return (
      <div key={planet} style={{ marginBottom: '1.5rem', textAlign: 'left', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.2rem' }}>{planet} ({awastha})</h4>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--foreground)' }}>{result}</p>
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {extraContext && `${extraContext} `}({planet} is in House {house})
        </div>
      </div>
    );
  };

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return (
    <div style={{ width: '100%', padding: '2rem 1rem' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
        <strong>Disclaimer:</strong> The results maybe too extreme and depends on various other factors.
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.8rem', color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>BPHS</h3>
        <h4 style={{ fontSize: '1.3rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Awasthas</h4>
      </div>

      <h5 style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Results</h5>

      {planets.map(p => renderPlanetResult(p))}
      
      {(!data.awasthas.Sun?.sayanadi && !data.awasthas.Moon?.sayanadi) && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No Awastha data available.</p>
      )}


    </div>
  );
}

