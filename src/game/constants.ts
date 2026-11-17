// Logical table size (px). The canvas is scaled to fit the screen.
export const TABLE_WIDTH = 460;
export const TABLE_HEIGHT = 820;

// Physics (units: px and seconds)
export const GRAVITY = 1500;
export const SUBSTEPS = 10;
export const MAX_BALL_SPEED = 2600;
export const BALL_RADIUS = 9;

export const WALL_RESTITUTION = 0.45;
export const FLIPPER_RESTITUTION = 0.25;

// Flippers
export const FLIPPER_LENGTH = 72;
export const FLIPPER_PIVOT_RADIUS = 11;
export const FLIPPER_TIP_RADIUS = 6;
export const FLIPPER_REST_ANGLE = 0.52; // radians, tip pointing down
export const FLIPPER_UP_ANGLE = -0.48; // radians, tip pointing up
export const FLIPPER_UP_SPEED = 22; // rad/s
export const FLIPPER_DOWN_SPEED = 13; // rad/s

// Plunger
export const PLUNGER_MIN_SPEED = 1350;
export const PLUNGER_MAX_SPEED = 2100;
export const PLUNGER_CHARGE_TIME = 1.1; // seconds to full power

// Kickers
export const BUMPER_KICK = 620;
export const SLING_KICK = 560;

// Scoring
export const SCORE_BUMPER = 100;
export const SCORE_SLING = 10;
export const SCORE_ROLLOVER = 500;
export const SCORE_ROLLOVER_COMPLETE = 2000;
export const SCORE_TARGET = 250;
export const SCORE_TARGET_COMPLETE = 5000;
export const MAX_MULTIPLIER = 5;
export const BALLS_PER_GAME = 3;

// Plunger lane
export const LANE_LEFT = 405;
export const LANE_RIGHT = 440;
export const LANE_FLOOR = 792;
export const LANE_TOP = 262;
export const BALL_SPAWN = {
  x: (LANE_LEFT + LANE_RIGHT) / 2,
  y: LANE_FLOOR - BALL_RADIUS - 1,
};
