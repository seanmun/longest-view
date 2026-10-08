// Every question in the game. Edit copy here; nothing else needs to change.
//
// Each fan (or crew) asks one question, once. Hinkie picks from 3 answers
// (shown in random order). Exactly one is `correct`; every answer has a
// one-line `reaction`. `explain` (optional) is shown after any answer.
// `snub` is what a fan says if Hinkie comes back after a wrong answer.
//
// Lines marked PLACEHOLDER are stand-ins for Sean to punch up.

export const QUESTIONS = {
  // Fan 1 (easy)
  sean: {
    ask: "We're 12-40. Can we at least win a few so we don't look pathetic?",
    answers: [
      { text: 'Absolutely. The fans deserve wins.', reaction: 'Sounds like something Eskin would say.' },
      { text: 'Sign a couple vets to steady the ship.', reaction: 'Great. 28 wins and the 11th pick. Again.' }, // PLACEHOLDER
      { text: 'Play the kids. Ping-pong balls over pride.', correct: true, reaction: "The longest view in the room. I'm in." },
    ],
    snub: "You had your chance, Sam. Go get your wins.", // PLACEHOLDER
  },

  // Fan 2 (easy)
  woods: {
    ask: 'A contender wants to dump a bad contract on us and attach a first. Why eat that money?',
    answers: [
      { text: "We won't. That space is for a big free agent.", reaction: 'Name one big free agent who wants to come here. I’ll wait.' }, // PLACEHOLDER
      { text: 'Pass. Bad contracts are bad, period.', reaction: 'Wow. Deep. Did you read that on a cereal box?' }, // PLACEHOLDER
      { text: 'Take it. Unused cap space is worth nothing; a first is an option on the future.', correct: true, reaction: 'Just ask Sacramento.' },
    ],
    snub: "We'll be over here not taking free firsts.", // PLACEHOLDER
  },

  // Fan 3 (medium: the exception)
  steve: {
    ask: "Our MVP's in his prime, we're one piece away, and an All-Star wants out. Trade the picks?",
    answers: [
      { text: 'Never. The picks are sacred.', reaction: 'The picks were never the point, Sam. You of all people know that.' }, // PLACEHOLDER
      { text: 'Wait a year and see if the price drops.', reaction: "Windows don't wait. Ask every team that waited." }, // PLACEHOLDER
      { text: "Push all in. The window's open, and that's what the picks were for.", correct: true, reaction: "THAT'S the Process. Patience until it's time to strike." }, // PLACEHOLDER
    ],
    snub: 'Still waiting on that window, huh?', // PLACEHOLDER
  },

  // Fan 4 (hard: clean answer, three layers)
  kirby: {
    ask: "Why'd we give a 34-year-old Paul George $212 million?!",
    answers: [
      { text: "Mistake. With his injury history we should've rolled that space into next summer.", reaction: 'That space existed exactly once. You would have wasted it.' }, // PLACEHOLDER
      { text: "Fine, but we should've split it across two or three $20M role players.", reaction: 'Three role players nobody will ever trade for. Pass.' }, // PLACEHOLDER
      { text: "Max space existed exactly once, thanks to Maxey's cap hold, and a $50M salary is our ticket into the next star trade.", correct: true, reaction: "...Okay. That's actually airtight." }, // PLACEHOLDER
    ],
    explain: [
      "The apron rules mean you can't stack stars by blowing past the tax anymore. Cap space is the path, and few teams had it.",
      'Maxey waited a year on his extension, so he carried a $13M cap hold instead of a ~$35M salary. That opened ~$65M in space. They signed George first, the best free agent actually on the market, then signed Maxey (5 yr/$204M) on Bird rights.',
      "A ~$50M contract matches a disgruntled star's salary. That's exactly what let us flip George for Jaylen Brown.",
    ],
    snub: "Come back when you've read the CBA.", // PLACEHOLDER
  },

  // Fan 5 (hardest: the heart) asked by Hinkie's Henchmen
  henchmen: {
    ask: "Embiid's hurt again. Was the max extension a mistake?",
    answers: [
      { text: "No. He's the franchise, and you always pay the franchise.", reaction: "Sentiment isn't a strategy, Sam." }, // PLACEHOLDER
      { text: "Yes. We should've traded him. Never pay for a medical file.", reaction: "You'd dump a generational talent over a medical file? Come on." }, // PLACEHOLDER
      { text: 'Keep him, but not on the full max. A friendlier deal keeps the player AND the optionality.', correct: true, reaction: "...That's the one even believers fight about. Fine. I'm with you." },
    ],
    explain: [
      'He was a former MVP coming off a historic scoring season who played the playoffs hobbled and was key to Olympic gold.',
      'But the injury history was the most knowable fact on the table, so the full max was the sentimental move.',
      'And after a decade of patience, the debt runs both ways.',
    ],
    snub: "The Henchmen have spoken. You're not one of us.", // PLACEHOLDER
  },
}
