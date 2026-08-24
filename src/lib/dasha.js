"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVimshottariDasha = calculateVimshottariDasha;
exports.calculateYoginiDasha = calculateYoginiDasha;
exports.calculateJaminiCharDasha = calculateJaminiCharDasha;
exports.calculateAshtottariDasha = calculateAshtottariDasha;
exports.calculateKalachakraDasha = calculateKalachakraDasha;
var DASHA_LORDS = [
    { planet: 'Ketu', years: 7 },
    { planet: 'Venus', years: 20 },
    { planet: 'Sun', years: 6 },
    { planet: 'Moon', years: 10 },
    { planet: 'Mars', years: 7 },
    { planet: 'Rahu', years: 18 },
    { planet: 'Jupiter', years: 16 },
    { planet: 'Saturn', years: 19 },
    { planet: 'Mercury', years: 17 }
];
var TOTAL_YEARS = 120;
var DAYS_IN_YEAR = 365.2425; // Gregorian average year length
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function getLordNatalPosition(planetName, positions, houses) {
    if (!positions || !houses)
        return undefined;
    var p = positions.find(function (pos) { return pos.name === planetName; });
    if (!p)
        return undefined;
    var h = houses.find(function (house) { return house.planets.some(function (hp) { return hp.name === planetName; }); });
    return {
        rasi: p.rasi.name,
        nakshatra: p.nakshatra.name,
        house: h ? h.house : 0
    };
}
function calculateVimshottariDasha(moonLongitude, birthDate, positions, houses, offset) {
    if (offset === void 0) { offset = 0; }
    var nakshatraLength = 360 / 27; // 13.333333 degrees
    var exactNakshatra = moonLongitude / nakshatraLength;
    var nakshatraIndex = Math.floor(exactNakshatra);
    var fractionPassed = exactNakshatra - nakshatraIndex;
    var startLordIndex = (nakshatraIndex + offset) % 9;
    var firstLord = DASHA_LORDS[startLordIndex];
    // Calculate start of the theoretical full first Maha Dasha (before birth)
    var passedDays = fractionPassed * firstLord.years * DAYS_IN_YEAR;
    var fullStart = addDays(birthDate, -passedDays);
    var dashas = [];
    var mdStart = fullStart;
    for (var i = 0; i < 9; i++) {
        var mdLordIndex = (startLordIndex + i) % 9;
        var mdLord = DASHA_LORDS[mdLordIndex];
        var mdDuration = mdLord.years * DAYS_IN_YEAR;
        var mdEnd = addDays(mdStart, mdDuration);
        // Calculate Antar Dashas
        var adPeriods = [];
        var adStart = mdStart;
        for (var j = 0; j < 9; j++) {
            var adLordIndex = (mdLordIndex + j) % 9;
            var adLord = DASHA_LORDS[adLordIndex];
            var adDuration = mdDuration * (adLord.years / TOTAL_YEARS);
            var adEnd = addDays(adStart, adDuration);
            // Calculate Pratyantar Dashas
            var pdPeriods = [];
            var pdStart = adStart;
            for (var k = 0; k < 9; k++) {
                var pdLordIndex = (adLordIndex + k) % 9;
                var pdLord = DASHA_LORDS[pdLordIndex];
                var pdDuration = adDuration * (pdLord.years / TOTAL_YEARS);
                var pdEnd = addDays(pdStart, pdDuration);
                // Only keep if it ends after birth
                if (pdEnd > birthDate) {
                    pdPeriods.push({
                        planet: pdLord.planet,
                        start: (pdStart < birthDate ? birthDate : pdStart).toISOString(),
                        end: pdEnd.toISOString(),
                        lordNatalPosition: getLordNatalPosition(pdLord.planet, positions, houses)
                    });
                }
                pdStart = pdEnd;
            }
            if (adEnd > birthDate) {
                adPeriods.push({
                    planet: adLord.planet,
                    start: (adStart < birthDate ? birthDate : adStart).toISOString(),
                    end: adEnd.toISOString(),
                    subPeriods: pdPeriods,
                    lordNatalPosition: getLordNatalPosition(adLord.planet, positions, houses)
                });
            }
            adStart = adEnd;
        }
        if (mdEnd > birthDate) {
            dashas.push({
                planet: mdLord.planet,
                start: (mdStart < birthDate ? birthDate : mdStart).toISOString(),
                end: mdEnd.toISOString(),
                subPeriods: adPeriods,
                lordNatalPosition: getLordNatalPosition(mdLord.planet, positions, houses)
            });
        }
        mdStart = mdEnd;
    }
    return dashas;
}
var YOGINI_LORDS = [
    { planet: 'Mangla (Moon)', years: 1 },
    { planet: 'Pingla (Sun)', years: 2 },
    { planet: 'Dhanya (Jupiter)', years: 3 },
    { planet: 'Bhramari (Mars)', years: 4 },
    { planet: 'Bhadrika (Mercury)', years: 5 },
    { planet: 'Ulka (Saturn)', years: 6 },
    { planet: 'Siddha (Venus)', years: 7 },
    { planet: 'Sankata (Rahu)', years: 8 }
];
function calculateYoginiDasha(moonLongitude, birthDate) {
    var nakshatraLength = 360 / 27; // 13.333333 degrees
    var exactNakshatra = moonLongitude / nakshatraLength;
    var nakshatraIndex = Math.floor(exactNakshatra);
    var fractionPassed = exactNakshatra - nakshatraIndex;
    var nakNum = nakshatraIndex + 1;
    var remainder = (nakNum + 3) % 8;
    if (remainder === 0)
        remainder = 8;
    var startLordIndex = remainder - 1;
    var firstLord = YOGINI_LORDS[startLordIndex];
    var passedDays = fractionPassed * firstLord.years * DAYS_IN_YEAR;
    var fullStart = addDays(birthDate, -passedDays);
    var TOTAL_YOGINI_YEARS = 36;
    var allDashas = [];
    var currentStart = fullStart;
    for (var cycle = 0; cycle < 4; cycle++) {
        for (var i = 0; i < 8; i++) {
            var mdLordIndex = (startLordIndex + i) % 8;
            var mdLord = YOGINI_LORDS[mdLordIndex];
            var mdDuration = mdLord.years * DAYS_IN_YEAR;
            var mdEnd = addDays(currentStart, mdDuration);
            var adPeriods = [];
            var adStart = currentStart;
            for (var j = 0; j < 8; j++) {
                var adLordIndex = (mdLordIndex + j) % 8;
                var adLord = YOGINI_LORDS[adLordIndex];
                var adDuration = mdDuration * (adLord.years / TOTAL_YOGINI_YEARS);
                var adEnd = addDays(adStart, adDuration);
                var pdPeriods = [];
                var pdStart = adStart;
                for (var k = 0; k < 8; k++) {
                    var pdLordIndex = (adLordIndex + k) % 8;
                    var pdLord = YOGINI_LORDS[pdLordIndex];
                    var pdDuration = adDuration * (pdLord.years / TOTAL_YOGINI_YEARS);
                    var pdEnd = addDays(pdStart, pdDuration);
                    if (pdEnd > birthDate) {
                        pdPeriods.push({
                            planet: pdLord.planet,
                            start: (pdStart < birthDate ? birthDate : pdStart).toISOString(),
                            end: pdEnd.toISOString()
                        });
                    }
                    pdStart = pdEnd;
                }
                if (adEnd > birthDate) {
                    adPeriods.push({
                        planet: adLord.planet,
                        start: (adStart < birthDate ? birthDate : adStart).toISOString(),
                        end: adEnd.toISOString(),
                        subPeriods: pdPeriods
                    });
                }
                adStart = adEnd;
            }
            if (mdEnd > birthDate) {
                allDashas.push({
                    planet: mdLord.planet,
                    start: (currentStart < birthDate ? birthDate : currentStart).toISOString(),
                    end: mdEnd.toISOString(),
                    subPeriods: adPeriods
                });
            }
            currentStart = mdEnd;
        }
    }
    return allDashas;
}
var RASI_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
var RASI_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
var DIRECT_SIGNS = [0, 1, 2, 6, 7, 8];
function calculateJaminiCharDasha(lagnaSignIndex, positions, birthDate) {
    var dashas = [];
    var currentStart = birthDate;
    var isOdd = (lagnaSignIndex + 1) % 2 !== 0;
    var _loop_1 = function (i) {
        var rasiIndex = isOdd ? (lagnaSignIndex + i) % 12 : (lagnaSignIndex - i + 12) % 12;
        var rasiName = RASI_NAMES[rasiIndex];
        var lordName = RASI_LORDS[rasiIndex];
        var lordRasiIndex = -1;
        var lordPos = positions.find(function (p) { return p.name === lordName; });
        if (lordPos && lordPos.rasi) {
            lordRasiIndex = lordPos.rasi.index;
        }
        var years = 12;
        if (lordRasiIndex !== -1) {
            var isDirect = DIRECT_SIGNS.includes(rasiIndex);
            var count = 0;
            if (isDirect) {
                count = (lordRasiIndex - rasiIndex + 12) % 12;
            }
            else {
                count = (rasiIndex - lordRasiIndex + 12) % 12;
            }
            if (count === 0)
                years = 12;
            else
                years = count;
        }
        var mdDuration = years * DAYS_IN_YEAR;
        var mdEnd = addDays(currentStart, mdDuration);
        var adPeriods = [];
        var adStart = currentStart;
        for (var j = 0; j < 12; j++) {
            var adRasiIndex = isOdd ? (rasiIndex + j) % 12 : (rasiIndex - j + 12) % 12;
            var adName = RASI_NAMES[adRasiIndex];
            var adDuration = mdDuration / 12;
            var adEnd = addDays(adStart, adDuration);
            adPeriods.push({
                planet: adName,
                start: adStart.toISOString(),
                end: adEnd.toISOString()
            });
            adStart = adEnd;
        }
        dashas.push({
            planet: rasiName,
            start: currentStart.toISOString(),
            end: mdEnd.toISOString(),
            subPeriods: adPeriods
        });
        currentStart = mdEnd;
    };
    for (var i = 0; i < 12; i++) {
        _loop_1(i);
    }
    return dashas;
}
var ASHTOTTARI_LORDS = [
    { planet: 'Sun', years: 6 },
    { planet: 'Moon', years: 15 },
    { planet: 'Mars', years: 8 },
    { planet: 'Mercury', years: 17 },
    { planet: 'Saturn', years: 10 },
    { planet: 'Jupiter', years: 19 },
    { planet: 'Rahu', years: 12 },
    { planet: 'Venus', years: 21 }
];
var ASHTOTTARI_NAK_LORDS = [
    6, 6, 7, 7, 7, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6
];
function calculateAshtottariDasha(moonLongitude, birthDate) {
    var nakshatraLength = 360 / 27;
    var exactNakshatra = moonLongitude / nakshatraLength;
    var nakshatraIndex = Math.floor(exactNakshatra);
    var fractionPassed = exactNakshatra - nakshatraIndex;
    var startLordIndex = ASHTOTTARI_NAK_LORDS[nakshatraIndex];
    var firstLord = ASHTOTTARI_LORDS[startLordIndex];
    var numNakshatras = 0;
    for (var i = 0; i < ASHTOTTARI_NAK_LORDS.length; i++) {
        if (ASHTOTTARI_NAK_LORDS[i] === startLordIndex) {
            numNakshatras++;
        }
    }
    var curr = nakshatraIndex;
    while (ASHTOTTARI_NAK_LORDS[curr] === startLordIndex) {
        curr = (curr - 1 + 27) % 27;
    }
    var firstNakshatraOfLord = (curr + 1) % 27;
    var passedNakshatras = 0;
    var temp = firstNakshatraOfLord;
    while (temp !== nakshatraIndex) {
        passedNakshatras++;
        temp = (temp + 1) % 27;
    }
    var totalFractionPassed = (passedNakshatras + fractionPassed) / numNakshatras;
    var passedDays = totalFractionPassed * firstLord.years * DAYS_IN_YEAR;
    var fullStart = addDays(birthDate, -passedDays);
    var dashas = [];
    var mdStart = fullStart;
    for (var i = 0; i < 8; i++) {
        var mdLordIndex = (startLordIndex + i) % 8;
        var mdLord = ASHTOTTARI_LORDS[mdLordIndex];
        var mdDurationMs = mdLord.years * DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
        var mdEnd = new Date(mdStart.getTime() + mdDurationMs);
        var adPeriods = [];
        var adStart = mdStart;
        for (var j = 0; j < 8; j++) {
            var adLordIndex = (mdLordIndex + j) % 8;
            var adLord = ASHTOTTARI_LORDS[adLordIndex];
            var adDurationMs = mdDurationMs * (adLord.years / 108);
            var adEnd = new Date(adStart.getTime() + adDurationMs);
            var pdPeriods = [];
            var pdStart = adStart;
            for (var k = 0; k < 8; k++) {
                var pdLordIndex = (adLordIndex + k) % 8;
                var pdLord = ASHTOTTARI_LORDS[pdLordIndex];
                var pdDurationMs = adDurationMs * (pdLord.years / 108);
                var pdEnd = new Date(pdStart.getTime() + pdDurationMs);
                if (pdEnd > birthDate) {
                    pdPeriods.push({
                        planet: pdLord.planet,
                        start: (pdStart < birthDate ? birthDate : pdStart).toISOString(),
                        end: pdEnd.toISOString()
                    });
                }
                pdStart = pdEnd;
            }
            if (adEnd > birthDate) {
                adPeriods.push({
                    planet: adLord.planet,
                    start: (adStart < birthDate ? birthDate : adStart).toISOString(),
                    end: adEnd.toISOString(),
                    subPeriods: pdPeriods
                });
            }
            adStart = adEnd;
        }
        if (mdEnd > birthDate) {
            dashas.push({
                planet: mdLord.planet,
                start: (mdStart < birthDate ? birthDate : mdStart).toISOString(),
                end: mdEnd.toISOString(),
                subPeriods: adPeriods
            });
        }
        mdStart = mdEnd;
    }
    return dashas;
}
var KC_DURATION = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10]; // Aries to Pisces
var SAVYA_1 = [0, 2, 6, 8, 12, 14, 18, 20, 24];
var SAVYA_2 = [1, 7, 13, 19, 25, 26];
var APASAVYA_1 = [3, 9, 15, 21];
var APASAVYA_2 = [4, 5, 10, 11, 16, 17, 22, 23];
var KC_RASIS = [
    // Savya 1
    [
        [0, 1, 2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 7, 6, 5, 3, 4, 2],
        [1, 0, 11, 10, 9, 8, 0, 1, 2],
        [3, 4, 5, 6, 7, 8, 9, 10, 11]
    ],
    // Savya 2
    [
        [7, 6, 5, 3, 4, 2, 1, 0, 11],
        [10, 9, 8, 0, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11, 7, 6, 5],
        [3, 4, 2, 1, 0, 11, 10, 9, 8]
    ],
    // Apasavya 1
    [
        [8, 9, 10, 11, 0, 1, 2, 4, 3],
        [5, 6, 7, 11, 10, 9, 8, 7, 6],
        [5, 4, 3, 2, 1, 0, 8, 9, 10],
        [11, 0, 1, 2, 4, 3, 5, 6, 7]
    ],
    // Apasavya 2
    [
        [11, 10, 9, 8, 7, 6, 5, 4, 3],
        [2, 1, 0, 8, 9, 10, 11, 0, 1],
        [2, 4, 3, 5, 6, 7, 11, 10, 9],
        [8, 7, 6, 5, 4, 3, 2, 1, 0]
    ]
];
function calculateKalachakraDasha(moonLongitude, birthDate) {
    var RASI_NAMES_KC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    function getNavamsaRasi(lon) {
        var rasi = Math.floor(lon / 30);
        var offset = lon % 30;
        var n = Math.floor(offset / (30 / 9));
        var start = 0;
        if ([0, 3, 6, 9].includes(rasi))
            start = rasi;
        else if ([1, 4, 7, 10].includes(rasi))
            start = (rasi + 8) % 12;
        else
            start = (rasi + 4) % 12;
        return (start + n) % 12;
    }
    var span = 30 / 9;
    var rasi = Math.floor(moonLongitude / 30);
    var off = moonLongitude % 30;
    var i0 = Math.floor(off / span);
    var startOfNav = (rasi * 30) + i0 * span;
    var mdNavStarts = Array.from({ length: 9 }, function (_, k) { return startOfNav + k * span; });
    var mdSigns = mdNavStarts.map(function (L) { return getNavamsaRasi(L + 1e-9); });
    var mdDurations = mdSigns.map(function (s) { return KC_DURATION[s]; });
    var fractionLeft = 1.0 - ((moonLongitude % span) / span);
    mdDurations[0] = mdDurations[0] * fractionLeft;
    var dashas = [];
    var mdStart = birthDate;
    for (var i = 0; i < 9; i++) {
        var mdSign = mdSigns[i];
        var mdYears = mdDurations[i];
        var mdDurationMs = mdYears * DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
        var mdEnd = new Date(mdStart.getTime() + mdDurationMs);
        var mdNavStartLon = mdNavStarts[i] + 1e-9;
        var nakIndex = Math.floor(mdNavStartLon / (360 / 27));
        var padaIndex = Math.floor((mdNavStartLon % (360 / 27)) / (360 / 108));
        var group = 0;
        if (SAVYA_1.includes(nakIndex))
            group = 0;
        else if (SAVYA_2.includes(nakIndex))
            group = 1;
        else if (APASAVYA_1.includes(nakIndex))
            group = 2;
        else
            group = 3;
        var adBaseCycle = KC_RASIS[group][padaIndex];
        var adWeights = adBaseCycle.map(function (s) { return KC_DURATION[s]; });
        var adTotalWeight = adWeights.reduce(function (a, b) { return a + b; }, 0);
        var adPeriods = [];
        var adStart = mdStart;
        for (var j = 0; j < adBaseCycle.length; j++) {
            var adSign = adBaseCycle[j];
            var adYears = mdYears * (adWeights[j] / adTotalWeight);
            var adDurationMs = adYears * DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
            var adEnd = new Date(adStart.getTime() + adDurationMs);
            var pdBaseCycle = KC_RASIS[group][padaIndex];
            var pdWeights = pdBaseCycle.map(function (s) { return KC_DURATION[s]; });
            var pdTotalWeight = pdWeights.reduce(function (a, b) { return a + b; }, 0);
            var pdPeriods = [];
            var pdStart = adStart;
            for (var k = 0; k < pdBaseCycle.length; k++) {
                var pdSign = pdBaseCycle[k];
                var pdYears = adYears * (pdWeights[k] / pdTotalWeight);
                var pdDurationMs = pdYears * DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
                var pdEnd = new Date(pdStart.getTime() + pdDurationMs);
                pdPeriods.push({
                    planet: RASI_NAMES_KC[pdSign],
                    start: pdStart.toISOString(),
                    end: pdEnd.toISOString()
                });
                pdStart = pdEnd;
            }
            adPeriods.push({
                planet: RASI_NAMES_KC[adSign],
                start: adStart.toISOString(),
                end: adEnd.toISOString(),
                subPeriods: pdPeriods
            });
            adStart = adEnd;
        }
        dashas.push({
            planet: RASI_NAMES_KC[mdSign],
            start: mdStart.toISOString(),
            end: mdEnd.toISOString(),
            subPeriods: adPeriods
        });
        mdStart = mdEnd;
    }
    return dashas;
}
