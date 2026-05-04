import { images } from '../assets'
import type { ProgramDay, ProgramDefinition, ProgramStep } from '../types'

const warmupSteps = (): ProgramStep[] => [
  {
    id: 'warmup-march',
    kind: 'timer',
    title: 'Easy march on the spot',
    description: 'Lift your knees gently and let your arms move naturally.',
    image: images.warmupMarch,
    durationSeconds: 60,
    intensity: 'easy',
    details: ['Stay relaxed.', 'Breathe normally.', 'No rushing.'],
  },
  {
    id: 'warmup-shoulders',
    kind: 'timer',
    title: 'Shoulder rolls',
    description: 'Roll forward for 30 seconds, then backwards for 30 seconds.',
    image: images.warmupArms,
    durationSeconds: 60,
    intensity: 'easy',
    details: ['Keep the neck soft.', 'Make smooth circles.', 'Do not force range.'],
  },
  {
    id: 'warmup-chair-squat',
    kind: 'timer',
    title: 'Gentle chair squats',
    description: 'Sit back toward a chair, lightly touch it, then stand.',
    image: images.chairSquat,
    durationSeconds: 60,
    intensity: 'easy',
    details: ['Use your hands on your thighs if needed.', 'Keep the movement comfortable.'],
  },
  {
    id: 'warmup-arm-swings',
    kind: 'timer',
    title: 'Arm swings across chest',
    description: 'Swing gently across the body to open the chest and shoulders.',
    image: images.warmupArms,
    durationSeconds: 60,
    intensity: 'easy',
    details: ['Small range is fine.', 'Keep shoulders down.'],
  },
  {
    id: 'warmup-slow-walk',
    kind: 'timer',
    title: 'Slow walk',
    description: 'Walk around the room, garden, or hallway at an easy pace.',
    image: images.activeWalk,
    durationSeconds: 60,
    intensity: 'easy',
    details: ['This is still warm-up time.', 'No aggressive stretching before exercise.'],
  },
]

const rep = (
  id: string,
  title: string,
  amount: string,
  image: string,
  description: string,
  details: string[],
): ProgramStep => ({
  id,
  kind: 'reps',
  title,
  amount,
  image,
  description,
  details,
})

const hold = (
  id: string,
  title: string,
  durationSeconds: number,
  image: string,
  description: string,
  details: string[],
): ProgramStep => ({
  id,
  kind: 'hold',
  title,
  durationSeconds,
  image,
  description,
  details,
})

const timer = (
  id: string,
  title: string,
  durationSeconds: number,
  image: string,
  description: string,
  intensity: 'easy' | 'moderate' | 'brisk' = 'easy',
  details?: string[],
): ProgramStep => ({
  id,
  kind: 'timer',
  title,
  durationSeconds,
  image,
  description,
  intensity,
  details,
})

const info = (
  id: string,
  title: string,
  image: string,
  description: string,
  prompts?: string[],
  details?: string[],
): ProgramStep => ({
  id,
  kind: 'info',
  title,
  image,
  description,
  prompts,
  details,
})

const chairSquat = (amount: string, round?: number): ProgramStep =>
  rep(
    `chair-squat-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Chair squat` : 'Chair squat',
    amount,
    images.chairSquat,
    'Sit back toward a chair, lightly touch it, then stand.',
    ['Use your hands on your thighs to make it easier.', 'Do not fully sit down unless you need to.', 'Control the descent.'],
  )

const pushup = (amount: string, round?: number): ProgramStep =>
  rep(
    `pushup-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Wall or counter push-up` : 'Wall or counter push-up',
    amount,
    images.wallPushup,
    'Hands on a wall or counter. Lower your chest gently, then push away.',
    ['Wall push-ups count.', 'Keep your body straight.', 'Stop if your shoulder complains.'],
  )

const bridge = (amount: string, round?: number): ProgramStep =>
  rep(
    `bridge-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Glute bridge` : 'Glute bridge',
    amount,
    images.gluteBridge,
    'Lie on your back, knees bent, feet flat. Lift your hips, squeeze, and lower slowly.',
    ['Drive through your heels.', 'Squeeze your bum at the top.', 'Keep your lower back comfortable.'],
  )

const birdDog = (amount: string, round?: number): ProgramStep =>
  rep(
    `bird-dog-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Bird dog` : 'Bird dog',
    amount,
    images.birdDog,
    'On hands and knees, slowly extend opposite arm and leg, pause, then swap.',
    ['Small controlled movement.', 'Keep hips level.', 'Do not rush it.'],
  )

const deadBug = (amount: string, round?: number): ProgramStep =>
  rep(
    `dead-bug-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Dead bug` : 'Dead bug',
    amount,
    images.deadBug,
    'Lie on your back, knees up, arms up. Slowly lower one heel toward the floor, then return.',
    ['Keep your lower back gently braced.', 'Move slowly.', 'Alternate sides.'],
  )

const lunge = (amount: string, round?: number): ProgramStep =>
  rep(
    `step-back-lunge-${round ?? 'single'}-${amount}`,
    round ? `Round ${round}: Shallow step-back lunge` : 'Shallow step-back lunge',
    amount,
    images.stepBackLunge,
    'Step one foot back slightly, bend both knees a little, then return.',
    ['Keep it very shallow.', 'Replace with chair squats if your knees feel dodgy.', 'Move with control.'],
  )

const inclinePlank = (seconds: number, round?: number): ProgramStep =>
  hold(
    `incline-plank-${round ?? 'single'}-${seconds}`,
    round ? `Round ${round}: Incline plank` : 'Incline plank',
    seconds,
    images.inclinePlank,
    'Hands or forearms on a counter or table. Keep your body straight and hold.',
    ['Do not start with floor planks.', 'Brace gently.', 'Breathe throughout.'],
  )

const rounds = (count: number, builders: Array<(round: number) => ProgramStep>): ProgramStep[] =>
  Array.from({ length: count }, (_, index) => {
    const round = index + 1
    return builders.map((builder) => {
      const step = builder(round)
      return {
        ...step,
        id: `round-${round}-${step.id}`,
        title: step.title.startsWith(`Round ${round}:`) ? step.title : `Round ${round}: ${step.title}`,
      }
    })
  }).flat()

const walkSteps = (minutes: number, title = 'Walk', briskMiddleMinutes = 0): ProgramStep[] => {
  if (briskMiddleMinutes <= 0) {
    return [
      timer(
        `walk-${minutes}`,
        title,
        minutes * 60,
        images.activeWalk,
        `${minutes} minutes at an easy pace.`,
        'easy',
        ['You should be able to talk normally.', 'Use 10 minutes if the full time feels too much.'],
      ),
    ]
  }

  const easyBefore = Math.max(1, Math.floor((minutes - briskMiddleMinutes) / 2))
  const easyAfter = minutes - briskMiddleMinutes - easyBefore

  return [
    timer('walk-easy-start', 'Easy walk', easyBefore * 60, images.activeWalk, `${easyBefore} minutes easy.`, 'easy'),
    timer('walk-brisk-middle', 'Slightly brisk walk', briskMiddleMinutes * 60, images.activeWalk, `${briskMiddleMinutes} minutes slightly brisker.`, 'brisk', [
      'Breathing harder is fine.',
      'You should still speak in short sentences.',
    ]),
    timer('walk-easy-finish', 'Easy walk to finish', easyAfter * 60, images.activeWalk, `${easyAfter} minutes easy.`, 'easy'),
  ]
}

const intervalWalkSteps = (roundCount: number, totalMinutes: number): ProgramStep[] => {
  const intervalSeconds = roundCount * 90
  const finishSeconds = totalMinutes * 60 - 300 - intervalSeconds
  const steps: ProgramStep[] = [
    timer('interval-warmup-walk', 'Easy walk', 300, images.activeWalk, '5 minutes easy.', 'easy'),
  ]

  for (let round = 1; round <= roundCount; round += 1) {
    steps.push(
      timer(`interval-${round}-brisk`, `Interval ${round}: brisk walk`, 30, images.activeWalk, '30 seconds brisk. Brisk does not mean running.', 'brisk'),
      timer(`interval-${round}-easy`, `Interval ${round}: easy walk`, 60, images.activeWalk, '60 seconds easy.', 'easy'),
    )
  }

  steps.push(timer('interval-finish-walk', 'Easy walk to finish', finishSeconds, images.activeWalk, 'Easy walk to finish.', 'easy'))
  return steps
}

const strengthDay = (
  dayNumber: number,
  title: string,
  description: string,
  exerciseSteps: ProgramStep[],
  estimatedMinutes: number,
): ProgramDay => ({
  dayNumber,
  type: 'strength',
  title,
  description,
  image: images.dashStrength,
  estimatedMinutes,
  steps: [...warmupSteps(), ...exerciseSteps, timer('cool-down-hamstrings', 'Cool down', 45, images.coolHamstring, 'Gentle hamstring cool down.', 'easy', ['Hold gently.', 'No bouncing.'])],
  completionCopy: 'Session complete. Finish feeling like you could have done a little more.',
})

const walkDay = (
  dayNumber: number,
  title: string,
  description: string,
  steps: ProgramStep[],
  estimatedMinutes: number,
): ProgramDay => ({
  dayNumber,
  type: 'walk',
  title,
  description,
  image: images.activeWalk,
  estimatedMinutes,
  steps: [...warmupSteps(), ...steps],
  completionCopy: 'Walk logged. Walking is your friend because it burns calories without battering your joints.',
})

const recoveryDay = (dayNumber: number, description: string, minutes = 10): ProgramDay => ({
  dayNumber,
  type: 'recovery',
  title: 'Recovery',
  description,
  image: images.activeWalk,
  estimatedMinutes: minutes + 5,
  steps: [...warmupSteps(), timer(`recovery-walk-${dayNumber}`, 'Gentle recovery walk', minutes * 60, images.activeWalk, `${minutes} minutes at an easy pace.`, 'easy')],
  completionCopy: 'Recovery complete. Keeping the habit alive matters.',
})

const restDay = (dayNumber: number, title: string, description: string, prompts?: string[]): ProgramDay => ({
  dayNumber,
  type: prompts ? 'review' : 'rest',
  title,
  description,
  image: images.sessionDone,
  estimatedMinutes: prompts ? 2 : 0,
  steps: [
    info(
      `rest-${dayNumber}`,
      title,
      images.sessionDone,
      description,
      prompts,
      prompts ? ['No formal workout today.', 'Read the prompts, then mark the day complete.'] : ['No formal workout today.'],
    ),
  ],
  completionCopy: prompts ? 'Review logged. Waist and consistency matter more than daily weight changes.' : 'Rest day complete.',
})

export const restart30Program: ProgramDefinition = {
  id: 'restart30',
  title: '30-Day Restart',
  subtitle: 'Gentle bodyweight plan for fat loss, consistency, and avoiding the pulled-muscle cycle.',
  description:
    'A safe restart plan built around three bodyweight sessions, two walking/cardio sessions, and two lighter recovery days each week.',
  lengthDays: 30,
  safetyNotes: [
    'Stay mostly easy to moderate: breathing harder is fine, gasping is too hard.',
    'Finish each session feeling like you could have done a little bit more.',
    'Stop for sharp pain, a pulling or tearing sensation, chest pain, dizziness, pain that changes how you walk, or back pain that shoots down the leg.',
  ],
  days: [
    strengthDay(1, 'Bodyweight Session 1', 'Start gently. Rest as much as needed.', rounds(2, [() => chairSquat('8 reps'), () => pushup('8 reps'), () => bridge('10 reps'), () => birdDog('5 each side'), () => inclinePlank(10)]), 18),
    walkDay(2, 'Walk', 'Easy pace. If 15 minutes feels too much, do 10.', walkSteps(15), 20),
    strengthDay(3, 'Bodyweight Session 2', 'Same as Day 1. Make movements smoother, not harder.', rounds(2, [() => chairSquat('8 reps'), () => pushup('8 reps'), () => bridge('10 reps'), () => birdDog('5 each side'), () => inclinePlank(10)]), 18),
    recoveryDay(4, 'Do a 10-minute gentle walk or just repeat the warm-up.', 10),
    strengthDay(5, 'Bodyweight Session 3', 'Same as Day 1. Only add reps if everything feels comfortable.', rounds(2, [() => chairSquat('8 reps'), () => pushup('8 reps'), () => bridge('10 reps'), () => birdDog('5 each side'), () => inclinePlank(10)]), 18),
    walkDay(6, 'Walk', '20 minutes at an easy pace.', walkSteps(20), 25),
    restDay(7, 'Rest and check-in', 'No formal workout.', ['Waist measurement', 'Weight, optional', 'Energy level', 'Any aches or pains', 'Whether the plan felt too easy, too hard, or about right']),
    strengthDay(8, 'Bodyweight Session 4', 'Build the habit.', rounds(2, [() => chairSquat('10 reps'), () => pushup('10 reps'), () => bridge('12 reps'), () => deadBug('6 each side'), () => inclinePlank(15)]), 20),
    walkDay(9, 'Walk', '20 minutes, with the middle 5 minutes slightly brisker.', walkSteps(20, 'Walk', 5), 25),
    strengthDay(10, 'Bodyweight Session 5', 'Skip lunges if they feel dodgy. Replace with chair squats.', rounds(2, [() => chairSquat('10 reps'), () => pushup('10 reps'), () => birdDog('6 each side'), () => bridge('12 reps'), () => lunge('5 each side')]), 20),
    recoveryDay(11, '10 to 15-minute easy walk.', 15),
    strengthDay(12, 'Bodyweight Session 6', 'Repeat Day 8. Optional third round only if you feel good.', rounds(2, [() => chairSquat('10 reps'), () => pushup('10 reps'), () => bridge('12 reps'), () => deadBug('6 each side'), () => inclinePlank(15)]), 20),
    walkDay(13, 'Walk', '25 minutes. Keep it comfortable.', walkSteps(25), 30),
    restDay(14, 'Rest', 'No formal workout.'),
    strengthDay(15, 'Bodyweight Session 7', 'Do 3 rounds if possible. If 3 rounds feels too much, do 2 rounds.', rounds(3, [() => chairSquat('10 reps'), () => pushup('10 reps'), () => bridge('12 reps'), () => deadBug('8 each side'), () => inclinePlank(20)]), 26),
    walkDay(16, 'Walk with gentle intervals', 'Total: 25 minutes. Brisk does not mean running.', intervalWalkSteps(10, 25), 30),
    strengthDay(17, 'Bodyweight Session 8', 'Do 2 to 3 rounds. This version uses 2 rounds; add a third only if you feel good.', rounds(2, [() => chairSquat('12 reps'), () => pushup('10 reps'), () => birdDog('8 each side'), () => lunge('6 each side'), () => inclinePlank(20)]), 22),
    {
      ...recoveryDay(18, '10-minute easy walk plus gentle mobility.', 10),
      steps: [
        ...warmupSteps(),
        timer('recovery-walk-18', 'Easy walk', 600, images.activeWalk, '10 minutes easy.', 'easy'),
        info('mobility-18', 'Gentle mobility', images.warmupTwist, 'Shoulder rolls, slow neck turns, gentle hip circles, and an easy calf stretch.', undefined, [
          'Keep every movement gentle.',
          'No forcing range.',
          'Stop if anything feels wrong.',
        ]),
      ],
    },
    strengthDay(19, 'Bodyweight Session 9', 'Repeat Day 15.', rounds(3, [() => chairSquat('10 reps'), () => pushup('10 reps'), () => bridge('12 reps'), () => deadBug('8 each side'), () => inclinePlank(20)]), 26),
    walkDay(20, 'Walk', '30 minutes. This can be split into 2 x 15 minutes if needed.', walkSteps(30), 35),
    restDay(21, 'Rest and check-in', 'Measure waist again. Ignore daily weight changes.', ['Waist measurement', 'Consistency so far', 'Any pain or problem areas']),
    strengthDay(22, 'Bodyweight Session 10', 'Finish the month well.', rounds(3, [() => chairSquat('12 reps'), () => pushup('12 reps'), () => bridge('15 reps'), () => deadBug('8 each side'), () => inclinePlank(20)]), 28),
    walkDay(23, 'Walk with intervals', 'Total: 30 minutes.', intervalWalkSteps(12, 30), 35),
    strengthDay(24, 'Bodyweight Session 11', 'Keep form clean.', rounds(3, [() => chairSquat('12 reps'), () => pushup('10 to 12 reps'), () => birdDog('8 each side'), () => lunge('6 each side'), () => bridge('15 reps')]), 28),
    recoveryDay(25, 'Easy 15-minute walk.', 15),
    strengthDay(26, 'Bodyweight Session 12', 'Repeat Day 22. Do not turn this into a test.', rounds(3, [() => chairSquat('12 reps'), () => pushup('12 reps'), () => bridge('15 reps'), () => deadBug('8 each side'), () => inclinePlank(20)]), 28),
    walkDay(27, 'Longer easy walk', '35 minutes. Easy pace. No heroics.', walkSteps(35), 40),
    restDay(28, 'Rest', 'Full rest or a gentle 10-minute stroll.'),
    strengthDay(29, 'Final bodyweight session', 'Do 2 or 3 rounds depending on how you feel. This version uses 2 rounds; add a third only if you feel good.', rounds(2, [() => chairSquat('12 reps'), () => pushup('12 reps'), () => bridge('15 reps'), () => deadBug('8 each side'), () => inclinePlank(30)]), 23),
    walkDay(30, 'Review day', 'Do a relaxed 20-minute walk, then review the month.', [
      ...walkSteps(20),
      info('review-30', '30-day review', images.sessionDone, 'Record the review prompts for yourself. The app only saves completion.', [
        'Waist measurement',
        'Weight, optional',
        'How many days you completed',
        'Any pain or problem areas',
        'What felt easiest',
        'What felt hardest',
        'Whether the next plan should be easier, similar, or slightly harder',
      ]),
    ], 27),
  ],
}

export const programCatalog: ProgramDefinition[] = [restart30Program]
