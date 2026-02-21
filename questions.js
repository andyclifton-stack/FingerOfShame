/* THE FINGER OF SHAME - DATA FILE
   Version: 1.1 (Cleaned & Polished)
*/

const COURT_DATA = [
    // --- General Fun ---
    "Who is most likely to survive a zombie apocalypse?",
    "Who is most likely to join a band by accident?",
    "Who is most likely to drop their phone in the toilet?",
    "Who is most likely to eat something off the floor (5-second rule)?",
    "Who takes the longest to get ready in the morning?",
    "Who is most likely to laugh at a completely inappropriate moment?",
    "Who is most likely to become a millionaire by accident?",
    "Who is most likely to trip over absolutely nothing?",
    "Who is the worst at keeping secrets?",
    "Who is most likely to talk to animals like they are people?",
    "Who eats the fastest?",
    "Who is most likely to get lost somewhere?",
    "Who is most likely to cheat at a board game?",
    "Who is the loudest person in the room?",
    "Who is most likely to buy something useless online?",
    "Who is most likely to lock themselves out of the house?",
    "Who is most likely to Google 'how to boil an egg'?",
    "Who is most likely to get into an argument with Google or Alexa?",
    "Who is most likely to accidentally insult a celebrity?",
    "Who is most likely to wear odd socks?",
    "Who is most likely to break their own bone doing something silly?",
    "Who is most likely to become a meme?",
    "Who is most likely to forget their own birthday?",
    "Who sings the wrong lyrics to songs?",
    "Who is most likely to push a 'pull' door?",
    "Who is most likely to send a text to the wrong person?",
    "Who is most likely to try and fix something and make it worse?",
    "Who is most likely to scream if they see a spider?",
    "Who is most likely to win a reality TV show?",
    "Who is most likely to fake an illness to get out of a plan?",
    "Who has the most screen time on their phone?",
    
    // --- NEW General Fun Additions ---
    "Who is most likely to talk to a wrong number on the phone for 20 minutes?",
    "Who is most likely to accidentally set something on fire while cooking?",
    "Who is most likely to wave at someone who wasn't waving at them?",
    "Who is most likely to get a song stuck in everyone else's head?",
    "Who is most likely to say 'you too' when a waiter says 'enjoy your meal'?",
    "Who is most likely to lose their glasses while they are on their head?",
    "Who is most likely to apologize to an object they bumped into (like a table)?",
    "Who is most likely to think they could land a plane in an emergency?",
    "Who is most likely to be the first one on the dance floor at a wedding?",
    "Who is most likely to get overly competitive during a game of Snap?",
    "Who is most likely to accidentally call a teacher 'Mum' or 'Dad'?",
    
    // --- Family Friendly "Adult" ---
    "Who is most likely to fall asleep first?",
    "Who is most likely to complain about the music volume?",
    "Who thinks they are funny but really aren't?",
    "Who is most likely to verify a fact on Wikipedia mid-argument?",
    "Who is most likely to embarrass the kids in public?",
    "Who is most likely to complain about the price of something?",
    "Who takes the most photos of their food?",
    "Who is most likely to fall asleep during a family movie?",
    "Who is most likely to struggle with the TV remote?",
    "Who is most likely to say 'It's too cold in here'?",
    "Who is most likely to make a dad joke?",

    // --- Kid Friendly ---
    "Who is most likely to refuse to eat their vegetables?",
    "Who is most likely to break something 5 minutes after getting it?",
    "Who has the messiest bedroom?",
    "Who is most likely to draw on the walls?",
    "Who is most likely to hide sweets in their pockets?",
    "Who is most likely to blame someone else for something they did?",
    "Who is most likely to try and stay up all night?",
    "Who is most likely to lose their shoes?",
    "Who makes the weirdest noises?",
    "Who is most likely to ask 'Are we there yet?' 100 times?",
    "Who is most likely to spill a drink at dinner?",
    "Who is most likely to wear a fancy dress costume to the supermarket?",
    "Who is most likely to talk with their mouth full?",
    "Who is most likely to 'forget' their homework (but not really)?",
    "Who is most likely to touch something they were told not to touch?"
];

const FORFEITS = [
    // --- Classics ---
    "Sing Jingle Bells", 
    "Refill everyone's drinks", 
    "Speak in a French Accent", 
    "Act like a chicken", 
    "Fast speaking for the next round", 
    "Stand on one leg for 30s", 
    "Best impression of a pig", 
    "No talking next round", 
    "Dance like a robot",
    "Try not to blink for 30s", 
    "Act like a monkey", 
    "Do your best evil laugh", 
    "Speak in slow motion",
    
    // --- Vocal Changes ---
    "Speak in a high-pitched voice for one round",
    "Whisper everything you say",
    "Speak like a Pirate (Arrr!)",
    "Sing everything like an Opera singer",
    "Speak without closing your mouth",
    "You must rhyme your next answer",
    "Ending every sentence with '...m'lord'",
    "Start every sentence with 'According to the prophecy...'",
    
    // --- Acting & Social ---
    "Do your best impression of the person to your left",
    "You cannot show your teeth for the next round",
    "Narrate everything you do for the next minute",
    "Stand up and make a formal apology to the room",
    "Give everyone in the room a sincere compliment",
    "Act shocked by everything anyone says",
    "Make your best fish face for 5 seconds",
    "Act like a news anchor reporting breaking news",
    "Salute the Judge every time they speak",
    "Hum a song until someone guesses it",
    "You are royalty - wave regally to everyone",
    "Pretend to be invisible",
    "Slow clap whenever someone speaks",
    "Act like you are underwater"
];

// Export to window scope so script.js can find it
window.gameDeck = COURT_DATA;
window.gameForfeits = FORFEITS;