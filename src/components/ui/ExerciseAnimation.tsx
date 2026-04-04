import { motion } from 'framer-motion'

interface ExerciseAnimationProps {
  exercise: string
  size?: number
}

// Keyframe positions for stick figure animations
// Each exercise has 2-3 poses that cycle
interface Pose {
  head: [number, number]
  shoulders: [number, number]
  hips: [number, number]
  leftHand: [number, number]
  rightHand: [number, number]
  leftElbow: [number, number]
  rightElbow: [number, number]
  leftFoot: [number, number]
  rightFoot: [number, number]
  leftKnee: [number, number]
  rightKnee: [number, number]
}

const POSES: Record<string, Pose[]> = {
  'Bench Press': [
    { head: [50,30], shoulders: [50,35], hips: [50,55], leftHand: [25,20], rightHand: [75,20], leftElbow: [30,35], rightElbow: [70,35], leftFoot: [35,80], rightFoot: [65,80], leftKnee: [38,68], rightKnee: [62,68] },
    { head: [50,30], shoulders: [50,35], hips: [50,55], leftHand: [25,38], rightHand: [75,38], leftElbow: [30,40], rightElbow: [70,40], leftFoot: [35,80], rightFoot: [65,80], leftKnee: [38,68], rightKnee: [62,68] },
  ],
  'OHP': [
    { head: [50,22], shoulders: [50,30], hips: [50,55], leftHand: [35,18], rightHand: [65,18], leftElbow: [35,30], rightElbow: [65,30], leftFoot: [40,85], rightFoot: [60,85], leftKnee: [42,70], rightKnee: [58,70] },
    { head: [50,22], shoulders: [50,30], hips: [50,55], leftHand: [35,32], rightHand: [65,32], leftElbow: [32,35], rightElbow: [68,35], leftFoot: [40,85], rightFoot: [60,85], leftKnee: [42,70], rightKnee: [58,70] },
  ],
  'Back Squat': [
    { head: [50,15], shoulders: [50,25], hips: [50,45], leftHand: [38,22], rightHand: [62,22], leftElbow: [35,28], rightElbow: [65,28], leftFoot: [38,85], rightFoot: [62,85], leftKnee: [40,65], rightKnee: [60,65] },
    { head: [50,30], shoulders: [50,38], hips: [50,58], leftHand: [38,35], rightHand: [62,35], leftElbow: [35,40], rightElbow: [65,40], leftFoot: [35,85], rightFoot: [65,85], leftKnee: [35,72], rightKnee: [65,72] },
  ],
  'Deadlift': [
    { head: [50,15], shoulders: [50,25], hips: [50,45], leftHand: [42,42], rightHand: [58,42], leftElbow: [40,35], rightElbow: [60,35], leftFoot: [42,85], rightFoot: [58,85], leftKnee: [43,65], rightKnee: [57,65] },
    { head: [50,35], shoulders: [50,42], hips: [50,58], leftHand: [42,72], rightHand: [58,72], leftElbow: [42,55], rightElbow: [58,55], leftFoot: [42,85], rightFoot: [58,85], leftKnee: [40,72], rightKnee: [60,72] },
  ],
  'Barbell Row': [
    { head: [40,28], shoulders: [45,35], hips: [55,50], leftHand: [40,55], rightHand: [55,55], leftElbow: [38,45], rightElbow: [58,45], leftFoot: [45,85], rightFoot: [60,85], leftKnee: [46,68], rightKnee: [58,68] },
    { head: [40,28], shoulders: [45,35], hips: [55,50], leftHand: [40,38], rightHand: [55,38], leftElbow: [35,40], rightElbow: [60,40], leftFoot: [45,85], rightFoot: [60,85], leftKnee: [46,68], rightKnee: [58,68] },
  ],
  'Weighted Pull-ups': [
    { head: [50,25], shoulders: [50,32], hips: [50,55], leftHand: [35,10], rightHand: [65,10], leftElbow: [35,22], rightElbow: [65,22], leftFoot: [45,85], rightFoot: [55,85], leftKnee: [46,70], rightKnee: [54,70] },
    { head: [50,15], shoulders: [50,22], hips: [50,45], leftHand: [35,10], rightHand: [65,10], leftElbow: [38,18], rightElbow: [62,18], leftFoot: [45,75], rightFoot: [55,75], leftKnee: [46,60], rightKnee: [54,60] },
  ],
  'RDL': [
    { head: [50,15], shoulders: [50,25], hips: [50,45], leftHand: [45,42], rightHand: [55,42], leftElbow: [44,35], rightElbow: [56,35], leftFoot: [44,85], rightFoot: [56,85], leftKnee: [44,65], rightKnee: [56,65] },
    { head: [38,30], shoulders: [42,38], hips: [52,52], leftHand: [42,62], rightHand: [52,62], leftElbow: [42,48], rightElbow: [52,48], leftFoot: [44,85], rightFoot: [56,85], leftKnee: [44,68], rightKnee: [56,68] },
  ],
}

// Default pose for exercises without specific animation
const DEFAULT_POSES: Pose[] = [
  { head: [50,15], shoulders: [50,25], hips: [50,48], leftHand: [30,35], rightHand: [70,35], leftElbow: [35,30], rightElbow: [65,30], leftFoot: [40,85], rightFoot: [60,85], leftKnee: [42,66], rightKnee: [58,66] },
  { head: [50,15], shoulders: [50,25], hips: [50,48], leftHand: [30,25], rightHand: [70,25], leftElbow: [35,28], rightElbow: [65,28], leftFoot: [40,85], rightFoot: [60,85], leftKnee: [42,66], rightKnee: [58,66] },
]

export function ExerciseAnimation({ exercise, size = 120 }: ExerciseAnimationProps) {
  const poses = POSES[exercise] || DEFAULT_POSES

  const pose1 = poses[0]
  const pose2 = poses[1] || poses[0]

  const dur = 1.8
  const t = { duration: dur, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }

  void [pose1, pose2] // used in JSX below

  return (
    <div className="flex justify-center" style={{ width: size, height: size, margin: '0 auto' }}>
      <svg viewBox="0 0 100 95" width={size} height={size}>
        {/* Background circle */}
        <circle cx="50" cy="47" r="44" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

        {/* Body segments with animation */}
        {/* Torso */}
        <motion.line
          x1={pose1.shoulders[0]} y1={pose1.shoulders[1]}
          x2={pose1.hips[0]} y2={pose1.hips[1]}
          animate={{
            x1: [pose1.shoulders[0], pose2.shoulders[0]],
            y1: [pose1.shoulders[1], pose2.shoulders[1]],
            x2: [pose1.hips[0], pose2.hips[0]],
            y2: [pose1.hips[1], pose2.hips[1]],
          }}
          transition={t}
          stroke="#e5e5e7" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Neck */}
        <motion.line
          x1={pose1.head[0]} y1={pose1.head[1]}
          x2={pose1.shoulders[0]} y2={pose1.shoulders[1]}
          animate={{
            x1: [pose1.head[0], pose2.head[0]], y1: [pose1.head[1], pose2.head[1]],
            x2: [pose1.shoulders[0], pose2.shoulders[0]], y2: [pose1.shoulders[1], pose2.shoulders[1]],
          }}
          transition={t}
          stroke="#e5e5e7" strokeWidth="2" strokeLinecap="round"
        />
        {/* Head */}
        <motion.circle
          cx={pose1.head[0]} cy={pose1.head[1]}
          animate={{ cx: [pose1.head[0], pose2.head[0]], cy: [pose1.head[1], pose2.head[1]] }}
          transition={t}
          r="5" fill="#e5e5e7"
        />

        {/* Left arm */}
        <motion.line
          animate={{
            x1: [pose1.shoulders[0], pose2.shoulders[0]], y1: [pose1.shoulders[1], pose2.shoulders[1]],
            x2: [pose1.leftElbow[0], pose2.leftElbow[0]], y2: [pose1.leftElbow[1], pose2.leftElbow[1]],
          }}
          transition={t}
          stroke="#64d2ff" strokeWidth="2" strokeLinecap="round"
        />
        <motion.line
          animate={{
            x1: [pose1.leftElbow[0], pose2.leftElbow[0]], y1: [pose1.leftElbow[1], pose2.leftElbow[1]],
            x2: [pose1.leftHand[0], pose2.leftHand[0]], y2: [pose1.leftHand[1], pose2.leftHand[1]],
          }}
          transition={t}
          stroke="#64d2ff" strokeWidth="2" strokeLinecap="round"
        />

        {/* Right arm */}
        <motion.line
          animate={{
            x1: [pose1.shoulders[0], pose2.shoulders[0]], y1: [pose1.shoulders[1], pose2.shoulders[1]],
            x2: [pose1.rightElbow[0], pose2.rightElbow[0]], y2: [pose1.rightElbow[1], pose2.rightElbow[1]],
          }}
          transition={t}
          stroke="#64d2ff" strokeWidth="2" strokeLinecap="round"
        />
        <motion.line
          animate={{
            x1: [pose1.rightElbow[0], pose2.rightElbow[0]], y1: [pose1.rightElbow[1], pose2.rightElbow[1]],
            x2: [pose1.rightHand[0], pose2.rightHand[0]], y2: [pose1.rightHand[1], pose2.rightHand[1]],
          }}
          transition={t}
          stroke="#64d2ff" strokeWidth="2" strokeLinecap="round"
        />

        {/* Left leg */}
        <motion.line
          animate={{
            x1: [pose1.hips[0], pose2.hips[0]], y1: [pose1.hips[1], pose2.hips[1]],
            x2: [pose1.leftKnee[0], pose2.leftKnee[0]], y2: [pose1.leftKnee[1], pose2.leftKnee[1]],
          }}
          transition={t}
          stroke="#30d158" strokeWidth="2" strokeLinecap="round"
        />
        <motion.line
          animate={{
            x1: [pose1.leftKnee[0], pose2.leftKnee[0]], y1: [pose1.leftKnee[1], pose2.leftKnee[1]],
            x2: [pose1.leftFoot[0], pose2.leftFoot[0]], y2: [pose1.leftFoot[1], pose2.leftFoot[1]],
          }}
          transition={t}
          stroke="#30d158" strokeWidth="2" strokeLinecap="round"
        />

        {/* Right leg */}
        <motion.line
          animate={{
            x1: [pose1.hips[0], pose2.hips[0]], y1: [pose1.hips[1], pose2.hips[1]],
            x2: [pose1.rightKnee[0], pose2.rightKnee[0]], y2: [pose1.rightKnee[1], pose2.rightKnee[1]],
          }}
          transition={t}
          stroke="#30d158" strokeWidth="2" strokeLinecap="round"
        />
        <motion.line
          animate={{
            x1: [pose1.rightKnee[0], pose2.rightKnee[0]], y1: [pose1.rightKnee[1], pose2.rightKnee[1]],
            x2: [pose1.rightFoot[0], pose2.rightFoot[0]], y2: [pose1.rightFoot[1], pose2.rightFoot[1]],
          }}
          transition={t}
          stroke="#30d158" strokeWidth="2" strokeLinecap="round"
        />

        {/* Joint dots */}
        {[pose1.leftElbow, pose1.rightElbow, pose1.leftKnee, pose1.rightKnee].map((pt, i) => {
          const pt2 = [pose2.leftElbow, pose2.rightElbow, pose2.leftKnee, pose2.rightKnee][i]
          return (
            <motion.circle
              key={i}
              cx={pt[0]} cy={pt[1]} r="2"
              animate={{ cx: [pt[0], pt2[0]], cy: [pt[1], pt2[1]] }}
              transition={t}
              fill="rgba(255,255,255,0.3)"
            />
          )
        })}
      </svg>
    </div>
  )
}
