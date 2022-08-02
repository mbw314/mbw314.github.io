let WIDTH = 250;
let HEIGHT = 250;
let canvasUtil;
let paused = false;
let mouseX = 1;
let mouseY = 1;
let sb;

DICT = ['arum',
 'apathy',
 'allegro',
 'archetypical',
 'articulate',
 'anhydride',
 'amplitude',
 'antebellum',
 'altar',
 'acquittal',
 'altair',
 'adjunct',
 'augmentation',
 'angeline',
 'anna',
 'aloof',
 'above',
 'auxin',
 'array',
 'alarm',
 'abel',
 'abide',
 'aborning',
 'afire',
 'aphid',
 'arboreal',
 'appliance',
 'angora',
 'angela',
 'accipiter',
 'amphibian',
 'antipode',
 'arterial',
 'aztec',
 'adjourn',
 'ahem',
 'anonymity',
 'again',
 'apache',
 'athlete',
 'ammonium',
 'abetted',
 'analytic',
 'arpa',
 'adoption',
 'agitate',
 'ammonia',
 'acrobacy',
 'anita',
 'appreciable',
 'ancient',
 'albumin',
 'arena',
 'ablate',
 'airlift',
 'arctangent',
 'arden',
 'agamemnon',
 'adirondack',
 'actinolite',
 'adventure',
 'acquitting',
 'america',
 'avery',
 'abolition',
 'adrenalin',
 'along',
 'akin',
 'attainder',
 'attrition',
 'argumentation',
 'axiom',
 'appoint',
 'ancillary',
 'admonition',
 'antietam',
 'advance',
 'anteater',
 'award',
 'agenda',
 'anaglyph',
 'amatory',
 'autumn',
 'audiotape',
 'aforementioned',
 'armata',
 'abduct',
 'alkaline',
 'aplomb',
 'agrimony',
 'aerodynamic',
 'aromatic',
 'acculturate',
 'accept',
 'artery',
 'anthony',
 'aleck',
 'armload',
 'angelina',
 'avid',
 'abeyant',
 'auntie',
 'andean',
 'alewife',
 'audio',
 'argonne',
 'alberich',
 'allergic',
 'adultery',
 'agricultural',
 'alton',
 'accredit',
 'albania',
 'audition',
 'automat',
 'ambiance',
 'abram',
 'applejack',
 'anathema',
 'allyn',
 'airmen',
 'authentic',
 'alienate',
 'aphelion',
 'arragon',
 'alternate',
 'allotting',
 'antarctica',
 'auger',
 'affine',
 'airlock',
 'autocratic',
 'archive',
 'alhambra',
 'alabamian',
 'algeria',
 'azimuthal',
 'achieve',
 'able',
 'arboretum',
 'awake',
 'alexandria',
 'acumen',
 'afterlife',
 'aerofoil',
 'arizona',
 'anchorite',
 'artificial',
 'announce',
 'almaden',
 'almanac',
 'anionic',
 'agate',
 'agatha',
 'artichoke',
 'aboriginal',
 'accra',
 'atwater',
 'acquire',
 'accuracy',
 'avocet',
 'ablaze',
 'alike',
 'afterbirth',
 'audience',
 'auckland',
 'aldrich',
 'axolotl',
 'atwood',
 'aitken',
 'adamant',
 'afferent',
 'acme',
 'allocable',
 'anaphora',
 'altern',
 'antoine',
 'alpaca',
 'april',
 'allergy',
 'actor',
 'archaic',
 'archipelago',
 'amount',
 'apollonian',
 'abominable',
 'amoral',
 'album',
 'aphrodite',
 'amen',
 'alice',
 'apport',
 'areaway',
 'adequate',
 'allegoric',
 'alight',
 'acreage',
 'abbot',
 'afterward',
 'alameda',
 'acorn',
 'aldermen',
 'aaron',
 'archae',
 'atrocity',
 'autocrat',
 'acrobatic',
 'armchair',
 'acidify',
 'affect',
 'ackerman',
 'aegean',
 'alundum',
 'apatite',
 'alacrity',
 'abandon',
 'albany',
 'argon',
 'agouti',
 'araby',
 'amble',
 'axiomatic',
 'alive',
 'airfare',
 'appreciate',
 'ahead',
 'antimony',
 'allotropic',
 'attempt',
 'adjudge',
 'acuity',
 'attentive',
 'acolyte',
 'ackley',
 'attache',
 'artie',
 'ammerman',
 'autopilot',
 'aggrieve',
 'apical',
 'apex',
 'axle',
 'abode',
 'amanita',
 'abject',
 'anabel',
 'airpark',
 'amort',
 'algorithmic',
 'acknowledgeable',
 'afterthought',
 'antelope',
 'antivenin',
 'anhydrite',
 'achromatic',
 'abundant',
 'anneal',
 'anti',
 'acrophobia',
 'anatomy',
 'alexandre',
 'arachne',
 'angelo',
 'arlene',
 'alpha',
 'alger',
 'agee',
 'abate',
 'amoeboid',
 'ambivalent',
 'applicate',
 'airflow',
 'afrikaner',
 'armonk',
 'ambient',
 'analogy',
 'alone',
 'attribution',
 'afghan',
 'adjutant',
 'ammoniac',
 'ambulatory',
 'agar',
 'anger',
 'advert',
 'attitude',
 'anton',
 'aile',
 'amalgamate',
 'accede',
 'arbitrary',
 'allah',
 'argument',
 'animal',
 'adrenal',
 'acidic',
 'amplify',
 'abdomen',
 'affirmative',
 'apiece',
 'article',
 'arclength',
 'airedale',
 'antigorite',
 'anyhow',
 'andorra',
 'augean',
 'appleby',
 'aluminate',
 'avocado',
 'armadillo',
 'avowal',
 'attribute',
 'aviate',
 'appetite',
 'aorta',
 'admiration',
 'artifact',
 'arraign',
 'amende',
 'anomaly',
 'aroma',
 'abut',
 'appointe',
 'androgen',
 'amniotic',
 'argo',
 'allocate',
 'alamo',
 'avoid',
 'automate',
 'anticipate',
 'aeolian',
 'allyl',
 'amazon',
 'agglutinin',
 'abbey',
 'anion',
 'academy',
 'alderman',
 'ample',
 'aviatrix',
 'archenemy',
 'attendant',
 'attention',
 'adair',
 'alizarin',
 'alveoli',
 'aqueduct',
 'abdominal',
 'academic',
 'annex',
 'aboveground',
 'attlee',
 'agglutinate',
 'arabia',
 'alimentary',
 'appleton',
 'accouter',
 'agile',
 'accrue',
 'authoritarian',
 'anacreon',
 'articulatory',
 'approximant',
 'arcane',
 'archival',
 'adelaide',
 'aleutian',
 'aquatic',
 'arrack',
 'appendage',
 'aztecan',
 'adject',
 'analogue',
 'amaze',
 'arrear',
 'atlanta',
 'appearance',
 'atonic',
 'ameliorate',
 'althea',
 'annular',
 'arteriole',
 'abraham',
 'appian',
 'abalone',
 'atoll',
 'accordion',
 'alibi',
 'alfalfa',
 'allotted',
 'agreeable',
 'awhile',
 'annulling',
 'argonaut',
 'arcana',
 'alumina',
 'arctan',
 'alveolar',
 'addenda',
 'amygdaloid',
 'alkali',
 'alden',
 'amide',
 'apothegm',
 'athletic',
 'adopt',
 'arrowroot',
 'anorthic',
 'analeptic',
 'aldebaran',
 'adenine',
 'artillery',
 'armature',
 'ache',
 'arbiter',
 'algonquin',
 'adequacy',
 'amerada',
 'automotive',
 'arturo',
 'arlen',
 'algonquian',
 'atlantic',
 'almond',
 'abound',
 'avarice',
 'anecdote',
 'alliance',
 'alleyway',
 'arnold',
 'aviv',
 'amity',
 'alia',
 'apology',
 'abbreviate',
 'argumentative',
 'aida',
 'alcoholic',
 'amid',
 'abhorred',
 'apply',
 'although',
 'architecture',
 'auerbach',
 'apprehend',
 'acid',
 'acquaintance',
 'aviary',
 'ajax',
 'allentown',
 'admire',
 'antipodal',
 'anamorphic',
 'airdrop',
 'area',
 'annoyance',
 'andrew',
 'annie',
 'attend',
 'actuarial',
 'appalachia',
 'albino',
 'andrei',
 'annual',
 'attendee',
 'aftermath',
 'attune',
 'anywhere',
 'aiken',
 'aerate',
 'antipathy',
 'antony',
 'arabic',
 'apartheid',
 'alberto',
 'apprentice',
 'allure',
 'abet',
 'addition',
 'affirmation',
 'auditory',
 'amok',
 'autoclave',
 'averred',
 'amply',
 'autocollimate',
 'afford',
 'airport',
 'applique',
 'alicia',
 'allegheny',
 'avocate',
 'alto',
 'amelia',
 'aura',
 'at&t',
 'alpert',
 'anarchic'
];

class SpellingBeeGame {
  constructor(dictionary, minWordLength, minNumValidWords) {
    this.initialized = false;
    this.dictionary = new Set(dictionary);
    // assert min_length >= 4, f"The minimum word length is 4 ({min_length} was provided)."
    this.minWordLength = minWordLength;
    this.minNumValidWords = minNumValidWords;

    // will be set when the game is initialized
    this.letters = new Set();
    this.requiredLetter = "";
    this.validWords = new Set();
    this.maxScore = 0;

    // state game in progress
    this.foundWords = new Set();
    this.score = 0;
  }

  randomizedLetters() {
    // required letter is always first
    let head = [this.requiredLetter.toUpperCase()];
    let tail = shuffleArray([...this.letters].filter(a => a != this.requiredLetter).map(a => a.toUpperCase()));
    return head.concat(tail);
  }

  resetEverything() {
    this.letters = new Set();
    this.requiredLetter = "";
    this.validWords = new Set();
    this.maxScore = 0;
    this.foundWords = new Set();
    this.score = 0;
  }

  processWord(word) {
    let msg = "";
    if (word.length < this.minWordLength) {
      msg = "The word is too short."
      console.log("The word is too short.");
      return [false, msg];
    }
    if (![...word].includes(this.requiredLetter)) {
      msg = "The word does not contain the required letter."
      console.log(msg);
      return [false, msg];
    }
    if ([...this.foundWords].includes(word)) {
      msg = "The word has already been found."
      console.log(msg);
      return [false, msg];
    }
    if (!isSuperset(this.letters, new Set(word))) {
      msg = "The word can only contain letters from the given set of letters."
      console.log(msg);
      return [false, msg];
    }

    if (this.dictionary.has(word)) {
        this.foundWords.add(word);
        this.score += word.length;
        msg = "The word is valid.";
        console.log(msg);
        return [true, msg];
    } else {
        msg = "The word is not in the dictionary.";
        console.log(msg);
        return [false, msg];
    }
  }

  progressStr() {
    return `PROGRESS: ${this.foundWords.size} / ${this.validWords.size}`;
  }

  wordsRemaining() {
    return this.validWords.size - this.foundWords.size;
  }

  pointsRemaining() {
    return this.maxScore - this.Score;
  }

  initializeRandomGame() {
    let potentialSeedWords = [...this.dictionary]
      .filter(w => ![...w].includes("s"))
      .filter(w => new Set(w).size == 7);
    console.log(`potentialSeedWords ${potentialSeedWords.length}`);
    let seedWord = potentialSeedWords[Math.floor(Math.random() * potentialSeedWords.length)];
    let seedWordLetters = [...new Set(seedWord)];
    let requiredLetter = seedWordLetters[Math.floor(Math.random() * seedWordLetters.length)];

    console.log(seedWord, requiredLetter)

    this.initializeGameFromSeedWord(seedWord, requiredLetter);

    return true;
  }

  initializeGameFromSeedWord(seedWord, requiredLetter) {
    let msg = "success";
    let reducedSeedLetters = new Set(seedWord.toLowerCase());
    if (reducedSeedLetters.has("s")) {
      msg = "The seed word cannot contain the letter 's'."
      console.log(msg);
      return [false, msg];
    }
    if (reducedSeedLetters.size != 7) {
      msg = `The seed word must have exactly 7 distinct letters.`
      console.log(msg);
      return [false, msg];
    }
    if (!reducedSeedLetters.has(requiredLetter)) {
      msg = `The required letter (${requiredLetter}) is not in the provided word.`
      console.log(msg);
      return [false, msg];
    }
    if (!this.dictionary.has(seedWord.toLowerCase())) {
      msg = "The seed word is not in the game dictionary."
      console.log(msg);
      return [false, msg];
    }

    let validWords = [...this.dictionary]
      .filter(w => w.length >= this.minWordLength)
      .filter(w => [...w].includes(requiredLetter))
      .filter(w => isSuperset(reducedSeedLetters, new Set(w)));

    console.log(`found ${validWords.length} valid words: ${validWords}`);

    if (validWords.length <= this.minNumValidWords) {
      msg = `The resulting list of valid words is too short. (${validWords.length} < ${this.minNumValidWords})`
      console.log(msg);
      return [false, msg];
    } else {
      // valid seed word
      this.resetEverything();
      this.letters = reducedSeedLetters;
      this.requiredLetter = requiredLetter;
      this.validWords = new Set(validWords);
      this.maxScore = validWords.map(w => w.length).reduce((a, b) => a + b);
      this.initialized = true;
      msg = "Game initialized."
      return [true, msg];
    }
  }
}


function ev_mousemove(e) {
  const rect = canvas.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top
}


function pauseDrawing() {
  paused = !paused;
}


function drawLetters(letters) {
  canvasUtil.clearCanvas();
  // console.log(letters);
  let theta = 2 * Math.PI / (letters.length - 1);
  let x0 = WIDTH / 2;
  let y0 = HEIGHT / 2;
  let r0 = 30;
  let r1 = 80;
  let textSize = 20;
  canvasUtil.ctx.textAlign = "center";
  canvasUtil.drawCircle(x0, y0, r0, "black", 1);
  canvasUtil.drawCircle(x0, y0, r1, "black", 1);
  canvasUtil.drawText(letters[0], x0, y0 + textSize / 2, textSize)

  for (let i=0; i<letters.length-1; i++) {
    canvasUtil.drawText(
      letters[i+1],
      x0 + 0.5 * (r0 + r1) * Math.cos(theta * i),
      y0 + 0.5 * (r0 + r1) * Math.sin(theta * i) + textSize / 2,
      textSize
    );
    canvasUtil.drawLine(
      x0 + r0 * Math.cos(theta * i + theta / 2),
      y0 + r0 * Math.sin(theta * i + theta / 2),
      x0 + r1 * Math.cos(theta * i + theta / 2),
      y0 + r1 * Math.sin(theta * i + theta / 2),
      "black",
      1
    );
  }
}

function submitWord() {
  let word = document.parameters.input.value;
  let result = sb.processWord(word);
  let success = result[0];
  let msg = result[1];
  if (success) {
    let wordDisplay = [...sb.foundWords].join("\n");
    let header = "";
    if (sb.validWords.size == sb.foundWords.size) {
      header = "GAME COMPLETE!\n";
    } else {
      header = sb.progressStr() + "\n";
    }
    document.outform.wordlist.value = header + wordDisplay;
    document.outform.wordlist.rows = sb.foundWords.size + 1;
  }
  document.msgform.message.value = msg;
}

function newPuzzle() {
  let input = document.parameters.input.value;
  let splitInput = input.split(" ");
  let result = sb.initializeGameFromSeedWord(splitInput[0], splitInput[1]);
  let success = result[0];
  let msg = result[1];
  document.msgform.message.value = msg;
  shuffleDisplay();
  document.outform.wordlist.value = sb.progressStr() + "\n";
  document.outform.wordlist.rows = sb.foundWords.size + 1;
  document.msgform.message.value = "";
}

function newPuzzleRandom() {
  console.log("new puzzle random")
  sb.initializeRandomGame();
  shuffleDisplay()
  document.outform.wordlist.value = sb.progressStr() + "\n";
  document.outform.wordlist.rows = sb.foundWords.size + 1;
  document.msgform.message.value = "";
}

function shuffleDisplay() {
  drawLetters(sb.randomizedLetters());
}

function endGame() {
  let wordDisplay = "GAME ENDED:\n" + [...sb.validWords].map(w => {
    if (!sb.foundWords.has(w)) {
      return w + " (missing)"
    } else {
      return w
    }
  }).join("\n");
  document.outform.wordlist.value = wordDisplay;
  document.outform.wordlist.rows = sb.validWords.size + 1;
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvas.addEventListener('mousemove', ev_mousemove, false);
    canvasUtil.clearCanvas();

    sb = new SpellingBeeGame(DICT, 4, 2);
    newPuzzleRandom();
    shuffleDisplay();

  } else {
    alert('You need a better web browser to see this.');
  }
}
