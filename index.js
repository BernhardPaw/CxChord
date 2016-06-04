var CxChord;

(function(CxChord) {
    var BayesCalculator = function() {
        function BayesCalculator(bayesChordMap) {
            this.bayesChordMap = bayesChordMap;
            this.self = this;
            this.hypothesis = [];
            this.rules = [];
            this.likelyhoods = [];
            this.normalizingConst = [];
            this.posterior = [];
            this.chartsCount = 0;
            this.randomColorFactor = function() {
                return Math.round(Math.random() * 255);
            };
            this.createHypothesis();
        }
        BayesCalculator.prototype.createHypothesis = function() {
            var idx = 0;
            var _self = this.self;
            for (var key in this.bayesChordMap) {
                for (var inv = 0; inv < this.bayesChordMap[key].length; inv++) {
                    _self.hypothesis.push({
                        idx: idx++,
                        key: key,
                        inv: inv,
                        len: this.bayesChordMap[key][inv].notes.length,
                        root: this.bayesChordMap[key][inv].root
                    });
                }
            }
        };
        BayesCalculator.prototype.getChordMapNotes = function(idx) {
            return this.bayesChordMap[this.hypothesis[idx].key][this.hypothesis[idx].inv].notes;
        };
        BayesCalculator.prototype.standardDeriviation = function(data) {
            var sum = _.sum(data);
            var avg = sum / data.length;
            var squaredDiffs = _.map(data, function(value) {
                var diff = value - avg;
                return diff * diff;
            });
            var avgSquaredDiff = _.sum(squaredDiffs) / squaredDiffs.length;
            var stdDev = Math.sqrt(avgSquaredDiff);
            return stdDev;
        };
        BayesCalculator.prototype.applyRule = function(rule) {
            var row = this.likelyhoods.length;
            var firstRow = row == 0;
            var normalizingConst = 0;
            this.rules.push(rule);
            if (_.isUndefined(this.likelyhoods[row])) this.likelyhoods[row] = [];
            for (var col = 0; col < this.hypothesis.length; col++) {
                var likelyhood = rule.ruleFx(rule.chord, this.self, row, col);
                this.likelyhoods[row].push(likelyhood);
                var prior = firstRow ? 1 : this.posterior[row - 1][col].post;
                normalizingConst += prior * likelyhood;
            }
            this.likelyhoods[row].push(normalizingConst);
            this.calcPosterior(row);
        };
        BayesCalculator.prototype.calcPosterior = function(_row) {
            for (var row = _row < 0 ? 0 : _row; row < this.likelyhoods.length; row++) {
                var firstRow = row == 0;
                var colIdx = this.likelyhoods[row].length - 1;
                var normalizingConst = this.likelyhoods[row][colIdx];
                if (_.isUndefined(this.posterior[row])) this.posterior[row] = [];
                for (var col = 0; col < this.hypothesis.length; col++) {
                    var prior = firstRow ? 1 : this.posterior[row - 1][col].post;
                    var likelyhood = this.likelyhoods[row][col];
                    var posterior = prior * likelyhood / (firstRow ? 1 : normalizingConst);
                    this.posterior[row].push({
                        post: posterior,
                        idx: col
                    });
                }
            }
        };
        BayesCalculator.prototype.getPosteriorByRow = function(rowIdx) {
            if (rowIdx < 0 || rowIdx >= this.posterior.length || _.isUndefined(this.posterior[rowIdx])) throw Error("getPosteriorByRow index: " + rowIdx + " is out of range or undefined");
            for (var col = 0; col < this.hypothesis.length; col++) {
                this.posterior[rowIdx][col].hypo = this.hypothesis[col];
            }
            return _.orderBy(this.posterior[rowIdx], [ "post", "hypo.len", "hypo.inv" ], "desc");
        };
        BayesCalculator.prototype.getPosterior = function() {
            var lastRow = this.posterior.length - 1;
            if (lastRow < 0) return []; else return this.getPosteriorByRow(lastRow);
        };
        BayesCalculator.prototype.getHypothesis = function(posterior) {
            return this.hypothesis[posterior.idx];
        };
        BayesCalculator.prototype.getHypothesisByIdx = function(idx) {
            if (idx < 0 || idx >= this.hypothesis.length) throw Error("getHypothesisByIdx index: " + idx + " is out of range");
            return this.hypothesis[idx];
        };
        BayesCalculator.prototype.getBestMatch = function(idx) {
            if (idx === void 0) {
                idx = 0;
            }
            var res = this.getPosterior();
            return res[idx];
        };
        BayesCalculator.prototype.getTopX = function(topX, row) {
            if (topX === void 0) {
                topX = 10;
            }
            if (row === void 0) {
                row = this.posterior.length - 1;
            }
            var posterior = this.getPosteriorByRow(row);
            return _.take(posterior, topX);
        };
        BayesCalculator.prototype.getRandomIntInclusive = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        BayesCalculator.prototype.visualizeTopX = function(title, chord, topX) {
            if (topX === void 0) {
                topX = 10;
            }
            var labels = [];
            var posteriorLastRow = this.getTopX(topX);
            var bayesChart;
            for (var i = 0; i < posteriorLastRow.length; i++) {
                var hypo = this.getHypothesis(posteriorLastRow[i]);
                var label = chord.getRootName(hypo) + hypo.key + "_i" + hypo.inv;
                labels.push(label);
            }
            bayesChart = new CxChord.BayesChart("visualization", labels);
            for (var dataSet = 1; dataSet < this.posterior.length; dataSet++) {
                var data = [];
                for (var i = 0; i < posteriorLastRow.length; i++) {
                    var idx = posteriorLastRow[i].idx;
                    var post = this.posterior[dataSet][idx].post;
                    data.push(post);
                }
                var randomColor = this.randomColorFactor() + "," + this.randomColorFactor() + "," + this.randomColorFactor();
                bayesChart.addDataSet(this.rules[dataSet].rule, randomColor, data);
            }
            bayesChart.showChart();
        };
        return BayesCalculator;
    }();
    CxChord.BayesCalculator = BayesCalculator;
})(CxChord || (CxChord = {}));

var __extends = this && this.__extends || function(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var CxChord;

(function(CxChord) {
    CxChord.colorSchema = {
        Mahogany: {
            hex: "#CD4A4A",
            rgb: "205,74,74"
        },
        FuzzyWuzzyBrown: {
            hex: "#CC6666",
            rgb: "204,102,102"
        },
        Chestnut: {
            hex: "#BC5D58",
            rgb: "188,93,88"
        },
        RedOrange: {
            hex: "#FF5349",
            rgb: "255,83,73"
        },
        SunsetOrange: {
            hex: "#FD5E53",
            rgb: "253,94,83"
        },
        Bittersweet: {
            hex: "#FD7C6E",
            rgb: "253,124,110"
        },
        Melon: {
            hex: "#FDBCB4",
            rgb: "253,188,180"
        },
        OutrageousOrange: {
            hex: "#FF6E4A",
            rgb: "255,110,74"
        },
        VividTangerine: {
            hex: "#FFA089",
            rgb: "255,160,137"
        },
        BurntSienna: {
            hex: "#EA7E5D",
            rgb: "234,126,93"
        },
        Brown: {
            hex: "#B4674D",
            rgb: "180,103,77"
        },
        Sepia: {
            hex: "#A5694F",
            rgb: "165,105,79"
        },
        Orange: {
            hex: "#FF7538",
            rgb: "255,117,56"
        },
        BurntOrange: {
            hex: "#FF7F49",
            rgb: "255,127,73"
        },
        Copper: {
            hex: "#DD9475",
            rgb: "221,148,117"
        },
        MangoTango: {
            hex: "#FF8243",
            rgb: "255,130,67"
        },
        AtomicTangerine: {
            hex: "#FFA474",
            rgb: "255,164,116"
        },
        Beaver: {
            hex: "#9F8170",
            rgb: "159,129,112"
        },
        AntiqueBrass: {
            hex: "#CD9575",
            rgb: "205,149,117"
        },
        DesertSand: {
            hex: "#EFCDB8",
            rgb: "239,205,184"
        },
        RawSienna: {
            hex: "#D68A59",
            rgb: "214,138,89"
        },
        Tumbleweed: {
            hex: "#DEAA88",
            rgb: "222,170,136"
        },
        Tan: {
            hex: "#FAA76C",
            rgb: "250,167,108"
        },
        Peach: {
            hex: "#FFCFAB",
            rgb: "255,207,171"
        },
        MacaroniandCheese: {
            hex: "#FFBD88",
            rgb: "255,189,136"
        },
        Apricot: {
            hex: "#FDD9B5",
            rgb: "253,217,181"
        },
        NeonCarrot: {
            hex: "#FFA343",
            rgb: "255,163,67"
        },
        Almond: {
            hex: "#EFDBC5",
            rgb: "239,219,197"
        },
        YellowOrange: {
            hex: "#FFB653",
            rgb: "255,182,83"
        },
        Gold: {
            hex: "#E7C697",
            rgb: "231,198,151"
        },
        Shadow: {
            hex: "#8A795D",
            rgb: "138,121,93"
        },
        BananaMania: {
            hex: "#FAE7B5",
            rgb: "250,231,181"
        },
        Sunglow: {
            hex: "#FFCF48",
            rgb: "255,207,72"
        },
        Goldenrod: {
            hex: "#FCD975",
            rgb: "252,217,117"
        },
        Dandelion: {
            hex: "#FDDB6D",
            rgb: "253,219,109"
        },
        Yellow: {
            hex: "#FCE883",
            rgb: "252,232,131"
        },
        GreenYellow: {
            hex: "#F0E891",
            rgb: "240,232,145"
        },
        SpringGreen: {
            hex: "#ECEABE",
            rgb: "236,234,190"
        },
        OliveGreen: {
            hex: "#BAB86C",
            rgb: "186,184,108"
        },
        LaserLemon: {
            hex: "#FDFC74",
            rgb: "253,252,116"
        },
        UnmellowYellow: {
            hex: "#FDFC74",
            rgb: "253,252,116"
        },
        Canary: {
            hex: "#FFFF99",
            rgb: "255,255,153"
        },
        YellowGreen: {
            hex: "#C5E384",
            rgb: "197,227,132"
        },
        InchWorm: {
            hex: "#B2EC5D",
            rgb: "178,236,93"
        },
        Asparagus: {
            hex: "#87A96B",
            rgb: "135,169,107"
        },
        GrannySmithApple: {
            hex: "#A8E4A0",
            rgb: "168,228,160"
        },
        ElectricLime: {
            hex: "#1DF914",
            rgb: "29,249,20"
        },
        ScreaminGreen: {
            hex: "#76FF7A",
            rgb: "118,255,122"
        },
        Fern: {
            hex: "#71BC78",
            rgb: "113,188,120"
        },
        ForestGreen: {
            hex: "#6DAE81",
            rgb: "109,174,129"
        },
        SeaGreen: {
            hex: "#9FE2BF",
            rgb: "159,226,191"
        },
        Green: {
            hex: "#1CAC78",
            rgb: "28,172,120"
        },
        MountainMeadow: {
            hex: "#30BA8F",
            rgb: "48,186,143"
        },
        Shamrock: {
            hex: "#45CEA2",
            rgb: "69,206,162"
        },
        JungleGreen: {
            hex: "#3BB08F",
            rgb: "59,176,143"
        },
        CaribbeanGreen: {
            hex: "#1CD3A2",
            rgb: "28,211,162"
        },
        TropicalRainForest: {
            hex: "#17806D",
            rgb: "23,128,109"
        },
        PineGreen: {
            hex: "#158078",
            rgb: "21,128,120"
        },
        RobinEggBlue: {
            hex: "#1FCECB",
            rgb: "31,206,203"
        },
        Aquamarine: {
            hex: "#78DBE2",
            rgb: "120,219,226"
        },
        TurquoiseBlue: {
            hex: "#77DDE7",
            rgb: "119,221,231"
        },
        SkyBlue: {
            hex: "#80DAEB",
            rgb: "128,218,235"
        },
        OuterSpace: {
            hex: "#414A4C",
            rgb: "65,74,76"
        },
        BlueGreen: {
            hex: "#199EBD",
            rgb: "25,158,189"
        },
        PacificBlue: {
            hex: "#1CA9C9",
            rgb: "28,169,201"
        },
        Cerulean: {
            hex: "#1DACD6",
            rgb: "29,172,214"
        },
        Cornflower: {
            hex: "#9ACEEB",
            rgb: "154,206,235"
        },
        MidnightBlue: {
            hex: "#1A4876",
            rgb: "26,72,118"
        },
        NavyBlue: {
            hex: "#1974D2",
            rgb: "25,116,210"
        },
        Denim: {
            hex: "#2B6CC4",
            rgb: "43,108,196"
        },
        Blue: {
            hex: "#1F75FE",
            rgb: "31,117,254"
        },
        Periwinkle: {
            hex: "#C5D0E6",
            rgb: "197,208,230"
        },
        CadetBlue: {
            hex: "#B0B7C6",
            rgb: "176,183,198"
        },
        Indigo: {
            hex: "#5D76CB",
            rgb: "93,118,203"
        },
        WildBlueYonder: {
            hex: "#A2ADD0",
            rgb: "162,173,208"
        },
        Manatee: {
            hex: "#979AAA",
            rgb: "151,154,170"
        },
        BlueBell: {
            hex: "#ADADD6",
            rgb: "173,173,214"
        },
        BlueViolet: {
            hex: "#7366BD",
            rgb: "115,102,189"
        },
        PurpleHeart: {
            hex: "#7442C8",
            rgb: "116,66,200"
        },
        RoyalPurple: {
            hex: "#7851A9",
            rgb: "120,81,169"
        },
        "PurpleMountains’Majesty": {
            hex: "#9D81BA",
            rgb: "157,129,186"
        },
        "Violet(Purple)": {
            hex: "#926EAE",
            rgb: "146,110,174"
        },
        Wisteria: {
            hex: "#CDA4DE",
            rgb: "205,164,222"
        },
        VividViolet: {
            hex: "#8F509D",
            rgb: "143,80,157"
        },
        Fuchsia: {
            hex: "#C364C5",
            rgb: "195,100,197"
        },
        ShockingPink: {
            hex: "#FB7EFD",
            rgb: "251,126,253"
        },
        PinkFlamingo: {
            hex: "#FC74FD",
            rgb: "252,116,253"
        },
        Plum: {
            hex: "#8E4585",
            rgb: "142,69,133"
        },
        HotMagenta: {
            hex: "#FF1DCE",
            rgb: "255,29,206"
        },
        PurplePizzazz: {
            hex: "#FF1DCE",
            rgb: "255,29,206"
        },
        RazzleDazzleRose: {
            hex: "#FF48D0",
            rgb: "255,72,208"
        },
        Orchid: {
            hex: "#E6A8D7",
            rgb: "230,168,215"
        },
        RedViolet: {
            hex: "#C0448F",
            rgb: "192,68,143"
        },
        Eggplant: {
            hex: "#6E5160",
            rgb: "110,81,96"
        },
        Cerise: {
            hex: "#DD4492",
            rgb: "221,68,146"
        },
        WildStrawberry: {
            hex: "#FF43A4",
            rgb: "255,67,164"
        },
        Magenta: {
            hex: "#F664AF",
            rgb: "246,100,175"
        },
        Lavender: {
            hex: "#FCB4D5",
            rgb: "252,180,213"
        },
        CottonCandy: {
            hex: "#FFBCD9",
            rgb: "255,188,217"
        },
        VioletRed: {
            hex: "#F75394",
            rgb: "247,83,148"
        },
        CarnationPink: {
            hex: "#FFAACC",
            rgb: "255,170,204"
        },
        Razzmatazz: {
            hex: "#E3256B",
            rgb: "227,37,107"
        },
        PiggyPink: {
            hex: "#FDD7E4",
            rgb: "253,215,228"
        },
        JazzberryJam: {
            hex: "#CA3767",
            rgb: "202,55,103"
        },
        Blush: {
            hex: "#DE5D83",
            rgb: "222,93,131"
        },
        TickleMePink: {
            hex: "#FC89AC",
            rgb: "252,137,172"
        },
        PinkSherbet: {
            hex: "#F780A1",
            rgb: "247,128,161"
        },
        Maroon: {
            hex: "#C8385A",
            rgb: "200,56,90"
        },
        Red: {
            hex: "#EE204D",
            rgb: "238,32,77"
        },
        RadicalRed: {
            hex: "#FF496C",
            rgb: "255,73,108"
        },
        Mauvelous: {
            hex: "#EF98AA",
            rgb: "239,152,170"
        },
        WildWatermelon: {
            hex: "#FC6C85",
            rgb: "252,108,133"
        },
        Scarlet: {
            hex: "#FC2847",
            rgb: "252,40,71"
        },
        Salmon: {
            hex: "#FF9BAA",
            rgb: "255,155,170"
        },
        BrickRed: {
            hex: "#CB4154",
            rgb: "203,65,84"
        },
        White: {
            hex: "#EDEDED",
            rgb: "237,237,237"
        },
        Timberwolf: {
            hex: "#DBD7D2",
            rgb: "219,215,210"
        },
        Silver: {
            hex: "#CDC5C2",
            rgb: "205,197,194"
        },
        Gray: {
            hex: "#95918C",
            rgb: "149,145,140"
        },
        Black: {
            hex: "#232323",
            rgb: "35,35,35"
        }
    };
    var BarDataSet = function() {
        function BarDataSet(labels) {
            this.labels = labels;
            this._options = {
                scales: {
                    xAxes: [ {
                        barPercentage: .5
                    } ],
                    yAxes: [ {
                        type: "linear",
                        display: true,
                        position: "left",
                        id: "y-axis-1"
                    } ]
                },
                responsive: true,
                legend: {
                    display: true,
                    position: "top"
                },
                title: {
                    display: true,
                    text: "Top Hypothesis"
                }
            };
            this._options2 = {
                scaleBeginAtZero: true,
                scaleShowGridLines: true,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                barShowStroke: true,
                barStrokeWidth: 2,
                barValueSpacing: 5,
                barDatasetSpacing: 1,
                legendTemplate: '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].lineColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
            };
            this.barData = {
                labels: this.labels,
                datasets: []
            };
        }
        BarDataSet.prototype.setLabels = function(labels) {
            this.labels = labels;
        };
        BarDataSet.prototype.addDataSet = function(label, rgb, data) {
            this.barData.datasets.push({
                label: label,
                fillColor: "rgba(" + rgb + ",0.5)",
                strokeColor: "rgba(" + rgb + ",0.8)",
                highlightFill: "rgba(" + rgb + ",0.75)",
                highlightStroke: "rgba(" + rgb + ",1)",
                data: data
            });
        };
        return BarDataSet;
    }();
    CxChord.BarDataSet = BarDataSet;
    var BayesChart = function(_super) {
        __extends(BayesChart, _super);
        function BayesChart(htmlElement, labels) {
            if (htmlElement === void 0) {
                htmlElement = "visualization";
            }
            if (labels === void 0) {
                labels = [];
            }
            _super.call(this, labels);
            this.canvas = document.getElementById(htmlElement);
            this.ctx = this.canvas.getContext("2d");
        }
        BayesChart.prototype.showChart = function() {
            this.barChart = new Chart(this.ctx).Bar(this.barData, this._options);
            document.getElementById("legend").innerHTML = this.barChart.generateLegend();
        };
        return BayesChart;
    }(BarDataSet);
    CxChord.BayesChart = BayesChart;
})(CxChord || (CxChord = {}));

var CxChord;

(function(CxChord) {
    var ChordInstance = function() {
        function ChordInstance(midiChord, normalizeChord) {
            if (normalizeChord === void 0) {
                normalizeChord = true;
            }
            this.midiChord = midiChord;
            this.normalizeChord = normalizeChord;
            this.offset = [];
            this.chordInv = [];
            this.matchedNotes = {};
            this.validate(midiChord);
            for (var i = 0; i < midiChord.length; i++) {
                this.offset.push(midiChord[i]);
            }
            this.chordInv = this.invert(midiChord);
        }
        ChordInstance.prototype.addOffset = function(chord, offset) {
            var res = [];
            for (var i = 0; i < chord.length; i++) {
                res.push(chord[i] + offset);
            }
            return res;
        };
        ChordInstance.prototype.addRootOffset = function(chord, root) {
            var offset = (root < 0 ? 12 + root : root) % 12;
            return this.normalize(this.addOffset(chord, offset));
        };
        ChordInstance.prototype.getOffset = function(inv) {
            if (inv < 0 || inv >= this.offset.length) throw Error("getRootOffset inversion is out of range"); else return this.offset[inv];
        };
        ChordInstance.prototype.getBassName = function(hypo, sharpOrFlat) {
            if (sharpOrFlat === void 0) {
                sharpOrFlat = "flat";
            }
            var bass = this.offset[hypo.inv];
            var bassName = CxChord.rootNoteNames[sharpOrFlat][bass];
            return bassName;
        };
        ChordInstance.prototype.getRootName = function(hypo, sharpOrFlat) {
            if (sharpOrFlat === void 0) {
                sharpOrFlat = "flat";
            }
            var _offset = (this.offset[0] + hypo.root) % 12;
            var root = _offset < 0 ? _offset + 12 : _offset;
            var rootName = CxChord.rootNoteNames[sharpOrFlat][root];
            return rootName;
        };
        ChordInstance.prototype.getInversion = function(inv) {
            return _.isUndefined(this.chordInv[inv]) ? [] : this.chordInv[inv];
        };
        ChordInstance.prototype.validate = function(notes) {
            if (notes.length == 0) {
                throw Error("No notes in notes array");
            }
            for (var i = 0; i < notes.length; i++) {
                if (notes[i] < 0 || notes[i] > 127) {
                    throw Error("Illegal midi note value:" + notes[i]);
                }
            }
        };
        ChordInstance.prototype.normalize = function(notes) {
            var target = [];
            try {
                var offset = notes[0];
                for (var i = 0; i < notes.length; i++) {
                    var note = notes[i] - offset;
                    while (note > 21) note -= 12;
                    target[i] = note;
                }
            } catch (e) {
                throw Error(e);
            }
            return target;
        };
        ChordInstance.prototype.invert = function(notes) {
            if (notes.length < 2) throw Error("Cannot invert less than 2 notes");
            var target = [];
            target[0] = this.normalizeChord ? this.normalize(notes) : notes;
            this.offset[0] = notes[0];
            for (var d = 1; d < notes.length; d++) {
                var currNotes = _.drop(target[d - 1]);
                var invNote = _.head(target[d - 1]);
                invNote += 12;
                currNotes.push(invNote);
                target[d] = this.normalizeChord ? this.normalize(currNotes) : currNotes;
            }
            if (target.length < notes.length) throw Error("Bad invertion");
            return target;
        };
        return ChordInstance;
    }();
    CxChord.ChordInstance = ChordInstance;
})(CxChord || (CxChord = {}));

var CxChord;

(function(CxChord) {
    CxChord.rootNoteNames = {
        sharp: [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ],
        flat: [ "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B" ]
    };
    function getNoteName(note, flatOrSharp) {
        if (note === void 0) {
            note = 0;
        }
        if (flatOrSharp === void 0) {
            flatOrSharp = "flat";
        }
        note = note % 12;
        var noteName = CxChord.rootNoteNames[flatOrSharp][Math.abs(note < 0 ? note + 12 : note) % 12];
        return noteName;
    }
    CxChord.getNoteName = getNoteName;
    function getExtName(nameWithCommas) {
        var extName = nameWithCommas.replace(/,/g, "").replace(/-1/g, "-no-root").replace(/-5/g, "-no-fifth");
        return extName;
    }
    CxChord.getExtName = getExtName;
    function getChordName(nameWithCommas, root, bass, flatOrSharp) {
        if (root === void 0) {
            root = 0;
        }
        if (bass === void 0) {
            bass = 0;
        }
        if (flatOrSharp === void 0) {
            flatOrSharp = "flat";
        }
        var chordName = CxChord.getNoteName(root, flatOrSharp);
        var extName = CxChord.getExtName(nameWithCommas);
        chordName += extName;
        if (bass !== 0) {
            var bassName = CxChord.getNoteName(bass, flatOrSharp);
            chordName += "/" + bassName;
        }
        return chordName;
    }
    CxChord.getChordName = getChordName;
    function isNoRootChord(chordSym) {
        return _.isUndefined(chordSym) ? false : chordSym.indexOf("-1") > 0;
    }
    CxChord.isNoRootChord = isNoRootChord;
    function getKnockouts(key) {
        var _key = key;
        if (_.isUndefined(CxChord.knockouts[_key])) {
            _key = _key.split(",")[0];
        }
        return _.isUndefined(CxChord.knockouts[_key]) ? [] : CxChord.knockouts[_key];
    }
    CxChord.getKnockouts = getKnockouts;
    CxChord.chordMap = {
        Maj: {
            notes: [ 0, 4, 7 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Maj,7": {
            notes: [ 0, 4, 7, 11 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Maj,7,9": {
            notes: [ 0, 4, 7, 11, 14 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Maj,7,9,#11": {
            notes: [ 0, 4, 7, 11, 14, 18 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "Maj,7,9,#11,13": {
            notes: [ 0, 4, 7, 11, 14, 18, 21 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "Maj,6": {
            notes: [ 0, 4, 7, 9 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Maj,6,9": {
            notes: [ 0, 4, 7, 9, 14 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Maj,add2": {
            notes: [ 0, 2, 4, 7 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "Maj,add9": {
            notes: [ 0, 4, 7, 14 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "5": {
            notes: [ 0, 7 ],
            root: 0,
            inv: 0,
            group: 3
        },
        Min: {
            notes: [ 0, 3, 7 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Min,7": {
            notes: [ 0, 3, 7, 10 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Min,7,9": {
            notes: [ 0, 3, 7, 10 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Min,7,b5": {
            notes: [ 0, 3, 6, 10 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Min,6": {
            notes: [ 0, 3, 7, 9 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Min,6,9": {
            notes: [ 0, 3, 7, 9, 14 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Min,M7": {
            notes: [ 0, 3, 7, 11 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "Dom,7": {
            notes: [ 0, 4, 7, 10 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Dom,7,9": {
            notes: [ 0, 4, 7, 10, 14 ],
            root: 0,
            inv: 0,
            group: 1
        },
        "Dom,7,#5": {
            notes: [ 0, 4, 8, 10 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Dom,7,b5": {
            notes: [ 0, 4, 6, 10 ],
            root: 0,
            inv: 0,
            group: 3
        },
        "Dom,7,sus4": {
            notes: [ 0, 5, 7, 10 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Dom,7,sus2": {
            notes: [ 0, 2, 7, 10 ],
            root: 0,
            inv: 0,
            group: 2
        },
        Dim: {
            notes: [ 0, 3, 6 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Dim,7": {
            notes: [ 0, 3, 6, 9 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Dim,7(HW)": {
            notes: [ 0, 3, 6, 9 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Dim,7(WH)": {
            notes: [ 0, 3, 6, 9 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Maj,#5": {
            notes: [ 0, 4, 8 ],
            root: 0,
            inv: 0,
            group: 3
        },
        Sus2: {
            notes: [ 0, 2, 7 ],
            root: 0,
            inv: 0,
            group: 2
        },
        Sus4: {
            notes: [ 0, 5, 7 ],
            root: 0,
            inv: 0,
            group: 2
        },
        "Maj,6,9,-1": {
            notes: [ 0, 3, 5, 10 ],
            root: -4,
            inv: 0,
            group: 1
        },
        "Maj,M7,9,-1": {
            notes: [ 0, 3, 7, 11 ],
            root: -4,
            inv: 0,
            group: 3
        },
        "Min,6,9,-1": {
            notes: [ 0, 4, 6, 11 ],
            root: -3,
            inv: 0,
            group: 3
        },
        "Min,7,9,-1": {
            notes: [ 0, 4, 7, 11 ],
            root: -3,
            inv: 0,
            group: 3
        },
        "MinCluster,7,9,-1": {
            notes: [ 0, 4, 5, 9 ],
            root: -10,
            inv: 0,
            group: 3
        },
        "Dom,7,9,-1": {
            notes: [ 0, 3, 6, 10 ],
            root: -4,
            inv: 0,
            group: 2
        },
        "Dom,7,b9,-1": {
            notes: [ 0, 3, 6, 9 ],
            root: -4,
            inv: 0,
            group: 3
        },
        "Dom,7,#9,-1": {
            notes: [ 0, 3, 6, 11 ],
            root: -4,
            inv: 0,
            group: 3
        },
        "Dom7Cluster,-1": {
            notes: [ 0, 4, 6, 9 ],
            root: -4,
            inv: 0,
            group: 3
        }
    };
    CxChord.extensions = {
        Maj: [ 14, 18, 21 ],
        "Maj,7": [ 14, 18, 21 ],
        Min: [ 14, 17, 21, 13, 18 ],
        "Min,M7": [ 14, 17, 21, 18 ],
        "Maj,#5": [ 14, 18 ],
        "Dom,7": [ 13, 14, 18, 21 ],
        "Dom,7,#5": [ 13, 14, 15, 18, 19 ],
        "Dom,7,b5": [ 13, 14, 15, 19, 20, 21 ]
    };
    CxChord.mustHave = {
        Maj: [ 4 ],
        "Maj,7": [ 4, 11 ],
        "Maj,7,9": [ 4, 11 ],
        "Maj,7,9,#11": [ 4, 11 ],
        "Maj,7,9,#11,13": [ 4, 11 ],
        "Maj,6": [ 4, 9 ],
        "Maj,6,9": [ 4, 9 ],
        "Maj,6,9,-1": [ 4, 9 ],
        "Maj,add2": [ 2, 4 ],
        "Maj,add9": [ 4, 14 ],
        "Maj,#5": [ 0, 4, 8 ],
        Sus2: [ 0, 2, 7 ],
        Sus4: [ 0, 5, 7 ],
        Min: [ 3 ],
        "Min,6": [ 3, 9 ],
        "Min,6,9": [ 3, 9 ],
        "Min,6,9,-1": [ 3, 9 ],
        "Min,7": [ 3, 10 ],
        "Min,7,9": [ 3, 10 ],
        "Min,7,9,-1": [ 3, 10 ],
        "Min,7,b5": [ 3, 6, 10 ],
        "Min,M7": [ 3, 11 ],
        "Dom,7": [ 4, 10 ],
        "Dom,7,9": [ 4, 10 ],
        "Dom,7,#5": [ 4, 8, 10 ],
        "Dom,7,b5": [ 4, 6, 10 ],
        "Dom,7,sus4": [ 5, 10 ],
        "Dom,7,sus2": [ 2, 10 ],
        "Dom,7,9,-1": [ 4, 10 ],
        "Dom,7,b9,-1": [ 4, 10 ],
        "Dom,7,#9,-1": [ 4, 10 ],
        Dim: [ 0, 3, 6 ],
        "Dim,7(WH)": [ 0, 3, 6, 9 ],
        "Dim,7(HW)": [ 0, 3, 6, 9 ]
    };
    CxChord.conflicts = {
        "Maj,#5": [ [ 7, 8 ] ],
        Min: [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,6": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,6,9": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,6,9,-1": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,7": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,7,9": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,7,9,-1": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,7,b5": [ [ 5, 6 ], [ 7, 8 ] ],
        "Min,M7": [ [ 5, 6 ], [ 7, 8 ] ],
        "MinCluster,7,9,-1": [ [ 5, 6 ], [ 7, 8 ] ]
    };
    CxChord.knockouts = {
        Maj: [ 1, 3, 5, 8, 10 ],
        "Maj,7": [ 1, 3, 5, 8, 10 ],
        "Maj,7,9": [ 1, 3, 5, 8, 10 ],
        "Maj,7,9,#11": [ 1, 3, 5, 8, 10 ],
        "Maj,7,9,#11,13": [ 1, 3, 5, 8, 10 ],
        "Maj,6": [ 1, 3, 5, 8, 10 ],
        "Maj,6,9": [ 1, 3, 5, 8, 10 ],
        "Maj,7,b5": [ 1, 3, 5, 7, 8, 10 ],
        "Maj,add2": [ 1, 3, 5, 8, 10, 11, 14 ],
        "Maj,add9": [ 1, 3, 5, 8, 9, 10, 11 ],
        "Maj,#5": [ 1, 3, 5, 7, 10 ],
        "5": [ 1, 2, 3, 4, 5, 6, 8, 9, 10, 11 ],
        Min: [ 1, 4, 6, 8, 11 ],
        "Min,6": [ 1, 4, 6, 8 ],
        "Min,6,9": [ 1, 4, 6, 8 ],
        "Min,7": [ 1, 4, 6, 8, 11 ],
        "Min,7,9": [ 1, 4, 6, 8, 11 ],
        "Min,7,b5": [ 4, 7, 8, 11 ],
        "Min,M7": [ 1, 4, 6, 8, 10 ],
        "MinCluster,7,9,-1": [ 1, 4, 8 ],
        Dim: [ 4, 7, 9, 10, 11 ],
        "Dim,7": [ 1, 2, 4, 5, 7, 8, 10, 11 ],
        "Dim,7(HW)": [ 2, 5, 8, 11 ],
        "Dim,7(WH)": [ 1, 4, 7, 10 ],
        "Dom,7": [ 5, 11 ],
        "Dom,7,#5": [ 5, 11 ],
        "Dom,7,sus4": [ 4, 11 ],
        "Dom,7,b5": [ 5, 7, 11 ],
        Sus2: [ 1, 3, 4, 5, 8 ],
        Sus4: [ 1, 3, 4, 6, 8 ],
        "Maj,6,9,-1": [ 0, 1, 3, 5, 6, 8, 10 ],
        "Maj,M7,9,-1": [ 0, 1, 3, 5, 6, 8, 10 ],
        "Min,6,9,-1": [ 1, 4, 8 ],
        "Min,7,9,-1": [ 1, 4, 8 ],
        "Dom,7,9,-1": [ 0, 5, 7, 11 ],
        "Dom,7,b9,-1": [ 0, 5, 7, 11 ],
        "Dom,7,#9,-1": [ 0, 5, 7, 11 ],
        "Dom7Cluster,-1": [ 0, 5, 7, 11 ]
    };
    var ChordForms = function() {
        function ChordForms() {
            this.chordMapWithInv = {};
            this.buildInversions();
        }
        ChordForms.prototype.getInvariants = function(chordName) {
            var invariants;
            if (_.has(CxChord.chordMap, chordName)) {
                var chord = _.get(CxChord.chordMap, chordName);
                _.forIn(CxChord.chordMap, function(value, key) {
                    if (key !== chordName && _.isEqual(value.notes, chord.notes)) {
                        invariants.push(key);
                    }
                });
            }
            return invariants;
        };
        ChordForms.prototype.buildInversions = function() {
            var mapWithInv = this.chordMapWithInv;
            _.forIn(CxChord.chordMap, function(value, key) {
                mapWithInv[key] = [];
                var chord = new CxChord.ChordInstance(value.notes);
                var interval = chord.getInversion(0);
                for (var i = 0; i < value.notes.length; i++) {
                    var _notes = chord.getInversion(i);
                    var rootNote = -(Math.abs(value.root) + interval[i]) % 12;
                    mapWithInv[key].push({
                        notes: _notes,
                        root: rootNote == -0 ? 0 : rootNote,
                        inv: i,
                        group: value.group
                    });
                }
            });
        };
        return ChordForms;
    }();
    CxChord.ChordForms = ChordForms;
})(CxChord || (CxChord = {}));

var __extends = this && this.__extends || function(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var CxChord;

(function(CxChord) {
    var ChordMatcher = function(_super) {
        __extends(ChordMatcher, _super);
        function ChordMatcher() {
            _super.call(this);
            this.fullMatch = false;
            this.priorChords = [];
            this.bayes = new CxChord.BayesCalculator(this.chordMapWithInv);
        }
        ChordMatcher.prototype.getPosterior = function() {
            return this.bayes.getPosterior();
        };
        ChordMatcher.prototype.getChord = function() {
            return this.chord;
        };
        ChordMatcher.prototype.addRootOffset = function(_arr, root, addOctave) {
            if (_arr === void 0) {
                _arr = [];
            }
            if (addOctave === void 0) {
                addOctave = true;
            }
            var arr = [];
            if (root == 0) {
                arr = _arr;
            } else {
                for (var i = 0; i < _arr.length; i++) {
                    var note = _arr[i] + root % 12;
                    note = note < 0 ? note + 12 : note;
                    arr.push(note);
                }
            }
            return _.sortedUniq(arr);
        };
        ChordMatcher.prototype.addToArray = function(_arr, value) {
            var arr = [];
            for (var i = 0; i < _arr.length; i++) {
                arr.push(_arr[i] + value);
            }
            return arr;
        };
        ChordMatcher.prototype.doMatch = function(chord, limit) {
            if (limit === void 0) {
                limit = chord.chordInv[0].length;
            }
            var self = this;
            var extensions = CxChord.extensions;
            var knockouts = CxChord.knockouts;
            var mustHave = CxChord.mustHave;
            var conflicts = CxChord.conflicts;
            var rootNotes = CxChord.rootNoteNames;
            var idx = 0;
            _.forIn(this.chordMapWithInv, function(hypothesis, key) {
                idx++;
                for (var inv = 0; inv < hypothesis.length; inv++) {
                    idx += inv;
                    if (!_.has(chord.matchedNotes, key)) {
                        chord.matchedNotes[key] = {
                            invertions: [],
                            extensions: [],
                            knockouts: [],
                            mustHave: [],
                            rootNotes: [],
                            conflicts: [],
                            roots: [],
                            group: hypothesis[inv].group
                        };
                    }
                    chord.matchedNotes[key].rootNotes.push(hypothesis[inv].root);
                    var intersection = _.intersection(chord.chordInv[0], hypothesis[inv].notes);
                    if (!_.isArray(intersection)) throw Error("inversion Intersection is not an array");
                    chord.matchedNotes[key].invertions.push(intersection);
                    if (chord.chordInv[0].length == intersection.length) this.fullMatches = true;
                    var hypoToMatch = [];
                    var chordToMatch = [];
                    var invRoot = (hypothesis[inv].root < 0 ? 12 + hypothesis[inv].root : hypothesis[inv].root) % 12;
                    if (CxChord.isNoRootChord(key) && hypothesis[inv].root < 0) {
                        var tmpArr = [];
                        tmpArr.push(invRoot);
                        hypoToMatch = tmpArr.concat(hypothesis[inv].notes).sort();
                        chordToMatch = chord.addRootOffset(chord.chordInv[0], hypothesis[inv].root);
                    } else {
                        hypoToMatch = hypothesis[inv].notes;
                        chordToMatch = chord.chordInv[0];
                    }
                    if (key == "Dim") {
                        var debugRoot = true;
                    }
                    var indexOfRoot = chordToMatch.indexOf(invRoot) >= 0 ? chordToMatch.indexOf(invRoot) : chordToMatch.indexOf(invRoot + 12);
                    chord.matchedNotes[key].roots.push(indexOfRoot);
                    var mustHaveTrans;
                    var mustHaveMatch;
                    if (!_.isUndefined(mustHave[key])) {
                        mustHaveTrans = self.addRootOffset(mustHave[key], hypothesis[inv].root, false);
                        mustHaveMatch = _.intersection(chordToMatch, mustHaveTrans);
                        chord.matchedNotes[key].mustHave.push(mustHaveMatch.length - mustHaveTrans.length);
                    } else chord.matchedNotes[key].mustHave.push(0);
                    var extensionNotes = extensions[key];
                    var remainingNotes = _.difference(chord.chordInv[0], intersection);
                    var extensionMatch = _.intersection(remainingNotes, extensionNotes);
                    chord.matchedNotes[key].extensions.push(extensionMatch);
                    var knockoutTrans;
                    var knockoutMatch;
                    var KOs = CxChord.getKnockouts(key);
                    if (key == "Min") {
                        var debugRoot = true;
                    }
                    if (KOs.length > 0) {
                        knockoutTrans = self.addRootOffset(knockouts[key], hypothesis[inv].root);
                        knockoutMatch = _.intersection(chordToMatch, knockoutTrans);
                    }
                    chord.matchedNotes[key].knockouts.push(_.isUndefined(knockoutMatch) ? [] : knockoutMatch);
                    var conflictCount = 0;
                    var conflictTrans;
                    var conflictLen = 0;
                    if (!_.isUndefined(conflicts[key])) {
                        for (var i = 0; i < conflicts[key].length; i++) {
                            conflictTrans = self.addRootOffset(conflicts[key][i], hypothesis[inv].root);
                            var conflictMatch = _.intersection(chordToMatch, conflictTrans);
                            if (conflictMatch.length == conflictTrans.length) {
                                conflictCount += 1;
                            }
                            conflictTrans = self.addToArray(conflictTrans, 12);
                            conflictMatch = _.intersection(chord.chordInv[0], conflictTrans);
                            if (conflictMatch.length == conflictTrans.length) {
                                conflictCount += 1;
                            }
                        }
                    }
                    chord.matchedNotes[key].conflicts.push(conflictCount);
                }
            });
            return chord;
        };
        ChordMatcher.prototype.match = function(midiChord) {
            this.chord = new CxChord.ChordInstance(midiChord);
            this.doMatch(this.chord);
            this.rules = new CxChord.Rules(this.chord);
            var ruleE = this.rules.get("EvenDistribution");
            this.bayes.applyRule(ruleE);
            var ruleK = this.rules.get("Knockouts");
            this.bayes.applyRule(ruleK);
            var ruleM = this.rules.get("MatchedNotes");
            this.bayes.applyRule(ruleM);
            var ruleH = this.rules.get("MustHave");
            this.bayes.applyRule(ruleH);
            var ruleR = this.rules.get("RootFound");
            this.bayes.applyRule(ruleR);
            this.priorChords.push(this.chord);
            return this.chord;
        };
        return ChordMatcher;
    }(CxChord.ChordForms);
    CxChord.ChordMatcher = ChordMatcher;
})(CxChord || (CxChord = {}));

var CxChord;

(function(CxChord) {
    var Rules = function() {
        function Rules(_chord) {
            if (_chord === void 0) {
                _chord = null;
            }
            this.ruleMap = {};
            this.size = 0;
            this.set("EvenDistribution", {
                rule: "EvenDistribution",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var evenDistibution = 1 / bayes.hypothesis.length;
                    return evenDistibution;
                }
            });
            this.set("CountNotes", {
                rule: "CountNotes",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var hypoLen = bayes.hypothesis[col].len;
                    var chordLen = chord.chordInv[0].length;
                    var score;
                    if (hypoLen == chordLen) score = 1; else if (hypoLen > chordLen) score = 1 / (hypoLen - chordLen) * 2; else if (hypoLen < chordLen) score = 1 / (chordLen - hypoLen) * 2;
                    return score;
                }
            });
            this.set("MustHave", {
                rule: "MustHave",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var key = bayes.hypothesis[col].key;
                    var inv = bayes.hypothesis[col].inv;
                    var mustHave = chord.matchedNotes[key].mustHave[inv];
                    var score = 1 / (mustHave == 0 ? 1 : Math.abs(mustHave) * 2);
                    return score;
                }
            });
            this.set("Knockouts", {
                rule: "Knockouts",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var key = bayes.hypothesis[col].key;
                    var inv = bayes.hypothesis[col].inv;
                    var knockouts = chord.matchedNotes[key].knockouts[inv].length;
                    var score = 1 / (knockouts == 0 ? 1 : knockouts * 10);
                    return score;
                }
            });
            this.set("MatchedNotes", {
                rule: "MatchedNotes",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var key = bayes.hypothesis[col].key;
                    var inv = bayes.hypothesis[col].inv;
                    var chordLen = chord.chordInv[0].length;
                    var matches = chord.matchedNotes[key].invertions[inv].length;
                    var missing = chordLen - matches;
                    var missingTax = 2;
                    var score = matches / (bayes.hypothesis[col].len + missing * missingTax);
                    return score;
                }
            });
            this.set("RootFound", {
                rule: "RootFound",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var key = bayes.hypothesis[col].key;
                    var inv = bayes.hypothesis[col].inv;
                    var indexOfRoot = chord.matchedNotes[key].roots[inv];
                    var score;
                    if (CxChord.isNoRootChord(bayes.hypothesis[col].key)) {
                        score = indexOfRoot >= 0 ? .2 : .8;
                    } else if (indexOfRoot == 0) {
                        score = 1;
                    } else {
                        var inversionTax = .1 * inv;
                        score = indexOfRoot > 0 ? 1 - (inversionTax < 1 ? inversionTax : .8) : .2;
                    }
                    return score;
                }
            });
            this.set("Conflicts", {
                rule: "conclicts",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var key = bayes.hypothesis[col].key;
                    var inv = bayes.hypothesis[col].inv;
                    var conflicts = chord.matchedNotes[key].conflicts[inv];
                    var score = 1 / (conflicts == 0 ? 1 : conflicts * 100);
                    return score;
                }
            });
            this.set("ChordGroup", {
                rule: "ChordGroup",
                chord: _chord,
                ruleFx: function(chord, bayes, row, col) {
                    var score = 1 / chord.matchedNotes[bayes.hypothesis[col].key].group;
                    return score;
                }
            });
        }
        Rules.prototype.get = function(key) {
            return this.ruleMap[key];
        };
        Rules.prototype.has = function(key) {
            return _.has(this.ruleMap, key);
        };
        Rules.prototype.set = function(key, value) {
            this.ruleMap[key] = value;
            this.size = _.keys(this.ruleMap).length;
            return this.ruleMap[key];
        };
        return Rules;
    }();
    CxChord.Rules = Rules;
})(CxChord || (CxChord = {}));

var CxChord;

(function(CxChord) {
    CxChord.rootNoteNamesB = {
        sharp: [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ],
        flat: [ "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B" ]
    };
    function getRootNameB(root, sharpOrFlat) {
        if (sharpOrFlat === void 0) {
            sharpOrFlat = "flat";
        }
        var root = root < 0 ? root + 12 : root;
        return CxChord.rootNoteNamesB[sharpOrFlat][root];
    }
    CxChord.getRootNameB = getRootNameB;
})(CxChord || (CxChord = {}));