"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dasha_1 = require("./src/lib/dasha");
var dob = new Date('1996-12-07T10:34:00+05:30');
var moonLongitude = 186.0762817988921;
var ashtottari = (0, dasha_1.calculateAshtottariDasha)(moonLongitude, dob);
console.log('Ashtottari 1st:', ashtottari[0].planet, ashtottari[0].start, ashtottari[0].end);
var kc = (0, dasha_1.calculateKalachakraDasha)(moonLongitude, dob);
console.log('Kalachakra 1st:', kc[0].planet, kc[0].start, kc[0].end);
