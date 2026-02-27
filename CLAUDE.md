LONGEST VIEW: SAM HINKIE'S REVENGE
Master Build Prompt for Claude Code

You are building a complete browser-based 2D arcade beat-em-up video game called Longest View: Sam Hinkie's Revenge. This is a full production game — not a prototype. Build it properly, with clean code, modular file structure, and everything working end to end.
Read this entire document before writing a single line of code. This is your north star.

WHAT THIS GAME IS
A side-scrolling beat-em-up in the spirit of Double Dragon and Streets of Rage. The player controls Sam Hinkie — the analytically brilliant but ousted Philadelphia 76ers GM — as he fights through 5 levels of enemies, boss battles, side quest conversations, and cinematic cutscene moments. His weapon of choice is explosive ping pong balls (a nod to the NBA draft lottery). The game is both a love letter to "The Process" era of 76ers basketball and a sneaky advertisement for Money Never Sleeps (MNS), a fantasy basketball platform at MNS.COM.
The tone is: satirical, funny, nostalgic, self-aware. Think Adult Swim meets 1990s arcade cabinet.

TECH STACK
Set up the entire project from scratch. Do not ask me to run any terminal commands — handle all scaffolding, installs, and configuration yourself using Claude Code's ability to run shell commands.

Vite + React — app shell, menus, overlays, leaderboard UI
Phaser 3 — game engine (handles all game loop, physics, sprites, scenes, input, audio)
Supabase — leaderboard backend (scores, times, usernames, MNS email capture)
Howler.js — audio manager for sound effects and music (works alongside Phaser's audio)
Google Fonts: Press Start 2P — primary UI font throughout
Tailwind CSS — for React UI components outside the game canvas

Project structure:
longest-view/
├── public/
│   └── assets/
│       ├── sprites/         ← character spritesheets
│       ├── backgrounds/     ← level background layers
│       ├── ui/              ← HUD elements, buttons
│       ├── audio/
│       │   ├── music/       ← chiptune BGM per level
│       │   └── sfx/         ← sound effects
│       └── fonts/
├── src/
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── BootScene.js       ← preload all assets
│   │   │   ├── MainMenuScene.js   ← title screen
│   │   │   ├── Level1Scene.js
│   │   │   ├── Level2Scene.js
│   │   │   ├── Level3Scene.js
│   │   │   ├── Level4Scene.js
│   │   │   ├── Level5Scene.js
│   │   │   ├── CutsceneScene.js   ← handles all story cutscenes
│   │   │   ├── BossIntroScene.js  ← dramatic boss entrance screens
│   │   │   └── GameOverScene.js
│   │   ├── entities/
│   │   │   ├── Player.js          ← Hinkie class
│   │   │   ├── Ball.js            ← ping pong projectile
│   │   │   ├── FanEnemy.js        ← grunt enemy
│   │   │   ├── BossBrian.js       ← Brian Colangelo boss
│   │   │   ├── BossJerry.js       ← Jerry Colangelo boss
│   │   │   └── BossAdam.js        ← Adam Silver final boss
│   │   ├── systems/
│   │   │   ├── ScoreSystem.js
│   │   │   ├── ComboSystem.js
│   │   │   ├── DialogueSystem.js  ← side quest conversations
│   │   │   └── AudioSystem.js
│   │   └── config.js              ← Phaser game config
│   ├── components/
│   │   ├── GameCanvas.jsx         ← mounts Phaser inside React
│   │   ├── HUD.jsx                ← health, score, combo, charge bar
│   │   ├── MainMenu.jsx
│   │   ├── PauseMenu.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── ShareCard.jsx          ← viral result share card
│   │   ├── DialogueBox.jsx        ← side quest UI overlay
│   │   ├── MathChallenge.jsx      ← Brian boss math mechanic
│   │   └── MNSPromo.jsx           ← between-level MNS ad card
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                           ← SUPABASE_URL + SUPABASE_ANON_KEY
├── package.json
└── vite.config.js

VISUAL STYLE
This game must look and feel like a CRT arcade cabinet from 1992 running in a modern browser.

Color palette: Deep navy/black backgrounds. Gold (#E8B800) as the primary accent. Red (#CC2200) for danger/enemies. Cyan (#00D4FF) for power-ups and special moves. White for text.
Pixel art: All characters and environments are drawn programmatically using Phaser Graphics objects (rectangles, circles, lines) at low resolution then scaled up — no external image files required for the prototype. Each character should be recognizable: Hinkie wears a suit and glasses; Brian wears a slightly-too-tight suit; fan enemies wear 76ers jerseys.
Scanlines: Apply a full-screen CSS overlay with repeating scanlines at 50% opacity for that CRT monitor feel.
Screen shake: On every boss hit, strong punch, or explosion — shake the camera.
Parallax backgrounds: Each level has 3 layers scrolling at different speeds (far, mid, near). Details below per level.
Font: Press Start 2P everywhere — menus, HUD, floating score text, dialogue boxes, everything.
Resolution: Native canvas at 900x400, scaled to fill browser window while maintaining aspect ratio.
Mobile Gameboy layout: On screens under 768px wide, render a Gameboy Color shell around the game. The game screen occupies the top 60% of the viewport. The bottom 40% shows a D-pad on the left, A/B action buttons on the right, SELECT and START in the center. Style the shell in classic purple Gameboy Color colors with rounded corners.


AUDIO DESIGN
Audio is essential to the arcade feel. Use Howler.js for all audio management.
Sound Effects (generate procedurally using Tone.js or describe as AudioContext synthesis — no files required for prototype):
EventSound DescriptionPing pong throwShort ascending whistle, light and bouncyBall bounceSatisfying "thwack" — rubber on hardwoodRicochet hitHigher pitch bounce + crunchEnemy hitClassic 8-bit "oof" thudEnemy defeatedAscending 3-note chiptune fanfareBoss hitDeep bass thud + short rumbleMath correctAscending 5-note success jingleMath wrongDescending buzzer soundHealth lostLow descending toneCombo x2Short bright pingTRUST THE PROCESS modeBig ascending orchestral swell (8-bit)Level completeFull 8-bit fanfare, 3 secondsGame overSlow descending minor chordBoss introDramatic low drone + impact
Music (chiptune BGM, looped — use Web Audio API synthesis or describe for implementation):
LevelMusic VibeMain MenuTriumphant but melancholy chiptune. Think Rocky theme meets lo-fi.Level 1 — Wells FargoDriving, medium-tempo chiptune with a funky bass lineLevel 2 — Draft LotteryTense, building tension. Syncopated rhythm.Level 3 — Front OfficeCorporate-sounding opening that breaks into chaos mid-levelLevel 4 — VegasNeon-lit, fast-paced, slot machine bleeps in the melodyLevel 5 — BoardroomEpic, dramatic final stage music. Full orchestral chiptune.Boss fightsIntensity ramps up — faster tempo version of level musicCutscenesSlow, cinematic, emotional chiptune
Implement a MusicManager class that handles looping, crossfading between scenes, and volume control.

THE PLAYER CHARACTER: SAM HINKIE
Sam Hinkie is the protagonist. He is calm, methodical, and devastatingly effective.
Appearance (pixel art, drawn programmatically):

Navy suit with a red tie
Glasses (two small rectangles with a bridge)
Short brown hair
Confident, upright posture
Walk animation: 4 frames (arms swing, legs alternate)
Throw animation: 2 frames (wind-up, release)
Hurt animation: 1 frame (brief flash red)
Victory pose: Arms slightly raised, subtle nod

Controls:
InputActionArrow Left / AWalk leftArrow Right / DWalk rightArrow Up / W / Space (tap)JumpHold Space / Hold B buttonCharge throw (power bar fills)Release Space / Release BFire ping pong ballDouble-tap Left or RightDodge roll (brief invincibility frames)
The Charge Mechanic:

A blue power bar appears above Hinkie's head while charging
0-33% charge: small, slow ball — travels in an arc, 1 bounce max
34-66% charge: medium ball — faster, 2 bounces, slight glow
67-100% charge: full power — large glowing ball, 4 bounces, leaves a trail, screenshake on impact, plays a special "MAXIMUM PROCESS" sound
Fully charged shots have a 3x damage multiplier
A soft ping sound plays when the bar reaches 100%

Stats:

100 HP
3 lives per game
Invincibility frames: 45 frames after taking damage
Jump height: moderate (he's an NBA executive, not an athlete)


THE PING PONG BALL (Projectile)
The ping pong ball is the core weapon. It behaves as a real physics object.

White sphere with a subtle NBA logo mark on it
Leaves a brief white trail
Affected by gravity (arc downward)
Bounces realistically off the ground, walls, and environmental objects
Each bounce slightly reduces speed and size
Glows brighter the more fully charged
When a fully-charged ball defeats an enemy, it explodes in a shower of gold particles with the text "PROCESSED!" floating up
Ricochet kills (ball hits wall or ground before hitting enemy) are worth double points and trigger a special "ANALYTICS!" floating text
Multiple enemies can be hit by a single ball as it bounces — chain kills are possible


SCORING SYSTEM
ActionPointsGrunt enemy hit50 ptsGrunt enemy defeated100 ptsDirect ball hit150 ptsRicochet hit (1 bounce)300 ptsRicochet hit (2+ bounces)500 ptsSide quest correct answer500 ptsBrian math question correct750 ptsBoss hit200 ptsBoss phase cleared1,000 ptsBoss defeated2,000 ptsNo damage on a level1,000 pt bonusSpeed bonus (under par time)500-2,000 pts
Combo System:

Chain hits without taking damage to build a combo multiplier
2x combo at 3 hits, 3x at 6 hits, 5x at 10 hits
At 15 consecutive hits without damage: TRUST THE PROCESS MODE activates

Screen pulses gold
Hinkie's suit glows
All points 10x for 10 seconds
Special music sting plays
Text "TRUST THE PROCESS" blazes across the screen



Floating text:

All score popups float upward and fade out
Color coded: white = normal, cyan = ricochet, orange = combo, gold = boss hit, red = damage taken
Font: Press Start 2P, sized proportionally to the score value


LEADERBOARD
Supabase table: leaderboard
sqlcreate table leaderboard (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  score integer not null,
  time_seconds integer not null,
  mns_email text,
  created_at timestamp default now()
);

Global top 10 displayed after every game
Primary sort: completion time (fastest wins — most viral mechanic)
Secondary sort: score
After beating the game, player enters their name and optionally their email ("Join MNS to save your ranking")
The MNS email field is clearly optional but pitched as: "Trust the Process players track their stats. So do we."

Shareable Result Card (ShareCard.jsx):
Generated as a canvas screenshot after game completion. Shows:

"SAM HINKIE'S REVENGE" header
Player's time and score
Their rank on the leaderboard
"Can you Trust the Process faster?" tagline
MNS.COM URL
Gold and black color scheme, pixel font
Pre-formatted for Twitter/X sharing (1200x630px)
One-click share button


LEVEL DESIGN
Each level is wider than the screen (3600px wide) and scrolls horizontally as the player moves right. Enemies spawn in waves. MNS branding appears throughout each environment.

LEVEL 1: THE WELLS FARGO CENTER
Subtitle: "The Fans Don't Understand Yet"
Setting: Inside the Wells Fargo Center arena in Philadelphia. Concourse walls, banners, arena tunnel lighting. The crowd is hostile.
Background layers:

Far: Dark arena ceiling with spotlights
Mid: Banners on the wall — some real ("JULIUS ERVING #6"), some fake ("CHAMPIONSHIP BANNER — COMING SOON", "MNS.COM — MONEY NEVER SLEEPS")
Near: Concourse floor with floor tiles. Graffiti tags: "TANK JOB", "HINKIE WAS RIGHT", "MNS.COM", "PROCESS>>"

Enemies: Philly Fan Grunts only

Chunky guys in 76ers jerseys
They charge toward Hinkie yelling speech bubbles: "WHAT IS A PING PONG BALL", "JUST WIN GAMES BRO", "FIRE HIM NOW"
3 HP each
Attack: shove (contact damage)
Wave 1: 2 enemies. Wave 2: 3 enemies. Wave 3: 4 enemies with 1 faster "angry drunk" variant

Environmental objects:

Trash cans (can be hit with balls, fly across screen, stun nearby enemies)
Hot dog carts (knockable obstacles)
A cardboard sign that says "IN TANK WE TRUST" carried by an enemy

CUTSCENE — Level 1 opening (before gameplay):

Black screen. Text appears line by line.
"Philadelphia, 2013."
"Sam Hinkie has a plan."
"Nobody else understands it yet."
[Sam Hinkie walks on screen from the left. Stands still. Looks at camera.]
"..."
[He adjusts his glasses. Pulls a ping pong ball from his suit pocket.]
"Let's begin."
[Screen wipes to gameplay]

SIDE QUEST — mid-level:
A friendly analyst approaches with a clipboard. Dialogue box appears:

ANALYST: "Sam, the owner wants us to sign a 32-year-old point guard for $18M a year. He can still play."
[Option A] "Sign him. The fans will be happy."
[Option B] "Pass. We need the cap space for the right player in 3 years."


Option A: Crowd cheers, but Hinkie loses 10 HP and score multiplier drops
Option B: +500 pts, Daryl Morey appears briefly on a wall screen giving a thumbs up

Level 1 end: No boss. Just survive the mob. Level complete fanfare. Loading screen card with MNS copy:

"While Hinkie rebuilds Philly, rebuild your fantasy roster."
"MNS.COM — The smartest fantasy basketball platform on the internet."


LEVEL 2: THE NBA DRAFT LOTTERY ROOM
Subtitle: "In Ping Pong We Trust"
Setting: The NBA Draft Lottery stage in New York. Formal setup, numbered ping pong balls everywhere, nervous executives in suits, TV cameras.
Background layers:

Far: Dark blue curtain backdrop with the NBA logo
Mid: Lottery machine filled with glowing ping pong balls
Near: Stage floor, cameras on tripods, reporters. MNS.COM on a visible monitor in the background.

New mechanic introduced: Wall bounce combos. The environment has angled surfaces (camera equipment, stage steps) that balls can ricochet off. Tutorial popup: "Pro tip from Ben Falk: Angle your shots for maximum efficiency."
Enemies:

ESPN Analyst Grunts: Guys in blazers holding microphones. They throw microphones at you.
Talking Head variants: Float across the top of the screen reading bad takes. If you hit them with a ball, a wrong take gets crossed out and +300 pts.

CUTSCENE — mid-level:

Joel Embiid appears, limping, in street clothes (he's injured).
"Sam... I know you believe in me."
[Hinkie looks at him, nods once.]
"The best decisions look wrong before they look right."
[Embiid nods. Disappears offscreen. A ping pong ball rolls toward Hinkie from Embiid's direction.]
[Hinkie picks it up. It glows.]
Upgrade unlocked: "The Embiid Ball" — next shot is automatically fully charged.

SIDE QUEST:
A crying fan runs up:

FAN: "Is tanking even ethical? We're just losing on purpose!"
[Option A] "I understand your frustration. But short-term pain builds long-term championships."
[Option B] "Stats don't care about your feelings."
[Option C] "Have you heard of the 10,000 year clock?"


Option A: +500 pts. Fan nods and leaves.
Option B: Fan gets angry, joins the enemy wave.
Option C: Fan's head explodes (comically). +750 pts. "MAXIMUM HINKIE ENERGY" text.

Level 2 end: No boss. Fanfare. MNS loading screen:

"Draft night decisions define franchises. Your fantasy draft defines your season."
"Trust the process at MNS.COM"


LEVEL 3: THE 76ERS FRONT OFFICE
Subtitle: "Watch Your Back"
Setting: Corporate office environment. Cubicles, whiteboards covered in statistics, a glass-walled conference room, motivational posters that say things like "TEAMWORK" but Hinkie's version says "CONTRARIAN THINKING."
Background layers:

Far: Floor-to-ceiling windows with a Philadelphia skyline at night
Mid: Whiteboards with real-looking advanced stats formulas (True Shooting %, PER, VORP)
Near: Cubicles, office chairs, scattered draft boards. A whiteboard in the background reads "MNS.COM — WE DO THE ANALYTICS FOR YOU"

New mechanic: Destructible environment. Balls can shatter monitors (explosion of pixels), knock over cubicle walls (creates new ricochet surfaces), destroy coffee machines (stun effect radius on nearby enemies).
Enemies:

Suit-wearing yes-men: They agree with everything bad. Speech bubbles: "Brian says it's fine!", "Let's just sign a veteran!", "The analytics don't matter!"
PR Flacks: Throw press releases at Hinkie (paper airplanes that do minor damage)

BEN FALK ALLY MOMENT:
Ben Falk (quant analyst, real person) appears mid-level with a spreadsheet.

BEN FALK: "Sam. I ran the numbers. Forty-seven different scenarios. In 43 of them, the correct move is to not sign that point guard."
[Interact with Ben to receive a HEALTH RESTORE — he gives you a protein bar and a printout of advanced metrics]

BOSS: BRIAN COLANGELO
Brian enters from the right side of the screen in a suit that is visibly slightly too tight. He's holding a burner phone.
BOSS INTRO CUTSCENE:

[Screen goes black. Text appears:]
"BOSS: BRIAN COLANGELO"
"Son of Jerry. Destroyer of Processes."
"Anonymous Twitter account not yet proven."
[Brian walks on screen. Fixes his collar. Smirks.]
BRIAN: "You think your little ping pong balls can beat proper NBA experience?"
HINKIE: "..."
BRIAN: "...I'm going to take that as a yes."

Brian Colangelo Boss Mechanics — 3 phases:
Phase 1: Bad Arguments
Brian throws statistical arguments at Hinkie as glowing red projectiles. When one gets close, a dialogue box opens:

Projectile: "PER is the only stat that matters!"
[A] "True — it's comprehensive and simple."
[B] "PER ignores defense and pace entirely."
[C] "My grandma has a good PER."


Correct answer (B): Brian clutches his chest. Stamina bar drops. STRIKE WINDOW opens for 3 seconds — this is when you hit him with ping pong balls.
Wrong answer (A): Hinkie takes 10 damage. Brian laughs.
Funny answer (C): No effect but a floating "LOL" appears.

Other Brian arguments (randomized):

"Tanking is bad for the sport!" → Correct: "The Spurs tanked for Tim Duncan. It worked."
"Veterans are better than rookies!" → Correct: "Draft picks have higher upside per dollar."
"3-point shooting is a fad!" → Correct: "League 3PA has doubled since 2012."
"Trust your gut, not your spreadsheet!" → Correct: "Gut decisions have survivorship bias."

Phase 2: The Burner Phone (50% health)
Brian pulls out his burner phone. His health bar turns a slightly different color and text reads: "@Philly_Hoops_Truth HAS ENTERED THE CHAT"
Now tweets fly across the screen as physical projectiles you must dodge while still answering math questions:
Tweets as projectiles:

"@Philly_Hoops_Truth: Hinkie never watches film"
"@Philly_Hoops_Truth: Stats people never played the game"
"@Philly_Hoops_Truth: TRADE THE PICKS NOW"
"@Philly_Hoops_Truth: Embiid is a bust trust me"

Hit a tweet with a ball: +300 pts and it explodes with a satisfying pop.
Phase 3: Meltdown (25% health)
Brian starts throwing BOTH bad arguments AND tweets simultaneously. The music speeds up. Brian's suit gets visibly disheveled. His walk becomes frantic.
Defeat Brian: He drops to his knees. His burner phone slides across the floor. Hinkie walks over, picks it up, and pockets it.
VICTORY CUTSCENE:

[Brian, on his knees:]
BRIAN: "You can't prove anything."
HINKIE: [Holds up the burner phone. Looks at it. Puts it back in his pocket.]
"I don't need to."
[Level complete fanfare]

Reward: The Burner Phone item unlocked — used in Level 5.

LEVEL 4: THE LAS VEGAS SUMMER LEAGUE
Subtitle: "The Long Game"
Setting: Las Vegas Strip at night. Neon signs everywhere. A basketball court visible through hotel lobby windows. Slot machines. A massive "WELCOME TO THE NBA SUMMER LEAGUE" banner. One neon sign in the background reads "MNS.COM" in full glowing Vegas-style letters — this is the most prominent MNS placement in the game.
Background layers:

Far: Las Vegas skyline at night, glittering lights
Mid: Casino signs, a giant NBA Summer League banner, the MNS.COM neon sign
Near: Slot machines, lobby furniture, basketball hoops

New mechanic: Environmental richochet bonus areas — balls that bounce off slot machines trigger a "JACKPOT" sound and give 3x points on that hit. Random machines flash with a spinning animation indicating they're active bonus targets.
Enemies:

Degenerate Gambler Grunts: Disheveled guys who throw poker chips
Bad GM types: Wearing team polos, holding outdated scouting reports, throwing draft busts at you
"Skip Bayless Type": A loud guy with a microphone who debuffs your score if he hits you (his hot take drains your combo multiplier)

DARYL MOREY ALLY MOMENT:
Daryl Morey appears, casually eating a sandwich.

DARYL: "Sam. I just want you to know — everything you built in Philly was right. They just didn't have patience."
HINKIE: "How's Houston?"
DARYL: "We're exploring options."
[Daryl drops a power-up: "HOUSTON ANALYTICS PACK" — increases ball speed and ricochet distance for 30 seconds]

SIDE QUEST:
A promising undrafted prospect is sitting in the lobby, ignored.

SCOUT: "Sam — this kid went undrafted. International guy. Everyone passed."
[Option A] "Sign him to a two-way contract immediately."
[Option B] "We don't have cap space right now."


Option A: +750 pts. Kid does a celebratory dunk animation. "PROCESS PLAYER FOUND" text.
Option B: -250 pts. Kid gets signed by a rival. Sad trombone sound effect.

BOSS: JERRY COLANGELO
Old school NBA executive. Thinks it's still 1987. Wears a blazer from a different era. Moves slowly but hits hard.
BOSS INTRO CUTSCENE:

"BOSS: JERRY COLANGELO"
"NBA Legend. Conventional Wisdom Incarnate."
"He has a bust in the Hall of Fame. He would like you to know that."
[Jerry walks on screen slowly. Points a finger at Hinkie.]
JERRY: "Young man. I've been in this league since before you were born."
HINKIE: "I know."
JERRY: "Then you know why you're wrong."
HINKIE: "Do I?"
[Jerry throws his blazer off dramatically. It hits a fan grunt in the face. The fan grunt falls over.]

Jerry Colangelo Boss Mechanics — 2 phases:
Phase 1: Old School Stats
Jerry throws old-school statistics as projectiles. When one reaches Hinkie, a dialogue box opens:
Arguments and correct counters:

"Points per game is all that matters!" → "True Shooting % accounts for efficiency and shot selection."
"My guy averages 20 and 8!" → "On a 42% field goal percentage with no 3-point shot."
"Chemistry over analytics!" → "Chemistry is real, but you can't measure it, so you can't optimize it."
"Defense wins championships!" → "11 of the last 20 champions ranked top 5 in offensive rating."

Phase 2: The Network (50% health)
Jerry starts calling in favors. Miniature versions of NBA legends he's connected with briefly appear and throw things at Hinkie. Jerry himself starts moving faster.
Defeat Jerry: He sits down heavily on a slot machine, which starts spinning behind him. It lands on three ping pong balls. Jackpot sounds. Jerry looks at it in disgust.

JERRY: "This game has changed too much."
HINKIE: "Yes. It has."


LEVEL 5: THE NBA BOARD OF GOVERNORS
Subtitle: "The System Strikes Back"
Setting: The NBA Boardroom in New York. Marble floors. Long conference tables. Team owner portraits on the wall. Expensive everything. An American flag. The NBA logo backlit on the far wall.
Background layers:

Far: Floor-to-ceiling windows with Manhattan skyline
Mid: Portraits of team owners on the wall. One portrait has been replaced with a crude painting of a ping pong ball with a halo.
Near: Conference tables, leather chairs, scattered documents. One document visible on a table reads "MNS.COM PARTNERSHIP PROPOSAL."

Enemies:

Team Owner grunts: Fat cats in expensive suits throwing money bags
NBA Lobbyists: Guys in earpieces who throw rulebooks (if rulebook hits, one of your controls temporarily reverses)
League Office Drones: Move in perfect formation, all wearing identical suits

JOEL EMBIID ALLY MOMENT (Special):
Joel Embiid crashes through a wall. He's fully healthy. He's wearing his full 76ers uniform.

EMBIID: "SAM. I HEARD YOU WERE HERE."
HINKIE: [looks at the wall Embiid just destroyed] "How did you—"
EMBIID: "Not important. Let's go."

For 30 seconds, Embiid fights alongside Hinkie as an AI ally. He body-slams enemies (one-hit KOs grunts), sets screens for Hinkie (blocks incoming projectiles), and dunks on the conference table. Camera shake on every Embiid action. After 30 seconds:

EMBIID: "Okay I have to go. Media obligations."
[He disappears back through the wall he came in through.]
HINKIE: [looks at the audience] "He's going to be great."

THE BURNER PHONE SPECIAL MOVE:
In this level, pressing SHIFT or the SELECT button activates Brian's burner phone (collected in Level 3). Hinkie holds up the phone and a tweet gets published that stuns all on-screen enemies for 4 seconds. Can only be used 3 times total. Effect: all enemies stop, look at their phones, start arguing with each other, are temporarily stunned.
FINAL BOSS: ADAM SILVER
The NBA Commissioner. Polished. Powerful. Adaptive.
BOSS INTRO CUTSCENE:

[The room goes quiet. Everyone clears out. Adam Silver walks in slowly from the far end of the room.]
[He straightens his tie. Looks at Hinkie.]
ADAM: "You know why we're here, Sam."
HINKIE: "I have some theories."
ADAM: "The league has interests. Continuity matters. Tanking threatens the product."
HINKIE: "Or maybe the product should be better basketball."
[Long pause. Adam Silver smiles. It doesn't reach his eyes.]
ADAM: "Shall we?"

Adam Silver Boss Mechanics — 3 phases:
Phase 1: The Rules
Adam fights by summoning the official NBA rulebook. Rule cards float toward Hinkie — dodge or hit with ball. If a rule hits Hinkie, a random debuff activates (controls reverse briefly, screen dims, score multiplier drops).
Phase 2: He Changes the Rules (50% health)
Text appears: "ADAM SILVER HAS AMENDED THE RULES"
Midway through the fight, Adam pulls out a gavel and literally changes the game rules in real time. A notification appears:

⚠️ RULE CHANGE: Ping pong balls now bounce at half speed.
⚠️ RULE CHANGE: Combo multiplier capped at 2x.
⚠️ RULE CHANGE: Jump height reduced.

These debuffs are REAL — the game actually applies them. Players must adapt. The only way to reverse them: charge to full power and land a maximum-charge shot on Silver.
Phase 3: The Full Force of the League (25% health)
Adam summons a wall of owner portraits that become animated and throw money bags at Hinkie. Silver moves faster and deflects 50% of underpowered shots. Only full-charge shots can damage him in this phase.
Defeat animation:
Silver staggers. The owner portraits go dark. The rulebook falls. Silver adjusts his tie.

ADAM: [genuinely curious] "How did you do that?"
HINKIE: "Patience. Data. And ping pong balls."
[Hinkie turns to leave.]
ADAM: "...You were right about Embiid."
[Hinkie stops. Doesn't turn around.]
HINKIE: "I know."
[He walks out.]


CUTSCENE SYSTEM
All cutscenes use a dedicated CutsceneScene.js in Phaser that:

Fades to black between scene transitions
Displays pixel-art characters talking against simple backgrounds
Shows dialogue text letter-by-letter (typewriter effect, 40ms per character)
Plays appropriate music underneath
Has a SKIP button (ESC or START) that skips to the next scene

CREDITS CUTSCENE (after defeating Adam Silver):

Montage of all bosses defeated
Joel Embiid holding the championship trophy
Text: "SAM HINKIE WAS RIGHT."
Text: "THE PROCESS WORKED."
Text: "HE JUST WASN'T THERE TO SEE IT."
[Long pause]
Text: "His resignation letter is 13 pages long."
Text: "It references the Moa bird, Max Planck, and Warren Buffett."
Text: "It remains one of the greatest documents in NBA history."
[Fade to black]
MNS WIN SCREEN (see below)


MNS.COM INTEGRATION
Money Never Sleeps (MNS) is a fantasy basketball platform. This game is its sneakiest and most brilliant marketing vehicle. Every MNS touchpoint should feel natural, funny, and earned — never like an ad.
In-game placements:

Level 1: "MNS.COM" graffiti tag on arena concourse wall. "HINKIE WAS RIGHT × MNS.COM" stenciled on a column.
Level 2: A monitor in the background displays the MNS.COM homepage wireframe.
Level 3: A whiteboard reads "MNS.COM — WE DO THE ANALYTICS FOR YOU"
Level 4: A full Vegas neon sign: "MNS.COM — MONEY NEVER SLEEPS" in gold and white
Level 5: A document on the conference table reads "MNS.COM PARTNERSHIP PROPOSAL — APPROVED"
Brian's Burner Phone tweets occasionally reference MNS: "@Philly_Hoops_Truth: heard this MNS.COM thing actually knows what it's doing. suspicious."

Between-level loading screen cards (MNSPromo.jsx):
Each is a full-screen black card with gold text. Rotate through these:

"While Hinkie rebuilds Philly, rebuild your fantasy roster. MNS.COM"
"Sam trusted the long game. So do we. MNS.COM — Money Never Sleeps."
"Draft picks have value. So does good fantasy intel. MNS.COM"
"The Processometer says: your fantasy team needs an upgrade. MNS.COM"
"Brian Colangelo doesn't understand advanced stats. You do. Prove it at MNS.COM"
"Joel Embiid averaged 33/10/4 in his prime. Imagine having drafted him first. MNS.COM"

Win Screen:
After the credits sequence, a full-screen MNS CTA appears:

[Large text] "SAM TRUSTED THE PROCESS."
[Medium text] "DO YOU?"
[MNS.COM logo]
"Join the fantasy basketball platform built for people who actually understand basketball."
[Button: "SIGN UP AT MNS.COM"]
[Button: "SHARE MY SCORE"]
[Button: "PLAY AGAIN"]

The "SIGN UP" button opens MNS.COM in a new tab. The "SHARE MY SCORE" button generates the ShareCard and opens a Twitter share dialog.

MAIN MENU DESIGN
MainMenuScene.js / MainMenu.jsx:
The title screen should feel like a real arcade cabinet attract screen.

Animated title: "LONGEST VIEW" in large pixel text, with "SAM HINKIE'S REVENGE" as a subtitle
A looping animated sequence: Pixel Hinkie walking across the screen, throwing ping pong balls at fan grunts who scatter
Blinking "INSERT COIN / PRESS ENTER" text
Menu options: PLAY, LEADERBOARD, HOW TO PLAY, CREDITS
Scanline overlay on top of everything
The MNS.COM url displayed small but clearly at the bottom
High score displayed in top right corner

HOW TO PLAY screen:
Simple pixel-art diagram of controls. Key callout: the charge mechanic explanation with a visual demonstration of the ball arc at different charge levels.

MOBILE GAMEBOY LAYOUT
When viewport width < 768px:
Shell:

Purple Gameboy Color body, rounded rectangle
Dark screen area with slight inset/bezel
Speaker grille dots (purely decorative) on the right side of the shell
"LONGEST VIEW" printed on the shell below the screen in small pixel text

Controls layout:
┌────────────────────────────┐
│         SCREEN             │
│      (game canvas)         │
│                            │
├────────────────────────────┤
│  ←↑↓→        [A]  [B]     │
│  (D-pad)                   │
│                            │
│    [SELECT]  [START]       │
└────────────────────────────┘
D-pad: touch events tied to movement keys
A Button (gold): Charge/throw — hold to charge, release to fire
B Button (cyan): Jump
SELECT: Pause
START: Skip cutscene / confirm
All buttons use touch events with proper preventDefault to avoid scroll interference.

IMPLEMENTATION INSTRUCTIONS FOR CLAUDE CODE
Now that you have the full spec, here is how to approach the build:
Step 1: Project scaffold

Use npm create vite@latest longest-view -- --template react
Install all dependencies: phaser, @supabase/supabase-js, howler, tailwindcss
Set up Tailwind, configure vite.config.js
Create the full folder structure as described above
Create .env with placeholder Supabase keys

Step 2: Phaser + React integration

Create GameCanvas.jsx that mounts a Phaser.Game instance inside a React div
Pass React state setters into Phaser via the game registry (for score, health, etc.)
HUD lives in React (overlaid on top of canvas via absolute positioning)
Dialogue boxes, math challenges, leaderboard — all React components

Step 3: Core systems first
Build in this order:

Player.js — movement, jumping, facing direction, walk animation
Ball.js — physics, bouncing, charge levels, trail effect
FanEnemy.js — walk toward player, contact damage, stun/defeat states
ScoreSystem.js and ComboSystem.js
AudioSystem.js — all sound effects (synthesized, no files needed)

Step 4: Level 1 complete
Get a full playable Level 1 before touching other levels. Every system tested.
Step 5: Build level by level
Each level builds on the previous. Don't start Level 3 until Level 2 is done.
Step 6: Boss fights
Each boss is its own complex system. BossBrian.js has the most logic — build it carefully.
Step 7: Cutscenes
Implement CutsceneScene.js last — it's polish, not core gameplay.
Step 8: Supabase
Wire up leaderboard last, once the game is fully playable.
Step 9: Mobile
Apply Gameboy CSS wrapper last as a responsive overlay.

IMPORTANT NOTES

No external sprite files required. All characters drawn programmatically with Phaser Graphics. This keeps the project self-contained.
Audio synthesis over audio files. Use Web Audio API or Tone.js to generate all sounds programmatically. No .mp3 files needed.
The game must run at 60fps. Optimize accordingly.
The Brian boss math mechanic pauses the Phaser game loop while the React DialogueBox/MathChallenge component is visible. Resume the loop on answer selection.
Keep all MNS copy cheeky and self-aware — this is humor-based marketing, not sincere ad copy.
The game should be beatable in approximately 15-20 minutes for a skilled player, 25-30 for a first-timer. This is the ideal speedrun window for leaderboard competition.


Begin with Step 1. Scaffold the project. Then confirm back with: "Longest View is scaffolded. Ready to build Player.js and core systems."