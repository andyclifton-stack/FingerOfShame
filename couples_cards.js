// Categories: 'romance', 'chore', 'fun', 'veto'

const hellNoCard = {
    emoji: "🧨", 
    title: "HELL NO", 
    category: "veto",
    desc: "VETO POWER: Cancel the last card played against you."
};

const highStakesCard = {
    emoji: "🎰",
    title: "The Gamble",
    category: "veto",
    desc: "Make a custom wish. COST: randomly destroys 2 other cards in your hand."
};

const cardPool = [
    // --- Originals & Approved ---
    { emoji: "🤐", category: "fun", title: "Argument Cooldown", desc: "Stop arguing immediately. Resume discussion later when calm." },
    { emoji: "🚫", category: "veto", title: "Get Out of Jail Free", desc: "Veto one activity, chore, or social obligation without question." },
    { emoji: "🏋️", category: "fun", title: "30-Min Exercise", desc: "Recipient must perform a workout of their choice for 30 minutes." },
    { emoji: "🥞", category: "romance", title: "Breakfast in Bed", desc: "Redeemer gets breakfast served in bed tomorrow morning." },
    { emoji: "🐕", category: "chore", title: "Walk the Dog", desc: "Recipient must do the next dog walk (solo or accompanied)." },
    { emoji: "🍕", category: "fun", title: "Takeaway Night", desc: "Redeemer gets to pick the food location and order." },
    { emoji: "🛍️", category: "chore", title: "Go Clothes Shopping", desc: "Recipient joins a shopping trip without complaining or rushing." },
    { emoji: "💆", category: "romance", title: "Massage", desc: "Redeemer receives a 10-minute foot or back rub." },
    { emoji: "📺", category: "fun", title: "Movie Choice", desc: "Redeemer controls the remote and picks the film/show." },
    { emoji: "🛌", category: "romance", title: "The Lie-In", desc: "Recipient handles the morning routine; Redeemer sleeps in." },
    { emoji: "☕", category: "chore", title: "Tea/Coffee Command", desc: "Make me a hot drink right now, exactly how I like it." },
    { emoji: "📵", category: "fun", title: "Phone-Free Hour", desc: "Both parties must put phones in a drawer for 1 full hour." },
    { emoji: "🌹", category: "romance", title: "Date Night", desc: "Recipient must plan and execute a date night." },
    { emoji: "🧹", category: "chore", title: "Chores Pass", desc: "Skip one specific household chore today." },
    { emoji: "🥺", category: "fun", title: "The 'Yes' Card", desc: "Recipient must say yes to one reasonable request." },
    { emoji: "🕷️", category: "chore", title: "Spider Duty", desc: "You must remove the next spider or bug found in the house." },
    { emoji: "🗑️", category: "chore", title: "Bin Day Champion", desc: "You handle all rubbish and recycling duties for this week." },
    { emoji: "🚗", category: "chore", title: "Designated Driver", desc: "You are driving to/from the next event. No complaints." },
    { emoji: "🥪", category: "chore", title: "Lunch Maker", desc: "Make me a packed lunch for work tomorrow." },
    { emoji: "🧼", category: "chore", title: "Washing Up", desc: "You wash/dry the dishes (or load/unload the dishwasher) tonight." },
    { emoji: "🧺", category: "chore", title: "Laundry Legend", desc: "You wash, dry, and fold one load of laundry start to finish." },
    { emoji: "🛁", category: "romance", title: "Run Me A Bath", desc: "Prepare a relaxing bath with bubbles/candles for me." },
    { emoji: "👗", category: "fun", title: "Outfit Approval", desc: "I pick your outfit for our next outing (within reason)." },
    { emoji: "🤫", category: "fun", title: "Silence is Golden", desc: "10 minutes of absolute silence. No questions, no talking." },
    { emoji: "🎮", category: "fun", title: "Gamer Pass", desc: "1 hour of uninterrupted video game (or hobby) time." },
    { emoji: "📱", category: "fun", title: "Social Media Ban", desc: "I pick a photo of us to post on your social media." },
    { emoji: "📸", category: "fun", title: "Paparazzi", desc: "Take a nice photo of me until I am happy with the angle." },
    { emoji: "🕺", category: "fun", title: "Dance Monkey", desc: "You must perform a 30-second dance to a song of my choice." },
    { emoji: "🎤", category: "fun", title: "Karaoke Star", desc: "Sing one song loudly and proudly right now." },
    { emoji: "👑", category: "fun", title: "Royal Treatment", desc: "Address me as 'Your Majesty' for the next hour." },
    { emoji: "🧊", category: "romance", title: "Treat Run", desc: "Go to the shop specifically to get me a treat." },
    { emoji: "🍹", category: "fun", title: "Bartender", desc: "Mix me a fancy cocktail or mocktail right now." },
    { emoji: "🥐", category: "romance", title: "Bakery Run", desc: "Go get fresh pastries/bread for breakfast." },
    { emoji: "💤", category: "romance", title: "Nap Time", desc: "I get a 30-minute nap. Do not disturb." },
    { emoji: "🌵", category: "chore", title: "Plant Waterer", desc: "Water all the house plants today." },
    { emoji: "🧘", category: "romance", title: "Calm Down", desc: "We both take 5 deep breaths together. Reset the mood." },
    { emoji: "👨‍🍳", category: "chore", title: "Chef for the Night", desc: "You are responsible for cooking a proper dinner tonight (and cleaning up)." },
    { emoji: "🌪️", category: "chore", title: "Hoover Hero", desc: "Vacuum the main living areas right now." },
    { emoji: "🧽", category: "chore", title: "Car Spa", desc: "Clean the car (inside or out, redeemer's choice)." },
    { emoji: "🗺️", category: "fun", title: "Weekend Captain", desc: "You decide the main activity for this Saturday or Sunday." },
    { emoji: "🎬", category: "fun", title: "Stream Commander", desc: "You control the YouTube/Netflix queue for the evening. No phones." },
    { emoji: "🏴‍☠️", category: "fun", title: "Accent Challenge", desc: "Speak in an accent of my choice for the next 10 minutes." },
    { emoji: "🥰", category: "romance", title: "Compliment Shower", desc: "Give me three genuine, specific compliments right now." },
    { emoji: "🫂", category: "romance", title: "Cuddle Puddle", desc: "15 minutes of uninterrupted cuddling time." },
    { emoji: "🥂", category: "fun", title: "Be My Guest", desc: "You have to bring me a refill whenever my drink is empty tonight." },
    { emoji: "🔚", category: "fun", title: "The Last Word", desc: "I win this specific minor debate/argument instantly." },
    { emoji: "🎵", category: "fun", title: "Car DJ", desc: "I control the music/radio for the entire drive. No driver vetoes." },
    { emoji: "🤔", category: "fun", title: "The Decider", desc: "Stop the 'I don't know, what do you want?' loop. You must make the decision." },
    { emoji: "🛎️", category: "fun", title: "Butler Service", desc: "For the next 15 minutes, fetch me anything I need (drink, remote, snack)." },
    { emoji: "🧘‍♂️", category: "romance", title: "Human Cushion", desc: "You are my pillow for the next 10 minutes. Stay still." },
    { emoji: "🔌", category: "chore", title: "Tech Support", desc: "Fix the wifi/printer/device without rolling your eyes or sighing." },
    { emoji: "🥡", category: "fun", title: "Leftovers Rights", desc: "I get first refusal on the best leftovers in the fridge." },
    { emoji: "📺", category: "veto", title: "Remote Veto", desc: "I can veto what we are currently watching and pick something else." }
];