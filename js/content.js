/* ==========================================================================
   content.js — all the words, in one place.
   Edit freely. Curly quotes/apostrophes (’ “ ”) look nicest in the letter.
   ========================================================================== */
window.QUINN_CONTENT = {

  /* ---- Music ---------------------------------------------------------------
     Drop a licensed / royalty-free track at the path below and it will play
     after the first tap on "Step inside". If the file doesn't exist, the music
     button simply stays hidden and the experience works silently.
     Set src to '' to disable audio completely. */
  music: {
    src: 'assets/audio/soundtrack.mp3',
    volume: 0.5
  },

  /* ---- Garden (Scene 3) ---------------------------------------------------- */
  garden: {
    growing: 'Something is growing…',
    tap:     'Tap a flower',
    more:    'There are more to find',
    done:    'That’s every flower'
  },

  /* One entry per flower, left to right: rose, tulip, cosmos, daisy, lavender */
  flowers: [
    {
      kicker: 'A small truth',
      text:   'Some people make an ordinary day feel a little brighter just by being in it. That’s a rare kind of magic, and it suits you.'
    },
    {
      kicker: 'A wish',
      text:   'I hope this year gives you more laughter than you can keep track of, and more calm than you expected.'
    },
    {
      kicker: 'The forecast',
      text:   'Here’s to doors opening before you even knock, plans working out better than hoped, and a future so bright it needs sunglasses.'
    },
    {
      kicker: 'Official notice',
      text:   'By order of the universe: today you may eat cake for breakfast, ignore your to-do list, and accept every compliment without arguing. No refunds.'
    },
    {
      kicker: 'One more wish',
      text:   'Make a wish today. I won’t ask what it was. I just hope it comes true, and arrives in a lovely way.'
    }
  ],

  /* ---- Letter (Scene 4) ----------------------------------------------------
     kind: 'salute' | 'p' | 'close' | 'sign'
     Change `sign` to your own name if you'd like to be known. */
  letter: [
    { kind: 'salute', text: 'Dear Quinn,' },
    { kind: 'p',      text: 'Happy birthday. I wanted to give you something a little different, so I built you a small corner of the night sky.' },
    { kind: 'p',      text: 'It isn’t much next to how you deserve to be celebrated, but I hoped it might make your day a little brighter. If it earned even one smile, then it did its job.' },
    { kind: 'p',      text: 'There’s a line I keep coming back to when I think of you. It’s a bit poetic, so forgive me: Quinn is the angel that gravity brought to me. I mean it in the kindest, most sincere way.' },
    { kind: 'p',      text: 'Whatever this year holds, I hope it’s gentle with you. I hope it brings people who appreciate you, good news right when you need it, and plenty of quiet little moments that turn out to be your favorites.' },
    { kind: 'p',      text: 'You deserve to be celebrated today, and I’m glad I got to be one of the people doing it.' },
    { kind: 'close',  text: 'Happy birthday, Quinn. Keep shining.' },
    { kind: 'sign',   text: '— Someone who’s rooting for you' }
  ]
};
