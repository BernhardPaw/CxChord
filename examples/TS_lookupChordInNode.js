///<reference types="node" />
///<reference types="lodash" />
///<reference types="chartjs" />
///<reference types="../lib/CxChord" />
"use strict";
var CxChord = require("../lib/CxChord.js");
console.log("-------------------");
var midiChord = [64, 67, 71, 72, 74, 78, 81];
var cm = new CxChord.ChordMatcher();
cm.match(midiChord);
var mached = cm.getMatch();
console.log(JSON.stringify(mached, null, " "));
//# sourceMappingURL=TS_lookupChordInNode.js.map