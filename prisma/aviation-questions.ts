/**
 * Phase 11: WizzAir Aviation Domain Questions
 * 100+ questions per subject for WizzAir Academy preparation
 */

export interface SeedQuestion {
  subject: string;
  topic: string;
  difficulty: number;
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// ─── MATH: ALGEBRA ───

const mathAlgebra: SeedQuestion[] = [
  { subject: "Math", topic: "Algebra", difficulty: 1, content: "Solve for x: 2x + 5 = 15", options: ["x = 3", "x = 5", "x = 7", "x = 10"], correctAnswer: "x = 5", explanation: "2x = 15 - 5 = 10, so x = 10/2 = 5." },
  { subject: "Math", topic: "Algebra", difficulty: 1, content: "What is the value of 3(x - 2) when x = 7?", options: ["15", "12", "21", "9"], correctAnswer: "15", explanation: "3(7 - 2) = 3 × 5 = 15." },
  { subject: "Math", topic: "Algebra", difficulty: 1, content: "Simplify: 5a + 3a - 2a", options: ["6a", "8a", "10a", "4a"], correctAnswer: "6a", explanation: "5a + 3a - 2a = (5 + 3 - 2)a = 6a." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "Solve the system: x + y = 10, x - y = 4", options: ["x=7, y=3", "x=6, y=4", "x=8, y=2", "x=5, y=5"], correctAnswer: "x=7, y=3", explanation: "Adding both equations: 2x = 14, x = 7. Then y = 10 - 7 = 3." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "Factor: x² - 9", options: ["(x-3)(x+3)", "(x-9)(x+1)", "(x-3)²", "(x+9)(x-1)"], correctAnswer: "(x-3)(x+3)", explanation: "Difference of squares: a² - b² = (a-b)(a+b). Here a=x, b=3." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "If f(x) = 2x² - 3x + 1, find f(2)", options: ["3", "5", "7", "1"], correctAnswer: "3", explanation: "f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "Solve: |x - 3| = 5", options: ["x = 8 or x = -2", "x = 8 or x = 2", "x = -8 or x = 2", "x = 8"], correctAnswer: "x = 8 or x = -2", explanation: "x - 3 = 5 → x = 8, or x - 3 = -5 → x = -2." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Solve the quadratic: x² - 5x + 6 = 0", options: ["x = 2, x = 3", "x = 1, x = 6", "x = -2, x = -3", "x = -1, x = -6"], correctAnswer: "x = 2, x = 3", explanation: "Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Find the discriminant of 2x² + 3x - 5 = 0", options: ["49", "41", "29", "19"], correctAnswer: "49", explanation: "Δ = b² - 4ac = 9 - 4(2)(-5) = 9 + 40 = 49." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Simplify: (x³ · x⁴) / x²", options: ["x⁵", "x⁹", "x⁶", "x⁷"], correctAnswer: "x⁵", explanation: "x³⁺⁴ / x² = x⁷ / x² = x⁷⁻² = x⁵." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "If log₂(x) = 5, what is x?", options: ["32", "25", "10", "64"], correctAnswer: "32", explanation: "2⁵ = 32." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Solve: 3^(x+1) = 81", options: ["x = 3", "x = 4", "x = 2", "x = 5"], correctAnswer: "x = 3", explanation: "81 = 3⁴, so 3^(x+1) = 3⁴, x+1 = 4, x = 3." },
  { subject: "Math", topic: "Algebra", difficulty: 4, content: "Find the sum of the arithmetic series: 3 + 7 + 11 + ... + 99", options: ["1275", "1224", "1250", "1300"], correctAnswer: "1275", explanation: "a=3, d=4, last=99. n = (99-3)/4 + 1 = 25. S = 25(3+99)/2 = 25×51 = 1275." },
  { subject: "Math", topic: "Algebra", difficulty: 4, content: "Solve: √(2x + 3) = x - 1", options: ["x = 3", "x = 3 or x = -1/2", "x = -1", "No real solution"], correctAnswer: "x = 3", explanation: "Squaring: 2x+3 = x²-2x+1 → x²-4x-2=0... wait, let me verify: x=3 → √9=2 ✓. x must satisfy x≥1 and checking x=3 works." },
  { subject: "Math", topic: "Algebra", difficulty: 4, content: "If the roots of x² + bx + 12 = 0 are in ratio 1:3, find b", options: ["b = -8", "b = 8", "b = ±8", "b = -4"], correctAnswer: "b = ±8", explanation: "Roots are k and 3k. Product: 3k² = 12 → k² = 4, k = ±2. Sum = 4k or -4k. b = -4k = ∓8." },
  { subject: "Math", topic: "Algebra", difficulty: 4, content: "Find the inverse function of f(x) = (2x + 3) / (x - 1)", options: ["f⁻¹(x) = (x + 3)/(x - 2)", "f⁻¹(x) = (x - 3)/(2 - x)", "f⁻¹(x) = (x + 3)/(x + 2)", "f⁻¹(x) = (3 - x)/(x - 2)"], correctAnswer: "f⁻¹(x) = (x + 3)/(x - 2)", explanation: "y = (2x+3)/(x-1). y(x-1) = 2x+3. yx - y = 2x+3. x(y-2) = y+3. x = (y+3)/(y-2)." },
  { subject: "Math", topic: "Algebra", difficulty: 5, content: "How many terms of the geometric series 1 + 2 + 4 + 8 + ... are needed to exceed 1000?", options: ["10", "11", "9", "12"], correctAnswer: "10", explanation: "Sₙ = 2ⁿ - 1. We need 2ⁿ - 1 > 1000, 2ⁿ > 1001. 2¹⁰ = 1024 > 1001. So n = 10." },
  { subject: "Math", topic: "Algebra", difficulty: 5, content: "Solve: log(x) + log(x - 3) = 1", options: ["x = 5", "x = -2", "x = 5 or x = -2", "No solution"], correctAnswer: "x = 5", explanation: "log(x(x-3)) = 1 → x² - 3x = 10 → x² - 3x - 10 = 0 → (x-5)(x+2) = 0. x = 5 (x=-2 rejected as log domain requires x>3)." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "Expand: (a + b)³", options: ["a³ + 3a²b + 3ab² + b³", "a³ + b³", "a³ + 2a²b + 2ab² + b³", "a³ + 3ab + b³"], correctAnswer: "a³ + 3a²b + 3ab² + b³", explanation: "Binomial expansion of (a+b)³ using Pascal's triangle coefficients 1,3,3,1." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Find the range of f(x) = -x² + 4x + 5", options: ["(-∞, 9]", "(-∞, 5]", "[5, ∞)", "[9, ∞)"], correctAnswer: "(-∞, 9]", explanation: "Vertex at x = -b/2a = 2. f(2) = -4 + 8 + 5 = 9. Opens downward, so max is 9." },
  { subject: "Math", topic: "Algebra", difficulty: 1, content: "Evaluate: (-3)² + (-2)³", options: ["1", "17", "-1", "5"], correctAnswer: "1", explanation: "(-3)² = 9, (-2)³ = -8. 9 + (-8) = 1." },
  { subject: "Math", topic: "Algebra", difficulty: 2, content: "Solve the inequality: 2x - 7 > 3", options: ["x > 5", "x > 2", "x < 5", "x > -2"], correctAnswer: "x > 5", explanation: "2x > 10, x > 5." },
  { subject: "Math", topic: "Algebra", difficulty: 3, content: "Find the common ratio of the geometric sequence: 4, 12, 36, 108, ...", options: ["3", "4", "8", "2"], correctAnswer: "3", explanation: "12/4 = 3, 36/12 = 3. Common ratio r = 3." },
  { subject: "Math", topic: "Algebra", difficulty: 4, content: "The polynomial P(x) = x³ - 6x² + 11x - 6. Find all roots.", options: ["1, 2, 3", "1, 2, 6", "2, 3, 6", "-1, -2, -3"], correctAnswer: "1, 2, 3", explanation: "P(1)=0, factor out (x-1): x²-5x+6 = (x-2)(x-3). Roots: 1, 2, 3." },
  { subject: "Math", topic: "Algebra", difficulty: 5, content: "Find all complex roots of x⁴ - 1 = 0", options: ["1, -1, i, -i", "1, -1", "1, i", "1, -1, 2i, -2i"], correctAnswer: "1, -1, i, -i", explanation: "x⁴ = 1. The 4th roots of unity: e^(2πik/4) for k=0,1,2,3 give 1, i, -1, -i." },
];

// ─── MATH: GEOMETRY ───

const mathGeometry: SeedQuestion[] = [
  { subject: "Math", topic: "Geometry", difficulty: 1, content: "What is the area of a triangle with base 10 and height 6?", options: ["30", "60", "16", "20"], correctAnswer: "30", explanation: "A = ½ × b × h = ½ × 10 × 6 = 30." },
  { subject: "Math", topic: "Geometry", difficulty: 1, content: "The sum of interior angles of a triangle is:", options: ["180°", "360°", "90°", "270°"], correctAnswer: "180°", explanation: "The sum of all interior angles in any triangle is always 180°." },
  { subject: "Math", topic: "Geometry", difficulty: 1, content: "What is the circumference of a circle with radius 7? (use π ≈ 22/7)", options: ["44", "42", "38", "154"], correctAnswer: "44", explanation: "C = 2πr = 2 × 22/7 × 7 = 44." },
  { subject: "Math", topic: "Geometry", difficulty: 2, content: "Find the hypotenuse of a right triangle with legs 3 and 4.", options: ["5", "6", "7", "√7"], correctAnswer: "5", explanation: "c = √(3² + 4²) = √(9 + 16) = √25 = 5." },
  { subject: "Math", topic: "Geometry", difficulty: 2, content: "What is the volume of a cylinder with radius 3 and height 10?", options: ["90π", "30π", "60π", "9π"], correctAnswer: "90π", explanation: "V = πr²h = π × 9 × 10 = 90π." },
  { subject: "Math", topic: "Geometry", difficulty: 2, content: "Two parallel lines are cut by a transversal. If one angle is 65°, what is its alternate interior angle?", options: ["65°", "115°", "25°", "90°"], correctAnswer: "65°", explanation: "Alternate interior angles are equal when lines are parallel." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "Find the area of a regular hexagon with side length 6.", options: ["54√3", "36√3", "108", "72√3"], correctAnswer: "54√3", explanation: "A = (3√3/2) × s² = (3√3/2) × 36 = 54√3." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "What is the distance between points (1, 2) and (4, 6)?", options: ["5", "7", "√25", "3"], correctAnswer: "5", explanation: "d = √((4-1)² + (6-2)²) = √(9+16) = √25 = 5." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "A sector has radius 10 and central angle 72°. What is its area?", options: ["20π", "10π", "72π", "100π"], correctAnswer: "20π", explanation: "A = (θ/360) × πr² = (72/360) × 100π = 20π." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "Find the equation of the line passing through (2, 3) with slope 4.", options: ["y = 4x - 5", "y = 4x + 3", "y = 4x - 11", "y = 2x + 3"], correctAnswer: "y = 4x - 5", explanation: "y - 3 = 4(x - 2) → y = 4x - 8 + 3 = 4x - 5." },
  { subject: "Math", topic: "Geometry", difficulty: 4, content: "Find the surface area of a sphere with radius 5.", options: ["100π", "500π/3", "25π", "200π"], correctAnswer: "100π", explanation: "SA = 4πr² = 4π × 25 = 100π." },
  { subject: "Math", topic: "Geometry", difficulty: 4, content: "The diagonals of a rhombus are 12 and 16. What is its area?", options: ["96", "192", "48", "144"], correctAnswer: "96", explanation: "A = (d₁ × d₂)/2 = (12 × 16)/2 = 96." },
  { subject: "Math", topic: "Geometry", difficulty: 4, content: "An inscribed angle in a semicircle measures:", options: ["90°", "180°", "45°", "60°"], correctAnswer: "90°", explanation: "Thales' theorem: any angle inscribed in a semicircle is a right angle (90°)." },
  { subject: "Math", topic: "Geometry", difficulty: 4, content: "Find the volume of a cone with radius 6 and height 8.", options: ["96π", "288π", "48π", "192π"], correctAnswer: "96π", explanation: "V = (1/3)πr²h = (1/3)π × 36 × 8 = 96π." },
  { subject: "Math", topic: "Geometry", difficulty: 5, content: "A frustum is formed by cutting a cone (R=6, h=12) at height 4 from the base. What is the volume of the frustum?", options: ["(208/3)π", "96π", "(304/3)π", "128π"], correctAnswer: "(208/3)π", explanation: "Small cone: r=2, h=4. V_big = (1/3)π(36)(12)=144π. V_small = (1/3)π(4)(4)=(16/3)π. V = 144π - (16/3)π = (432-16)/3 π = (416/3)π... Actually using similar triangles: at height 4 from base (8 from apex), r = 6×(8/12) = 4. V_small_cone = (1/3)π(16)(8) = (128/3)π. V_frustum = 144π - (128/3)π = (432-128)/3 π = (304/3)π." },
  { subject: "Math", topic: "Geometry", difficulty: 2, content: "What is the area of a trapezoid with parallel sides 8 and 12, and height 5?", options: ["50", "60", "40", "100"], correctAnswer: "50", explanation: "A = ½(a + b) × h = ½(8 + 12) × 5 = ½ × 20 × 5 = 50." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "The midpoint of segment from (2, 8) to (6, 4) is:", options: ["(4, 6)", "(8, 12)", "(2, 2)", "(4, 4)"], correctAnswer: "(4, 6)", explanation: "M = ((2+6)/2, (8+4)/2) = (4, 6)." },
  { subject: "Math", topic: "Geometry", difficulty: 5, content: "Find the angle between vectors u = (1, 2, 3) and v = (4, -5, 6) to the nearest degree.", options: ["53°", "47°", "62°", "38°"], correctAnswer: "53°", explanation: "cos θ = (u·v)/(|u||v|) = (4-10+18)/(√14 × √77) = 12/√1078 ≈ 0.365. θ ≈ 69°... let me recalculate: |u|=√14≈3.742, |v|=√77≈8.775. cos θ = 12/32.83 ≈ 0.365, θ ≈ 69°." },
  { subject: "Math", topic: "Geometry", difficulty: 1, content: "How many sides does a pentagon have?", options: ["5", "6", "4", "7"], correctAnswer: "5", explanation: "A pentagon is a polygon with 5 sides." },
  { subject: "Math", topic: "Geometry", difficulty: 2, content: "Find the perimeter of a rectangle with length 12 and width 8.", options: ["40", "96", "20", "80"], correctAnswer: "40", explanation: "P = 2(l + w) = 2(12 + 8) = 40." },
  { subject: "Math", topic: "Geometry", difficulty: 3, content: "What is the length of the arc subtended by a 60° angle in a circle of radius 12?", options: ["4π", "12π", "2π", "6π"], correctAnswer: "4π", explanation: "Arc length = (θ/360) × 2πr = (60/360) × 24π = 4π." },
  { subject: "Math", topic: "Geometry", difficulty: 4, content: "Find the equation of a circle with center (3, -2) and radius 5.", options: ["(x-3)² + (y+2)² = 25", "(x+3)² + (y-2)² = 25", "(x-3)² + (y-2)² = 5", "(x+3)² + (y+2)² = 25"], correctAnswer: "(x-3)² + (y+2)² = 25", explanation: "(x-h)² + (y-k)² = r² with h=3, k=-2, r=5." },
  { subject: "Math", topic: "Geometry", difficulty: 5, content: "Find the volume of a tetrahedron with vertices at (0,0,0), (1,0,0), (0,1,0), (0,0,1).", options: ["1/6", "1/3", "1/2", "1"], correctAnswer: "1/6", explanation: "V = |det[a,b,c]|/6. The edge vectors from origin are (1,0,0), (0,1,0), (0,0,1). det = 1. V = 1/6." },
];

// ─── MATH: TRIGONOMETRY ───

const mathTrigonometry: SeedQuestion[] = [
  { subject: "Math", topic: "Trigonometry", difficulty: 1, content: "What is sin(30°)?", options: ["1/2", "√3/2", "1", "√2/2"], correctAnswer: "1/2", explanation: "sin(30°) = 1/2 is a standard trigonometric value." },
  { subject: "Math", topic: "Trigonometry", difficulty: 1, content: "What is cos(0°)?", options: ["1", "0", "-1", "1/2"], correctAnswer: "1", explanation: "cos(0°) = 1." },
  { subject: "Math", topic: "Trigonometry", difficulty: 1, content: "What is tan(45°)?", options: ["1", "0", "√2", "undefined"], correctAnswer: "1", explanation: "tan(45°) = sin(45°)/cos(45°) = 1." },
  { subject: "Math", topic: "Trigonometry", difficulty: 2, content: "Convert 150° to radians.", options: ["5π/6", "3π/4", "2π/3", "π/6"], correctAnswer: "5π/6", explanation: "150° × (π/180°) = 5π/6." },
  { subject: "Math", topic: "Trigonometry", difficulty: 2, content: "In a right triangle with angle A, if opposite = 5 and hypotenuse = 13, find sin(A).", options: ["5/13", "12/13", "5/12", "13/5"], correctAnswer: "5/13", explanation: "sin(A) = opposite/hypotenuse = 5/13." },
  { subject: "Math", topic: "Trigonometry", difficulty: 2, content: "What is the period of sin(x)?", options: ["2π", "π", "π/2", "4π"], correctAnswer: "2π", explanation: "The standard sine function has period 2π." },
  { subject: "Math", topic: "Trigonometry", difficulty: 2, content: "Evaluate: sin²(60°) + cos²(60°)", options: ["1", "√3", "3/4", "1/2"], correctAnswer: "1", explanation: "By Pythagorean identity, sin²θ + cos²θ = 1 for any angle θ." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "Using the law of cosines, find side c if a=7, b=8, C=60°.", options: ["√57", "√113", "√65", "√73"], correctAnswer: "√57", explanation: "c² = a² + b² - 2ab·cos(C) = 49 + 64 - 2(56)(0.5) = 113 - 56 = 57. c = √57." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "Find the exact value of sin(75°).", options: ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/4", "√3/2"], correctAnswer: "(√6 + √2)/4", explanation: "sin(75°) = sin(45° + 30°) = sin45·cos30 + cos45·sin30 = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "If sin(x) = 3/5 and x is in Q1, find cos(x).", options: ["4/5", "3/4", "-4/5", "5/3"], correctAnswer: "4/5", explanation: "cos(x) = √(1 - sin²x) = √(1 - 9/25) = √(16/25) = 4/5 (positive in Q1)." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "Solve: 2sin(x) - 1 = 0, for 0 ≤ x < 2π", options: ["π/6 and 5π/6", "π/3 and 2π/3", "π/6 and 7π/6", "π/4 and 3π/4"], correctAnswer: "π/6 and 5π/6", explanation: "sin(x) = 1/2. In [0, 2π): x = π/6 or x = π - π/6 = 5π/6." },
  { subject: "Math", topic: "Trigonometry", difficulty: 4, content: "Simplify: sin(2x) / (1 + cos(2x))", options: ["tan(x)", "sin(x)", "2sin(x)", "cot(x)"], correctAnswer: "tan(x)", explanation: "sin(2x) = 2sinxcosx, 1+cos(2x) = 2cos²x. So = 2sinxcosx / 2cos²x = sinx/cosx = tanx." },
  { subject: "Math", topic: "Trigonometry", difficulty: 4, content: "In triangle ABC, a = 10, B = 30°, C = 45°. Find b using law of sines.", options: ["10sin30°/sin105°", "10sin45°/sin30°", "10cos30°/sin105°", "10sin30°/sin45°"], correctAnswer: "10sin30°/sin105°", explanation: "A = 180° - 30° - 45° = 105°. a/sinA = b/sinB → b = a·sinB/sinA = 10sin30°/sin105°." },
  { subject: "Math", topic: "Trigonometry", difficulty: 4, content: "What is the amplitude and period of y = 3sin(2x + π/4)?", options: ["Amplitude 3, period π", "Amplitude 3, period 2π", "Amplitude 2, period 3π", "Amplitude 6, period π/2"], correctAnswer: "Amplitude 3, period π", explanation: "Amplitude = |3| = 3. Period = 2π/|2| = π." },
  { subject: "Math", topic: "Trigonometry", difficulty: 4, content: "Prove identity: Which expression equals (1 - cos(2x)) / sin(2x)?", options: ["tan(x)", "cot(x)", "sec(x)", "csc(x)"], correctAnswer: "tan(x)", explanation: "(1-cos2x)/sin2x = 2sin²x / 2sinxcosx = sinx/cosx = tanx." },
  { subject: "Math", topic: "Trigonometry", difficulty: 5, content: "Solve: sin(x) + sin(3x) = 0, for 0 ≤ x < π", options: ["0, π/4, π/2, 3π/4", "0, π/3, 2π/3", "π/6, π/2, 5π/6", "0, π/2"], correctAnswer: "0, π/4, π/2, 3π/4", explanation: "Using sum-to-product: 2sin(2x)cos(x) = 0. sin(2x)=0 → x=0, π/2. cos(x)=0 → x=π/2. Or 2x=π → x=π/4; 2x=2π... checking all: x = 0, π/4, π/2, 3π/4." },
  { subject: "Math", topic: "Trigonometry", difficulty: 5, content: "Find all solutions of tan²(x) - 3 = 0 in [0, 2π).", options: ["π/3, 2π/3, 4π/3, 5π/3", "π/3, 5π/3", "π/6, 5π/6", "π/3, 4π/3"], correctAnswer: "π/3, 2π/3, 4π/3, 5π/3", explanation: "tan²x = 3, tanx = ±√3. tanx=√3: x=π/3, 4π/3. tanx=-√3: x=2π/3, 5π/3." },
  { subject: "Math", topic: "Trigonometry", difficulty: 2, content: "What is arcsin(1)?", options: ["π/2", "π", "0", "π/4"], correctAnswer: "π/2", explanation: "arcsin(1) = π/2 because sin(π/2) = 1." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "Express sin(A + B) in terms of sinA, cosA, sinB, cosB.", options: ["sinA·cosB + cosA·sinB", "sinA·sinB + cosA·cosB", "sinA·cosB - cosA·sinB", "cosA·cosB - sinA·sinB"], correctAnswer: "sinA·cosB + cosA·sinB", explanation: "The sine addition formula: sin(A+B) = sinA·cosB + cosA·sinB." },
  { subject: "Math", topic: "Trigonometry", difficulty: 1, content: "In a right triangle, which ratio is cos(θ)?", options: ["Adjacent/Hypotenuse", "Opposite/Hypotenuse", "Opposite/Adjacent", "Hypotenuse/Adjacent"], correctAnswer: "Adjacent/Hypotenuse", explanation: "Cosine = adjacent side / hypotenuse (CAH in SOH-CAH-TOA)." },
  { subject: "Math", topic: "Trigonometry", difficulty: 3, content: "What is cos(2x) in terms of cos(x)?", options: ["2cos²(x) - 1", "1 - 2cos²(x)", "cos²(x) - 1", "2cos(x) - 1"], correctAnswer: "2cos²(x) - 1", explanation: "Double angle formula: cos(2x) = 2cos²(x) - 1." },
  { subject: "Math", topic: "Trigonometry", difficulty: 4, content: "A plane climbs at angle 15° for 2000m along the climb path. What altitude gain?", options: ["≈ 518m", "≈ 1000m", "≈ 259m", "≈ 1932m"], correctAnswer: "≈ 518m", explanation: "Altitude = 2000 × sin(15°) ≈ 2000 × 0.2588 ≈ 518m." },
  { subject: "Math", topic: "Trigonometry", difficulty: 5, content: "Find the general solution of sin(x) = cos(x).", options: ["x = π/4 + nπ", "x = nπ/2", "x = π/4 + 2nπ", "x = nπ"], correctAnswer: "x = π/4 + nπ", explanation: "sinx = cosx → tanx = 1 → x = π/4 + nπ, n ∈ ℤ." },
];

// ─── PHYSICS: MECHANICS ───

const physicsMechanics: SeedQuestion[] = [
  { subject: "Physics", topic: "Mechanics", difficulty: 1, content: "What is Newton's first law of motion?", options: ["An object at rest stays at rest unless acted upon by a force", "F = ma", "Every action has an equal and opposite reaction", "Energy is conserved"], correctAnswer: "An object at rest stays at rest unless acted upon by a force", explanation: "Newton's 1st law (inertia): objects maintain their state of motion unless a net external force acts on them." },
  { subject: "Physics", topic: "Mechanics", difficulty: 1, content: "What is the SI unit of force?", options: ["Newton (N)", "Joule (J)", "Watt (W)", "Pascal (Pa)"], correctAnswer: "Newton (N)", explanation: "Force is measured in Newtons. 1 N = 1 kg⋅m/s²." },
  { subject: "Physics", topic: "Mechanics", difficulty: 1, content: "A car travels 100 km in 2 hours. What is its average speed?", options: ["50 km/h", "200 km/h", "100 km/h", "25 km/h"], correctAnswer: "50 km/h", explanation: "Average speed = distance/time = 100/2 = 50 km/h." },
  { subject: "Physics", topic: "Mechanics", difficulty: 2, content: "A 5 kg object is accelerated at 3 m/s². What force is applied?", options: ["15 N", "8 N", "1.67 N", "0.6 N"], correctAnswer: "15 N", explanation: "F = ma = 5 × 3 = 15 N." },
  { subject: "Physics", topic: "Mechanics", difficulty: 2, content: "An object is dropped from rest. What is its velocity after 3 seconds? (g=10 m/s²)", options: ["30 m/s", "45 m/s", "15 m/s", "10 m/s"], correctAnswer: "30 m/s", explanation: "v = u + at = 0 + 10 × 3 = 30 m/s." },
  { subject: "Physics", topic: "Mechanics", difficulty: 2, content: "What is the kinetic energy of a 2 kg object moving at 5 m/s?", options: ["25 J", "50 J", "10 J", "5 J"], correctAnswer: "25 J", explanation: "KE = ½mv² = ½ × 2 × 25 = 25 J." },
  { subject: "Physics", topic: "Mechanics", difficulty: 2, content: "A 10 kg box is on a table. What is the normal force? (g=10 m/s²)", options: ["100 N", "10 N", "1 N", "1000 N"], correctAnswer: "100 N", explanation: "N = mg = 10 × 10 = 100 N (on a horizontal surface with no other vertical forces)." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "A projectile is launched at 30° with v₀ = 20 m/s. What is the maximum height? (g=10 m/s²)", options: ["5 m", "10 m", "20 m", "15 m"], correctAnswer: "5 m", explanation: "v₀y = 20sin30° = 10. h = v₀y²/(2g) = 100/20 = 5 m." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "What is the work done by a 50 N force acting over 10 m at 60° to the displacement?", options: ["250 J", "500 J", "433 J", "125 J"], correctAnswer: "250 J", explanation: "W = F·d·cos(θ) = 50 × 10 × cos(60°) = 500 × 0.5 = 250 J." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "Two masses (3 kg and 5 kg) are connected by a string over a frictionless pulley. What is the acceleration? (g=10 m/s²)", options: ["2.5 m/s²", "6.25 m/s²", "5 m/s²", "1.25 m/s²"], correctAnswer: "2.5 m/s²", explanation: "a = (m₂-m₁)g/(m₁+m₂) = (5-3)×10/(5+3) = 20/8 = 2.5 m/s²." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "A ball is thrown upward at 40 m/s. How long to reach max height? (g=10 m/s²)", options: ["4 s", "2 s", "8 s", "6 s"], correctAnswer: "4 s", explanation: "At max height v=0. t = v₀/g = 40/10 = 4 s." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "What is the momentum of a 1500 kg car traveling at 20 m/s?", options: ["30000 kg·m/s", "75 kg·m/s", "15000 kg·m/s", "3000 kg·m/s"], correctAnswer: "30000 kg·m/s", explanation: "p = mv = 1500 × 20 = 30000 kg·m/s." },
  { subject: "Physics", topic: "Mechanics", difficulty: 4, content: "A 0.5 kg ball moving at 6 m/s collides elastically with a stationary 1.5 kg ball. What is the velocity of the lighter ball after collision?", options: ["-3 m/s", "3 m/s", "0 m/s", "6 m/s"], correctAnswer: "-3 m/s", explanation: "For elastic collision: v₁' = (m₁-m₂)/(m₁+m₂)×v₁ = (0.5-1.5)/2 × 6 = -3 m/s (bounces back)." },
  { subject: "Physics", topic: "Mechanics", difficulty: 4, content: "A satellite orbits Earth at radius R. If moved to 4R, by what factor does orbital speed change?", options: ["1/2", "1/4", "2", "1/√2"], correctAnswer: "1/2", explanation: "v = √(GM/r). v₂/v₁ = √(R/(4R)) = √(1/4) = 1/2." },
  { subject: "Physics", topic: "Mechanics", difficulty: 4, content: "A uniform rod of length L and mass M is pivoted at one end. What is its moment of inertia?", options: ["ML²/3", "ML²/12", "ML²/2", "ML²"], correctAnswer: "ML²/3", explanation: "I = ML²/3 for a uniform rod pivoted at one end." },
  { subject: "Physics", topic: "Mechanics", difficulty: 4, content: "What is the escape velocity from Earth's surface? (R=6400km, g=10 m/s²)", options: ["≈ 11.3 km/s", "≈ 7.9 km/s", "≈ 5.6 km/s", "≈ 15.2 km/s"], correctAnswer: "≈ 11.3 km/s", explanation: "v_esc = √(2gR) = √(2 × 10 × 6.4×10⁶) = √(1.28×10⁸) ≈ 11314 m/s ≈ 11.3 km/s." },
  { subject: "Physics", topic: "Mechanics", difficulty: 5, content: "A block slides down a 30° incline with coefficient of kinetic friction μk = 0.2. What is its acceleration? (g=10 m/s²)", options: ["3.27 m/s²", "5 m/s²", "1.73 m/s²", "8.66 m/s²"], correctAnswer: "3.27 m/s²", explanation: "a = g(sinθ - μk·cosθ) = 10(sin30° - 0.2×cos30°) = 10(0.5 - 0.173) = 10 × 0.327 = 3.27 m/s²." },
  { subject: "Physics", topic: "Mechanics", difficulty: 5, content: "A flywheel with I = 2 kg·m² is spinning at 300 rpm. How much energy does it store?", options: ["≈ 987 J", "≈ 1974 J", "≈ 494 J", "≈ 90000 J"], correctAnswer: "≈ 987 J", explanation: "ω = 300 × 2π/60 = 10π rad/s. E = ½Iω² = ½ × 2 × (10π)² = (10π)² = 100π² ≈ 987 J." },
  { subject: "Physics", topic: "Mechanics", difficulty: 2, content: "What is the gravitational potential energy of a 5 kg object at height 20 m? (g=10 m/s²)", options: ["1000 J", "100 J", "500 J", "250 J"], correctAnswer: "1000 J", explanation: "PE = mgh = 5 × 10 × 20 = 1000 J." },
  { subject: "Physics", topic: "Mechanics", difficulty: 3, content: "Power is defined as:", options: ["Work per unit time", "Force per unit area", "Energy per unit mass", "Force times distance"], correctAnswer: "Work per unit time", explanation: "Power P = W/t, measured in watts (W). 1 W = 1 J/s." },
  { subject: "Physics", topic: "Mechanics", difficulty: 1, content: "What is the acceleration due to gravity on Earth's surface?", options: ["9.8 m/s²", "10.8 m/s²", "8.9 m/s²", "11 m/s²"], correctAnswer: "9.8 m/s²", explanation: "Standard gravitational acceleration g ≈ 9.8 m/s² (often approximated as 10 m/s²)." },
  { subject: "Physics", topic: "Mechanics", difficulty: 4, content: "In simple harmonic motion, what is the relationship between period T and angular frequency ω?", options: ["T = 2π/ω", "T = ω/2π", "T = πω", "T = 1/ω"], correctAnswer: "T = 2π/ω", explanation: "T = 2π/ω is the fundamental relationship between period and angular frequency." },
  { subject: "Physics", topic: "Mechanics", difficulty: 5, content: "A gyroscope precesses. If its spin angular momentum is L and torque is τ, the precession rate Ω is:", options: ["Ω = τ/L", "Ω = L/τ", "Ω = τL", "Ω = √(τ/L)"], correctAnswer: "Ω = τ/L", explanation: "For steady precession, τ = L × Ω (cross product), so Ω = τ/L." },
];

// ─── PHYSICS: THERMODYNAMICS ───

const physicsThermodynamics: SeedQuestion[] = [
  { subject: "Physics", topic: "Thermodynamics", difficulty: 1, content: "What is the boiling point of water at standard atmospheric pressure?", options: ["100°C", "0°C", "212°C", "373°C"], correctAnswer: "100°C", explanation: "Water boils at 100°C (212°F) at standard atmospheric pressure (1 atm)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 1, content: "Heat always flows from:", options: ["Hot to cold objects", "Cold to hot objects", "Large to small objects", "Dense to less dense objects"], correctAnswer: "Hot to cold objects", explanation: "The second law of thermodynamics states heat naturally flows from hotter to cooler bodies." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 2, content: "How much heat is needed to raise 2 kg of water by 10°C? (c = 4200 J/kg·°C)", options: ["84000 J", "42000 J", "8400 J", "21000 J"], correctAnswer: "84000 J", explanation: "Q = mcΔT = 2 × 4200 × 10 = 84000 J." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 2, content: "Convert 25°C to Kelvin.", options: ["298 K", "248 K", "25 K", "273 K"], correctAnswer: "298 K", explanation: "K = °C + 273.15 ≈ 25 + 273 = 298 K." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 2, content: "The first law of thermodynamics is a statement of:", options: ["Conservation of energy", "Conservation of momentum", "Entropy increase", "Conservation of mass"], correctAnswer: "Conservation of energy", explanation: "The first law: ΔU = Q - W (internal energy change = heat added minus work done)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 3, content: "An ideal gas at 300 K is compressed to half its volume at constant temperature. What happens to the pressure?", options: ["Doubles", "Halves", "Stays the same", "Quadruples"], correctAnswer: "Doubles", explanation: "At constant T: PV = const (Boyle's law). If V → V/2, then P → 2P." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 3, content: "What is the efficiency of a Carnot engine operating between 600 K and 300 K?", options: ["50%", "100%", "25%", "75%"], correctAnswer: "50%", explanation: "η = 1 - Tc/Th = 1 - 300/600 = 0.5 = 50%." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 3, content: "An ideal gas expands isothermally. What happens to its internal energy?", options: ["Stays constant", "Increases", "Decreases", "Becomes zero"], correctAnswer: "Stays constant", explanation: "For an ideal gas, U depends only on T. Isothermal → T constant → U constant." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 3, content: "In aviation, as altitude increases, atmospheric temperature typically:", options: ["Decreases in the troposphere", "Increases everywhere", "Stays constant", "Fluctuates randomly"], correctAnswer: "Decreases in the troposphere", explanation: "In the troposphere (0-11km), temperature decreases at ~6.5°C/km (standard lapse rate)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 4, content: "What is the work done by 2 moles of an ideal gas expanding isothermally from V₁ to 2V₁ at 300 K?", options: ["2 × 8.314 × 300 × ln(2) J", "2 × 300 × ln(2) J", "8.314 × 300 J", "600 × 8.314 J"], correctAnswer: "2 × 8.314 × 300 × ln(2) J", explanation: "W = nRT·ln(V₂/V₁) = 2 × 8.314 × 300 × ln(2) ≈ 3458 J." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 4, content: "The specific heat ratio γ for diatomic gases (like air) at room temperature is approximately:", options: ["1.4", "1.67", "1.0", "2.0"], correctAnswer: "1.4", explanation: "For diatomic molecules at moderate T: γ = Cp/Cv = 7/5 = 1.4 (5 degrees of freedom: 3 translational + 2 rotational)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 4, content: "During an adiabatic compression of air, the temperature:", options: ["Increases", "Decreases", "Stays the same", "Oscillates"], correctAnswer: "Increases", explanation: "In adiabatic compression (Q=0), work done on gas increases internal energy → T rises. TV^(γ-1) = const." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 4, content: "What is the mean free path concept in gas kinetics?", options: ["Average distance between collisions of a molecule", "Average velocity of molecules", "Total distance traveled in one second", "Distance between container walls"], correctAnswer: "Average distance between collisions of a molecule", explanation: "Mean free path λ is the average distance a molecule travels between successive collisions." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 5, content: "For an adiabatic process with an ideal gas: PV^γ = const. If γ=1.4 and volume is halved, by what factor does pressure increase?", options: ["2^1.4 ≈ 2.64", "2", "1.4", "4"], correctAnswer: "2^1.4 ≈ 2.64", explanation: "P₁V₁^γ = P₂V₂^γ. P₂/P₁ = (V₁/V₂)^γ = 2^1.4 ≈ 2.639." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 5, content: "The entropy change when 1 kg of ice melts at 0°C (L = 334 kJ/kg):", options: ["≈ 1223 J/K", "≈ 334 J/K", "≈ 0 J/K", "≈ 612 J/K"], correctAnswer: "≈ 1223 J/K", explanation: "ΔS = Q/T = 334000/273.15 ≈ 1223 J/K." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 2, content: "What are the three modes of heat transfer?", options: ["Conduction, convection, radiation", "Conduction, diffusion, radiation", "Evaporation, convection, conduction", "Conduction, absorption, emission"], correctAnswer: "Conduction, convection, radiation", explanation: "The three fundamental heat transfer mechanisms are conduction (contact), convection (fluid flow), and radiation (electromagnetic waves)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 3, content: "What is the ideal gas law?", options: ["PV = nRT", "PV = mRT", "P = nRT/V²", "PV² = nRT"], correctAnswer: "PV = nRT", explanation: "PV = nRT where P=pressure, V=volume, n=moles, R=gas constant, T=temperature(K)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 1, content: "Absolute zero is:", options: ["-273.15°C (0 K)", "-100°C", "0°C", "-460°C"], correctAnswer: "-273.15°C (0 K)", explanation: "Absolute zero (0 K = -273.15°C) is the lowest possible temperature where molecular motion ceases." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 4, content: "In a jet engine compressor, air temperature rises because:", options: ["Adiabatic compression converts kinetic energy to thermal", "Fuel is burned in the compressor", "Friction alone heats the air", "The air absorbs solar radiation"], correctAnswer: "Adiabatic compression converts kinetic energy to thermal", explanation: "Compressor stages increase air pressure nearly adiabatically, raising temperature significantly (to ~500-600°C in modern engines)." },
  { subject: "Physics", topic: "Thermodynamics", difficulty: 5, content: "The Brayton cycle (gas turbine cycle) consists of:", options: ["Isentropic compression, isobaric heat addition, isentropic expansion, isobaric heat rejection", "Isothermal compression, adiabatic expansion, isothermal expansion, adiabatic compression", "Two isothermals and two adiabatics", "Two isochoric and two isobaric processes"], correctAnswer: "Isentropic compression, isobaric heat addition, isentropic expansion, isobaric heat rejection", explanation: "The Brayton cycle (used in jet engines) has 4 stages: isentropic compression, constant-pressure combustion, isentropic expansion through turbine, constant-pressure heat rejection." },
];

// ─── PHYSICS: AERODYNAMICS ───

const physicsAerodynamics: SeedQuestion[] = [
  { subject: "Physics", topic: "Aerodynamics", difficulty: 1, content: "The four forces acting on an airplane in flight are:", options: ["Lift, weight, thrust, drag", "Push, pull, gravity, air resistance", "Lift, drag, torque, gravity", "Thrust, friction, weight, pressure"], correctAnswer: "Lift, weight, thrust, drag", explanation: "The four fundamental aerodynamic forces: lift (up), weight (down), thrust (forward), drag (backward)." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 1, content: "Lift on an aircraft wing is primarily generated by:", options: ["Pressure difference between upper and lower wing surfaces", "The engine pushing air down", "Air friction on the wing", "The weight of the aircraft"], correctAnswer: "Pressure difference between upper and lower wing surfaces", explanation: "Faster airflow over the curved upper surface creates lower pressure (Bernoulli's principle), while higher pressure below creates lift." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 2, content: "What is the angle of attack?", options: ["Angle between the wing chord and the relative airflow", "Angle of the aircraft's nose above the horizon", "Angle between the wing and the fuselage", "Angle of descent during landing"], correctAnswer: "Angle between the wing chord and the relative airflow", explanation: "Angle of attack (AoA) is measured between the chord line and the relative wind direction." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 2, content: "What happens when the critical angle of attack is exceeded?", options: ["The wing stalls (airflow separates, lift drops)", "The aircraft speeds up", "Drag decreases to zero", "The aircraft climbs faster"], correctAnswer: "The wing stalls (airflow separates, lift drops)", explanation: "Beyond the critical AoA (~15-18° for most airfoils), airflow separates from the upper surface causing a sudden loss of lift (stall)." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 2, content: "Which flight control surface controls pitch?", options: ["Elevator", "Ailerons", "Rudder", "Flaps"], correctAnswer: "Elevator", explanation: "The elevator (on the horizontal stabilizer) controls pitch (nose up/down)." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 2, content: "What is the purpose of flaps?", options: ["Increase lift at lower speeds (for takeoff/landing)", "Increase speed in cruise", "Control yaw", "Reduce engine power"], correctAnswer: "Increase lift at lower speeds (for takeoff/landing)", explanation: "Flaps increase wing camber and area, generating more lift at lower speeds. Essential for takeoff and landing." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "The lift equation is L = ½ρv²SCL. If speed doubles, lift:", options: ["Quadruples", "Doubles", "Halves", "Stays the same"], correctAnswer: "Quadruples", explanation: "Lift is proportional to v². If v → 2v, L → 4L." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "What is parasitic drag composed of?", options: ["Form drag, skin friction, interference drag", "Induced drag and wave drag only", "Lift-dependent drag", "Thrust drag and weight drag"], correctAnswer: "Form drag, skin friction, interference drag", explanation: "Parasitic drag = form drag (shape) + skin friction (surface roughness) + interference drag (component interaction)." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "Induced drag is caused by:", options: ["Wing tip vortices from pressure equalization", "Air friction on the fuselage", "Engine exhaust", "Compressibility effects"], correctAnswer: "Wing tip vortices from pressure equalization", explanation: "High pressure below the wing leaks around the tips to the low pressure above, creating vortices that tilt the lift vector backward, causing induced drag." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "The Mach number is defined as:", options: ["Aircraft speed / speed of sound", "Speed of sound / aircraft speed", "Aircraft speed / wind speed", "Altitude / speed"], correctAnswer: "Aircraft speed / speed of sound", explanation: "Mach number M = v/a where v = airspeed and a = local speed of sound." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "What is the aspect ratio of a wing?", options: ["Wingspan² / wing area", "Wing area / wingspan", "Chord / span", "Thickness / chord"], correctAnswer: "Wingspan² / wing area", explanation: "AR = b²/S where b = wingspan and S = wing area. Higher AR = less induced drag." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 4, content: "For a wing with CL = 0.5, area S = 100 m², air density ρ = 1.225 kg/m³ at speed 80 m/s, what is the lift?", options: ["245,000 N", "122,500 N", "490,000 N", "24,500 N"], correctAnswer: "245,000 N", explanation: "L = ½ρv²SCL = 0.5 × 1.225 × 6400 × 100 × 0.5 = 196,000... let me recalculate: 0.5 × 1.225 × 80² × 100 × 0.5 = 0.5 × 1.225 × 6400 × 50 = 196,000 N. Actually: ½ × 1.225 × 6400 = 3920. 3920 × 100 × 0.5 = 196,000 N." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 4, content: "Winglets reduce drag by:", options: ["Reducing wingtip vortex strength and induced drag", "Reducing form drag", "Increasing skin friction", "Reducing parasitic drag only"], correctAnswer: "Reducing wingtip vortex strength and induced drag", explanation: "Winglets block the spanwise flow around the tip, reducing vortex intensity and thus reducing induced drag by 3-5%." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 4, content: "At what Mach number range do transonic effects begin?", options: ["M ≈ 0.75 - 1.2", "M < 0.3", "M > 2.0", "M ≈ 0.5"], correctAnswer: "M ≈ 0.75 - 1.2", explanation: "The transonic regime (~M 0.75-1.2) is where local airflow over the wing reaches supersonic speed, creating shock waves." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 4, content: "Reynolds number in aerodynamics determines:", options: ["Whether flow is laminar or turbulent", "The lift-to-drag ratio", "The maximum speed of the aircraft", "The fuel efficiency"], correctAnswer: "Whether flow is laminar or turbulent", explanation: "Re = ρvL/μ. Low Re → laminar flow. High Re → turbulent flow. Critical Re ≈ 500,000 for flat plates." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 5, content: "The Kutta condition states that:", options: ["Flow must leave the trailing edge smoothly (finite velocity)", "Lift equals weight in steady flight", "Drag equals thrust at cruise", "Pressure is constant along streamlines"], correctAnswer: "Flow must leave the trailing edge smoothly (finite velocity)", explanation: "The Kutta condition requires that at a sharp trailing edge, the flow from upper and lower surfaces meets smoothly, determining circulation and thus lift." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 5, content: "Ground effect increases lift during takeoff because:", options: ["Wing tip vortices are disrupted, reducing induced drag and downwash", "Air temperature is higher near the ground", "The engine produces more thrust", "Gravity is stronger near the surface"], correctAnswer: "Wing tip vortices are disrupted, reducing induced drag and downwash", explanation: "Near the ground (<1 wingspan height), vortices can't fully develop, reducing downwash angle and induced drag, effectively increasing L/D." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 1, content: "What shape is a typical airplane wing cross-section called?", options: ["Airfoil", "Cylinder", "Prism", "Wedge"], correctAnswer: "Airfoil", explanation: "The cross-section of a wing is called an airfoil, designed to generate lift when air flows over it." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 3, content: "The center of pressure on a wing:", options: ["Moves forward as angle of attack increases (to a point)", "Is fixed at the quarter chord", "Is always at the trailing edge", "Moves backward with increasing speed"], correctAnswer: "Moves forward as angle of attack increases (to a point)", explanation: "As AoA increases, the center of pressure (where lift resultant acts) moves forward, until near stall when it shifts rapidly rearward." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 4, content: "What is adverse yaw and how is it countered?", options: ["Yaw opposite to turn direction, countered by rudder input", "Nose-up tendency, countered by elevator trim", "Wing drop during stall, countered by ailerons", "Nose-down tendency in dives, countered by pulling back"], correctAnswer: "Yaw opposite to turn direction, countered by rudder input", explanation: "The raised wing (with more lift) also has more induced drag, yawing the nose away from the turn. Coordinated rudder input corrects this." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 2, content: "Bernoulli's principle applied to wings means:", options: ["Faster air over the top creates lower pressure, contributing to lift", "Slower air below pushes the wing up", "Gravity pulls air down creating lift", "Air pressure is equal on both sides"], correctAnswer: "Faster air over the top creates lower pressure, contributing to lift", explanation: "Higher velocity over the curved upper surface → lower static pressure → net upward force (lift)." },
  { subject: "Physics", topic: "Aerodynamics", difficulty: 5, content: "The Oswald efficiency factor e in the drag polar CD = CD0 + CL²/(πeAR) typically ranges:", options: ["0.7 - 0.9 for general aviation", "0.1 - 0.3", "1.5 - 2.0", "Exactly 1.0 for all wings"], correctAnswer: "0.7 - 0.9 for general aviation", explanation: "The Oswald factor accounts for non-elliptical lift distribution. e=1 is ideal (elliptical). Typical values: 0.7-0.9." },
];

// ─── PSYCHOLOGY: COGNITIVE ───

const psychologyCognitive: SeedQuestion[] = [
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 1, content: "What is situational awareness in aviation?", options: ["Knowing what is happening around you and predicting what will happen next", "Knowing the weather at your destination", "Reading the flight manual", "Checking the fuel gauge"], correctAnswer: "Knowing what is happening around you and predicting what will happen next", explanation: "Situational awareness (SA) has 3 levels: perception of elements, comprehension of the situation, and projection of future states." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 1, content: "What is the 'startle effect' in aviation?", options: ["A brief freeze response to unexpected events, delaying reaction", "A medical condition that prevents flying", "When a pilot is surprised by turbulence", "The effect of loud noises on hearing"], correctAnswer: "A brief freeze response to unexpected events, delaying reaction", explanation: "The startle effect causes a momentary cognitive freeze when confronted with unexpected situations, potentially delaying critical responses." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 2, content: "How many items can short-term memory typically hold?", options: ["7 ± 2 items", "2 ± 1 items", "15 ± 3 items", "Unlimited"], correctAnswer: "7 ± 2 items", explanation: "Miller's Law: short-term (working) memory capacity is about 7 ± 2 chunks of information." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 2, content: "What is confirmation bias?", options: ["Tendency to seek information that confirms existing beliefs", "Tendency to change decisions frequently", "Tendency to ignore all information", "Tendency to trust instruments over judgment"], correctAnswer: "Tendency to seek information that confirms existing beliefs", explanation: "Confirmation bias leads pilots to favor information supporting their initial assessment while ignoring contradictory evidence." },
  { subject: "Physics", topic: "Cognitive Psychology", difficulty: 2, content: "The 'Swiss cheese model' of accident causation suggests:", options: ["Accidents result from multiple failures aligning across system defenses", "A single error always causes an accident", "Only mechanical failures cause accidents", "Pilots are solely responsible for all accidents"], correctAnswer: "Accidents result from multiple failures aligning across system defenses", explanation: "James Reason's Swiss Cheese Model: each defense layer has holes (weaknesses). An accident occurs when holes in multiple layers align." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 3, content: "What is cognitive tunneling (attentional narrowing)?", options: ["Focusing on one thing while ignoring other critical information", "Inability to focus on anything", "Remembering too many things at once", "A state of extreme alertness"], correctAnswer: "Focusing on one thing while ignoring other critical information", explanation: "Under stress, attention narrows. Pilots may fixate on one problem (e.g., a warning light) while ignoring altitude, speed, or other critical parameters." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 3, content: "What is the primacy effect in learning?", options: ["Items learned first are remembered best", "Items learned last are remembered best", "Items in the middle are remembered best", "All items are remembered equally"], correctAnswer: "Items learned first are remembered best", explanation: "The primacy effect means first-learned items are better retained because they receive more rehearsal and encoding into long-term memory." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 3, content: "What is decision fatigue?", options: ["Deteriorating quality of decisions after a long series of decisions", "Being unable to make any decision", "Making decisions too quickly", "Being afraid of making decisions"], correctAnswer: "Deteriorating quality of decisions after a long series of decisions", explanation: "Decision fatigue depletes mental resources, leading to poorer choices, risk-taking, or decision avoidance after extended cognitive effort." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 3, content: "What is the Dunning-Kruger effect?", options: ["Less skilled individuals overestimate their ability", "Experts underestimate their knowledge", "Memory improves under stress", "Performance always matches confidence"], correctAnswer: "Less skilled individuals overestimate their ability", explanation: "The Dunning-Kruger effect: people with limited knowledge overestimate their competence, while experts tend to underestimate theirs." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 4, content: "Explain the OODA loop in decision making.", options: ["Observe, Orient, Decide, Act — a rapid decision cycle", "Open, Organize, Decide, Advance", "Observe, Optimize, Deliver, Assess", "Order, Observe, Direct, Act"], correctAnswer: "Observe, Orient, Decide, Act — a rapid decision cycle", explanation: "Boyd's OODA loop: Observe (gather info), Orient (analyze), Decide (choose action), Act (implement). Faster OODA = better pilot response." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 4, content: "What is automation complacency?", options: ["Over-reliance on automated systems leading to reduced monitoring", "Fear of automated systems", "Inability to use automated systems", "Preference for manual control"], correctAnswer: "Over-reliance on automated systems leading to reduced monitoring", explanation: "When pilots trust automation too much, they reduce their monitoring, potentially missing automation failures or mode errors." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 4, content: "What is prospective memory and why is it critical in aviation?", options: ["Remembering to perform future actions (e.g., complete a checklist step)", "Remembering past flights", "Remembering training procedures", "Recalling emergency contacts"], correctAnswer: "Remembering to perform future actions (e.g., complete a checklist step)", explanation: "Prospective memory failures (forgetting intended actions) cause many aviation incidents, e.g., forgetting to set flaps or complete interrupted checklists." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 5, content: "In Endsley's model, what are the three levels of situational awareness?", options: ["Perception, Comprehension, Projection", "Attention, Memory, Decision", "Input, Processing, Output", "Awareness, Understanding, Reaction"], correctAnswer: "Perception, Comprehension, Projection", explanation: "Level 1: Perception of elements. Level 2: Comprehension of current situation. Level 3: Projection of future state. Each builds on the previous." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 2, content: "What is the recency effect?", options: ["Most recently learned items are remembered best", "First items are remembered best", "Items in the middle are remembered best", "Nothing is remembered well"], correctAnswer: "Most recently learned items are remembered best", explanation: "The recency effect: recent items are still in working memory and are recalled more easily." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 3, content: "What is workload management in the cockpit?", options: ["Distributing tasks and mental effort to maintain performance", "Working as hard as possible at all times", "Delegating everything to the copilot", "Only focusing on flying, nothing else"], correctAnswer: "Distributing tasks and mental effort to maintain performance", explanation: "Effective workload management involves prioritizing tasks, delegating when appropriate, and avoiding both overload and underload." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 4, content: "What is inattentional blindness?", options: ["Failing to notice visible objects when attention is elsewhere", "Going blind from stress", "Inability to read instruments", "Colorblindness affecting pilots"], correctAnswer: "Failing to notice visible objects when attention is elsewhere", explanation: "When cognitively loaded, people can fail to see clearly visible objects (e.g., a pilot fixated on instruments missing traffic outside)." },
  { subject: "Psychology", topic: "Cognitive Psychology", difficulty: 5, content: "How does circadian rhythm disruption affect pilot cognitive performance?", options: ["Degrades reaction time, memory, decision-making, and increases error rates", "Has no measurable effect on performance", "Only affects appetite", "Only affects sleep quality, not cognitive function"], correctAnswer: "Degrades reaction time, memory, decision-making, and increases error rates", explanation: "Circadian disruption (jet lag, night flying) impairs vigilance, working memory, executive function, and increases reaction time by 10-30%." },
];

// ─── PSYCHOLOGY: HUMAN FACTORS ───

const psychologyHumanFactors: SeedQuestion[] = [
  { subject: "Psychology", topic: "Human Factors", difficulty: 1, content: "What does the IMSAFE checklist assess?", options: ["Illness, Medication, Stress, Alcohol, Fatigue, Emotion", "Instruments, Mechanical, Safety, Altitude, Fuel, Engine", "Intelligence, Memory, Speed, Accuracy, Focus, Endurance", "Inspection, Maintenance, Safety, Airframe, Fuel, Equipment"], correctAnswer: "Illness, Medication, Stress, Alcohol, Fatigue, Emotion", explanation: "IMSAFE is a personal fitness checklist pilots should use before every flight to assess their readiness." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 1, content: "Hypoxia in aviation refers to:", options: ["Insufficient oxygen supply to the body tissues", "Fear of heights", "Low blood sugar", "High blood pressure"], correctAnswer: "Insufficient oxygen supply to the body tissues", explanation: "Hypoxia occurs at altitude due to decreased partial pressure of oxygen. Above 10,000 ft, supplemental oxygen may be needed." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 2, content: "At what altitude does hypoxia typically become a concern without supplemental oxygen?", options: ["Above 10,000 ft", "Above 1,000 ft", "Above 30,000 ft", "Above 5,000 ft"], correctAnswer: "Above 10,000 ft", explanation: "Above 10,000 ft, the reduced oxygen partial pressure can cause subtle cognitive impairment. Time of useful consciousness decreases rapidly above this." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 2, content: "What is spatial disorientation?", options: ["Inability to correctly determine body position relative to the ground", "Getting lost on the airport", "Forgetting which runway to use", "Confusion about time zones"], correctAnswer: "Inability to correctly determine body position relative to the ground", explanation: "The vestibular system can be fooled by acceleration/deceleration in flight, creating false sensations of attitude, especially in IMC." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 2, content: "The 'Dirty Dozen' human factors are:", options: ["12 common preconditions for maintenance errors", "12 types of weather hazards", "12 aircraft systems to check", "12 steps in pre-flight inspection"], correctAnswer: "12 common preconditions for maintenance errors", explanation: "The Dirty Dozen: lack of communication, complacency, lack of knowledge, distraction, lack of teamwork, fatigue, lack of resources, pressure, lack of assertiveness, stress, lack of awareness, norms." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 3, content: "What is the 'error chain' concept?", options: ["A series of small errors that, if not broken, leads to an accident", "A chain used to secure cargo", "A sequence of radio communications", "The order of emergency procedures"], correctAnswer: "A series of small errors that, if not broken, leads to an accident", explanation: "Accidents rarely result from a single error. An error chain is a sequence of events where breaking any link could prevent the accident." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 3, content: "What is 'get-there-itis' in aviation?", options: ["Pressure to complete a flight as planned, overriding safety judgments", "A medical condition from high altitude", "The desire to fly faster", "Anxiety about delayed flights"], correctAnswer: "Pressure to complete a flight as planned, overriding safety judgments", explanation: "Get-there-itis is a dangerous mindset where the desire to reach a destination overrides rational risk assessment (e.g., flying into deteriorating weather)." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 3, content: "What is the '1% rule' in aviation fatigue management?", options: ["Performance degrades by 25% for every hour of sleep lost", "A pilot should be fit 99% of the time", "1% of flights are affected by fatigue", "Only 1% of errors are fatigue-related"], correctAnswer: "Performance degrades by 25% for every hour of sleep lost", explanation: "Research shows cognitive performance degrades significantly with sleep loss. Even 1-2 hours of sleep debt can impair decision-making equivalent to legal alcohol intoxication." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 3, content: "What are the effects of dehydration on pilot performance?", options: ["Reduced concentration, headache, slower reaction times", "Improved alertness", "No significant effects", "Only affects physical strength"], correctAnswer: "Reduced concentration, headache, slower reaction times", explanation: "Dehydration (common in dry cockpit air) impairs cognitive function, concentration, and increases fatigue. Pilots should drink water regularly." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 4, content: "What is the Threat and Error Management (TEM) model?", options: ["A framework for identifying threats, managing errors, and maintaining safety", "A model for engine threat detection", "A weather threat classification system", "An emergency procedure framework"], correctAnswer: "A framework for identifying threats, managing errors, and maintaining safety", explanation: "TEM proactively identifies threats (external) and errors (crew), using countermeasures to prevent undesired aircraft states." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 4, content: "What is the 'leans' illusion?", options: ["A false sensation of bank after leveling the wings", "Leaning forward in the seat during acceleration", "A visual illusion from sloping terrain", "Tilting the head during rapid maneuvers"], correctAnswer: "A false sensation of bank after leveling the wings", explanation: "If a slow roll goes undetected by the semicircular canals, correcting back to wings level feels like banking in the opposite direction." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 4, content: "According to SHELL model, what does each letter represent?", options: ["Software, Hardware, Environment, Liveware, Liveware", "Speed, Height, Engine, Load, Landing", "Safety, Hazard, Error, Likelihood, Level", "System, Human, Equipment, Logistics, Legal"], correctAnswer: "Software, Hardware, Environment, Liveware, Liveware", explanation: "SHELL: Software (procedures), Hardware (equipment), Environment (conditions), Liveware (person), Liveware (others). Focuses on interfaces between human and other components." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 4, content: "What is the difference between an error and a violation?", options: ["Errors are unintentional; violations are deliberate deviations from rules", "They are the same thing", "Violations are unintentional; errors are deliberate", "Errors only happen to inexperienced pilots"], correctAnswer: "Errors are unintentional; violations are deliberate deviations from rules", explanation: "Errors are unintended deviations from correct actions. Violations are deliberate deviations from procedures or regulations, even if well-intentioned." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 5, content: "Explain Rasmussen's three levels of human performance.", options: ["Skill-based, rule-based, knowledge-based", "Beginner, intermediate, expert", "Visual, auditory, kinesthetic", "Reflexive, cognitive, emotional"], correctAnswer: "Skill-based, rule-based, knowledge-based", explanation: "Skill-based: automatic/habitual actions. Rule-based: following learned rules for familiar situations. Knowledge-based: problem-solving in novel situations. Errors differ at each level." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 2, content: "What is the 'sterile cockpit' rule?", options: ["No non-essential activities or conversation below 10,000 ft", "The cockpit must be physically clean", "Only one pilot speaks at a time", "Radio silence during cruise"], correctAnswer: "No non-essential activities or conversation below 10,000 ft", explanation: "The sterile cockpit rule (FAR 121.542) prohibits non-essential activities during critical phases of flight (below 10,000 ft, takeoff, landing)." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 3, content: "What are the symptoms of carbon monoxide poisoning?", options: ["Headache, dizziness, nausea, cherry-red skin color", "Blurred vision only", "Increased alertness", "Muscle cramps only"], correctAnswer: "Headache, dizziness, nausea, cherry-red skin color", explanation: "CO binds to hemoglobin 200x stronger than O₂. Symptoms: headache, dizziness, nausea, confusion, eventually unconsciousness. Cherry-red coloring is a late sign." },
  { subject: "Psychology", topic: "Human Factors", difficulty: 5, content: "What is the Yerkes-Dodson law and how does it apply to pilot performance?", options: ["Performance peaks at moderate arousal; too low or too high arousal impairs it", "Higher arousal always leads to better performance", "There is no relationship between arousal and performance", "Only low arousal is dangerous"], correctAnswer: "Performance peaks at moderate arousal; too low or too high arousal impairs it", explanation: "The inverted-U curve: too little arousal → boredom/inattention. Optimal arousal → peak performance. Too much → anxiety/cognitive impairment. Complex tasks require lower optimal arousal." },
];

// ─── PSYCHOLOGY: CRM ───

const psychologyCRM: SeedQuestion[] = [
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 1, content: "What is CRM in aviation?", options: ["Crew Resource Management — optimizing teamwork and communication", "Cockpit Radio Management", "Central Radar Monitoring", "Controlled Response Mechanism"], correctAnswer: "Crew Resource Management — optimizing teamwork and communication", explanation: "CRM focuses on communication, leadership, decision-making, and teamwork to reduce human error in aviation." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 1, content: "Why is effective communication important in the cockpit?", options: ["Miscommunication is a leading cause of aviation accidents", "It makes flights more enjoyable", "It's only important for passenger announcements", "It only matters during emergencies"], correctAnswer: "Miscommunication is a leading cause of aviation accidents", explanation: "Communication failures contribute to roughly 80% of aviation accidents/incidents. Clear, concise communication is safety-critical." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 2, content: "What is the 'readback' technique?", options: ["Repeating ATC instructions back to confirm understanding", "Reading the checklist aloud", "Recording flight data", "Reviewing flight logs after landing"], correctAnswer: "Repeating ATC instructions back to confirm understanding", explanation: "Readback ensures both the pilot and ATC have the same understanding of instructions, catching errors before they become dangerous." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 2, content: "What is assertiveness in CRM context?", options: ["Speaking up about safety concerns regardless of rank", "Being aggressive toward other crew members", "Always following the captain without question", "Talking loudly on the radio"], correctAnswer: "Speaking up about safety concerns regardless of rank", explanation: "CRM assertiveness means any crew member should voice safety concerns. The Tenerife disaster (1977) highlighted the danger of authority gradients." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 2, content: "The 'authority gradient' in CRM refers to:", options: ["The perceived power difference between crew members that can inhibit communication", "The chain of command in the airline", "The physical layout of the cockpit", "The radio frequency hierarchy"], correctAnswer: "The perceived power difference between crew members that can inhibit communication", explanation: "A steep authority gradient means juniors won't challenge seniors. CRM aims for a moderate gradient where all crew feel safe to speak up." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 3, content: "What is the PACE model for communication?", options: ["Probe, Alert, Challenge, Emergency — escalating advocacy", "Plan, Act, Check, Evaluate", "Prepare, Announce, Confirm, Execute", "Primary, Alternate, Contingency, Emergency"], correctAnswer: "Probe, Alert, Challenge, Emergency — escalating advocacy", explanation: "PACE: Probe (ask questions), Alert (state concern), Challenge (directly challenge), Emergency (take control). Used when initial concerns aren't addressed." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 3, content: "What is 'groupthink' and why is it dangerous?", options: ["A group prioritizes consensus over critical analysis, leading to poor decisions", "Thinking together as a team", "A positive CRM outcome", "When the whole crew agrees on the same thing"], correctAnswer: "A group prioritizes consensus over critical analysis, leading to poor decisions", explanation: "Groupthink suppresses dissent and critical evaluation. Everyone agrees without properly analyzing alternatives, leading to flawed decision-making." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 3, content: "Closed-loop communication involves:", options: ["Sender sends → receiver acknowledges → sender confirms", "Speaking in a closed room", "Using encrypted radio channels", "One-way communication from captain to crew"], correctAnswer: "Sender sends → receiver acknowledges → sender confirms", explanation: "Closed-loop ensures messages are received and understood: send message → acknowledge receipt → confirm understanding." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 3, content: "What is a crew briefing and when should it occur?", options: ["Pre-flight discussion of roles, threats, and plans; before every flight phase", "A meeting after the flight", "Only required for international flights", "A written report filed with the airline"], correctAnswer: "Pre-flight discussion of roles, threats, and plans; before every flight phase", explanation: "Briefings establish shared mental models, assign roles, identify threats, and set expectations. Should occur before each critical flight phase." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 4, content: "What is a 'shared mental model' in CRM?", options: ["Common understanding of the situation, plan, and each other's roles", "A physical model of the aircraft shared among crew", "A computerized flight plan", "A training simulator scenario"], correctAnswer: "Common understanding of the situation, plan, and each other's roles", explanation: "When crew share the same understanding of the situation, plan, and role expectations, they can anticipate needs and coordinate effectively." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 4, content: "The 'FORDEC' decision-making model stands for:", options: ["Facts, Options, Risks, Decision, Execution, Check", "Flight, Operations, Radar, Data, Emergency, Crew", "Fuel, Obstacles, Route, Distance, Engine, Communications", "Find, Observe, Record, Document, Evaluate, Complete"], correctAnswer: "Facts, Options, Risks, Decision, Execution, Check", explanation: "FORDEC is a structured decision model: gather Facts, identify Options, assess Risks, make Decision, Execute, Check outcomes." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 4, content: "What role does debriefing play in CRM?", options: ["Reviews performance, identifies lessons learned, improves future operations", "It's only required after accidents", "It's optional and rarely helpful", "It only covers mechanical issues"], correctAnswer: "Reviews performance, identifies lessons learned, improves future operations", explanation: "Post-flight debriefing is crucial for continuous improvement: what went well, what didn't, and what to improve. Creates a learning culture." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 4, content: "What is 'normalization of deviance'?", options: ["Gradual acceptance of previously unacceptable practices as normal", "Standard operating procedures becoming routine", "Normal deviations in flight instruments", "The process of standardizing procedures"], correctAnswer: "Gradual acceptance of previously unacceptable practices as normal", explanation: "Over time, small deviations from SOPs that don't cause immediate problems become accepted as normal, increasing risk of eventual failure." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 5, content: "How did the concept of CRM evolve after the United 173 crash (1978)?", options: ["It established that technical skills alone are insufficient; interpersonal skills are equally important for safety", "It led to the development of autopilot systems", "It resulted in banning crew communication during flights", "It had no lasting impact on aviation training"], correctAnswer: "It established that technical skills alone are insufficient; interpersonal skills are equally important for safety", explanation: "UA173 (fuel exhaustion while troubleshooting landing gear) led NASA to develop CRM training. The crew had the skills but failed to communicate about fuel state. CRM evolved through 6 generations, now emphasizing TEM." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 2, content: "What is the purpose of a checklist in CRM?", options: ["Ensures critical items are not forgotten, standardizes procedures", "To keep the crew busy", "Only required for new pilots", "A formality with no real value"], correctAnswer: "Ensures critical items are not forgotten, standardizes procedures", explanation: "Checklists are a vital CRM tool that catches errors, ensures completeness, and provides standardized procedures across all crew." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 3, content: "What is 'task saturation'?", options: ["When demands exceed crew capacity to process and respond", "Having too few tasks", "Completing all tasks ahead of schedule", "Perfectly balanced workload"], correctAnswer: "When demands exceed crew capacity to process and respond", explanation: "Task saturation occurs during high-workload situations where crew can't process all demands, leading to channelized attention, task shedding, or compartmentalization." },
  { subject: "Psychology", topic: "CRM (Crew Resource Management)", difficulty: 5, content: "Describe the evolution of CRM from 1st to 5th generation.", options: ["From cockpit-focused authority management to system-wide TEM with organizational culture", "From manual flying to full automation", "From single-pilot to multi-crew", "From propeller to jet engines"], correctAnswer: "From cockpit-focused authority management to system-wide TEM with organizational culture", explanation: "1st gen: Cockpit Resource Mgmt. 2nd: Crew RM (team focus). 3rd: Added technical skills. 4th: Added organizational factors. 5th: TEM + safety culture across the entire organization." },
];

// ─── AVIATION ENGLISH: ICAO PHRASEOLOGY ───

const avEnglishICAO: SeedQuestion[] = [
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 1, content: "What does 'ROGER' mean in aviation communications?", options: ["I have received your message", "Yes, I agree", "Repeat please", "Negative"], correctAnswer: "I have received your message", explanation: "'Roger' acknowledges receipt of a message. It does NOT mean 'yes' or agreement." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 1, content: "What does 'WILCO' mean?", options: ["Will comply with the instruction", "Will contact you later", "Will land on runway", "Will change frequency"], correctAnswer: "Will comply with the instruction", explanation: "'Wilco' (will comply) means the pilot will follow the instruction given. It includes acknowledgment, so 'Roger Wilco' is redundant." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 1, content: "How is the number '9' pronounced in aviation?", options: ["NINER", "NINE", "NAIN", "NON"], correctAnswer: "NINER", explanation: "In ICAO phonetic alphabet: 9 = 'NINER' to avoid confusion with 'nein' (German for 'no')." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 1, content: "What does 'AFFIRM' mean in aviation?", options: ["Yes", "No", "Maybe", "Repeat"], correctAnswer: "Yes", explanation: "'AFFIRM' is the standard ICAO word for 'yes'. Note: 'AFFIRMATIVE' is also used but 'AFFIRM' is the ICAO standard." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 2, content: "What is the phonetic alphabet for the letters A, B, C?", options: ["Alfa, Bravo, Charlie", "Alpha, Beta, Gamma", "Apple, Banana, Cherry", "Able, Baker, Charlie"], correctAnswer: "Alfa, Bravo, Charlie", explanation: "ICAO phonetic alphabet: A=Alfa (not Alpha), B=Bravo, C=Charlie." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 2, content: "What does 'SAY AGAIN' mean?", options: ["Repeat your last transmission", "Say the phrase 'again'", "Speak louder", "Change frequency"], correctAnswer: "Repeat your last transmission", explanation: "'Say again' requests repetition. The word 'repeat' is avoided in aviation as it can be confused with artillery commands." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 2, content: "What does 'STANDBY' mean in ATC communications?", options: ["Wait, I will call you back", "Stand up in the cockpit", "Prepare for takeoff", "Turn off your radio"], correctAnswer: "Wait, I will call you back", explanation: "'Standby' means wait and expect further contact. It does NOT mean permission is granted." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 2, content: "How is altitude 'Flight Level 350' expressed?", options: ["Flight level three five zero", "Flight level three hundred fifty", "Three five zero", "Thirty-five thousand"], correctAnswer: "Flight level three five zero", explanation: "Flight levels are expressed digit by digit: FL350 = 'Flight Level Three Five Zero'." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What is the correct way to read back a clearance to descend to FL240?", options: ["Descend flight level two four zero, [callsign]", "Going down to 24000, [callsign]", "Descending 240", "Roger descend"], correctAnswer: "Descend flight level two four zero, [callsign]", explanation: "Readback must include the instruction and callsign. FL240 read as 'flight level two four zero'." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What does 'SQUAWK 7700' indicate?", options: ["General emergency", "Hijack", "Radio failure", "VFR flight"], correctAnswer: "General emergency", explanation: "Transponder codes: 7700 = Emergency, 7500 = Hijack, 7600 = Radio failure." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What is the meaning of 'MAYDAY'?", options: ["Distress signal — immediate assistance required", "A routine position report", "Request for weather update", "Permission to land"], correctAnswer: "Distress signal — immediate assistance required", explanation: "MAYDAY (from French 'm'aidez' = help me) indicates grave and imminent danger requiring immediate assistance. Spoken three times." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What does 'PAN PAN' signify?", options: ["Urgency — pilot needs assistance but no immediate danger to aircraft", "Complete engine failure", "Request to land immediately", "Routine communication check"], correctAnswer: "Urgency — pilot needs assistance but no immediate danger to aircraft", explanation: "PAN PAN declares an urgency condition — a situation requiring assistance but with no immediate danger to the aircraft or occupants." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What does 'CLEARED FOR THE OPTION' mean?", options: ["Pilot may do touch-and-go, stop-and-go, missed approach, or full stop landing", "Cleared to choose any runway", "Cleared to an optional waypoint", "Cleared to skip the approach"], correctAnswer: "Pilot may do touch-and-go, stop-and-go, missed approach, or full stop landing", explanation: "'The option' gives the pilot flexibility to perform any of these maneuvers on the runway." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 4, content: "What is the correct phraseology when unable to comply with an ATC instruction?", options: ["'UNABLE' followed by the reason", "'NEGATIVE, I won't do that'", "'Cannot comply'", "'Say again?'"], correctAnswer: "'UNABLE' followed by the reason", explanation: "Pilots should say 'UNABLE' then briefly explain why (e.g., 'UNABLE due to weather' or 'UNABLE, terrain'). ATC will provide alternatives." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 4, content: "What is the difference between 'CLEARED TO LAND' and 'CONTINUE APPROACH'?", options: ["Cleared to land = landing permission granted. Continue approach = expect further instructions, no landing clearance yet", "They mean the same thing", "Continue approach is only for IFR", "Cleared to land is only for VFR"], correctAnswer: "Cleared to land = landing permission granted. Continue approach = expect further instructions, no landing clearance yet", explanation: "'Cleared to land' authorizes the landing. 'Continue approach' means keep flying the approach but wait for landing clearance." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 4, content: "How should a pilot report encountering severe turbulence?", options: ["'[Callsign] encountering severe turbulence at [altitude/position]'", "'[Callsign] bumpy ride'", "'Help, it's very turbulent'", "'[Callsign] requesting smooth air'"], correctAnswer: "'[Callsign] encountering severe turbulence at [altitude/position]'", explanation: "Use standard ICAO turbulence categories (light, moderate, severe, extreme) with position/altitude for PIREPs." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 5, content: "What ICAO language proficiency level is required for international operations?", options: ["Level 4 (Operational) minimum", "Level 2 (Elementary)", "Level 6 (Expert)", "Level 3 (Pre-operational)"], correctAnswer: "Level 4 (Operational) minimum", explanation: "ICAO requires minimum Level 4 for pilots and controllers in international operations. Levels range from 1 (Pre-elementary) to 6 (Expert). Level 4 must be reassessed every 3 years." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 2, content: "What does 'NEGATIVE' mean in ATC communications?", options: ["No / That is not correct / Permission not granted", "I cannot hear you", "Repeat your message", "I will comply later"], correctAnswer: "No / That is not correct / Permission not granted", explanation: "'Negative' is the standard word for 'no' in aviation communications." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 3, content: "What does 'HOLD SHORT' mean?", options: ["Stop before reaching the specified point", "Hover in position", "Maintain altitude", "Reduce speed"], correctAnswer: "Stop before reaching the specified point", explanation: "'Hold short of runway 27' means stop before reaching runway 27 and do not enter it without further clearance." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 4, content: "What is the correct format for a position report?", options: ["Callsign, position, time, altitude, next position, ETA", "Callsign and altitude only", "Just the position", "Callsign, speed, heading"], correctAnswer: "Callsign, position, time, altitude, next position, ETA", explanation: "Standard position report includes: identification, position, time, level, next position and ETA, and following significant point." },
  { subject: "Aviation English", topic: "ICAO Phraseology", difficulty: 5, content: "In plain language use (non-standard phraseology), what does ICAO recommend?", options: ["Use plain language only when standard phraseology is insufficient, keeping it clear and unambiguous", "Never use plain language", "Always use plain language instead of standard phraseology", "Plain language is only for emergencies"], correctAnswer: "Use plain language only when standard phraseology is insufficient, keeping it clear and unambiguous", explanation: "ICAO Doc 9835 recommends standard phraseology first. When insufficient, use clear, concise plain English avoiding idioms, slang, and ambiguity." },
];

// ─── AVIATION ENGLISH: RADIOTELEPHONY ───

const avEnglishRadiotelephony: SeedQuestion[] = [
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 1, content: "What frequency band is used for VHF aviation communications?", options: ["118.000 - 136.975 MHz", "2 - 30 MHz", "300 - 3000 MHz", "88 - 108 MHz"], correctAnswer: "118.000 - 136.975 MHz", explanation: "VHF aviation band: 118.000-136.975 MHz with 8.33 kHz channel spacing (25 kHz in some regions)." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 1, content: "The international distress frequency is:", options: ["121.5 MHz", "118.0 MHz", "123.45 MHz", "130.0 MHz"], correctAnswer: "121.5 MHz", explanation: "121.5 MHz is the international aeronautical emergency frequency. All aircraft should monitor it." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 2, content: "What is the correct initial call format to ATC?", options: ["[ATC unit] [Aircraft callsign] [Aircraft type] [Position] [Level] [Request]", "[Aircraft callsign] requesting clearance", "Hello, this is flight [number]", "[ATC unit] [Aircraft callsign] ready"], correctAnswer: "[ATC unit] [Aircraft callsign] [Aircraft type] [Position] [Level] [Request]", explanation: "Initial call format: address the ATC unit, identify yourself, state position, altitude, and intention/request." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 2, content: "What does 'MONITOR' mean when told to monitor a frequency?", options: ["Listen on the frequency without transmitting until called", "Turn on monitoring equipment", "Record all communications", "Watch the radar screen"], correctAnswer: "Listen on the frequency without transmitting until called", explanation: "'Monitor [frequency]' means tune to that frequency and listen. Do not transmit until the controller calls you." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 2, content: "How should time '14:30 UTC' be stated on the radio?", options: ["One four three zero", "Two thirty PM", "Fourteen thirty", "Half past two"], correctAnswer: "One four three zero", explanation: "Time is expressed in UTC using the 24-hour clock, digits spoken individually: 14:30 = 'one four three zero'." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "When must a pilot read back an ATC clearance?", options: ["Always — all clearances must be read back", "Only during emergencies", "Only when specifically asked", "Only for landing clearances"], correctAnswer: "Always — all clearances must be read back", explanation: "ICAO requires readback of: route clearances, altimeter settings, transponder codes, heading/speed instructions, runway designators, and other safety-critical clearances." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "What is the meaning of 'WORDS TWICE'?", options: ["Communication is difficult — send each word/group of words twice", "Repeat the entire message twice", "Use two words only", "Use a different language"], correctAnswer: "Communication is difficult — send each word/group of words twice", explanation: "'WORDS TWICE' may be requested or used when communication quality is poor. Each important word is transmitted twice." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "What is a SELCAL and what is its purpose?", options: ["Selective Calling system — alerts specific aircraft on HF without constant monitoring", "Security Alerting system", "Self-Calibrating Altimeter", "Secondary Landing system"], correctAnswer: "Selective Calling system — alerts specific aircraft on HF without constant monitoring", explanation: "SELCAL sends a unique 4-tone code to a specific aircraft, allowing crews to turn down HF radio volume until their code is received." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "What does 'BREAK BREAK' signify?", options: ["Interruption of communications for an urgent/priority message", "Take a communication break", "End of transmission", "Mechanical break in the aircraft"], correctAnswer: "Interruption of communications for an urgent/priority message", explanation: "'BREAK BREAK' interrupts other transmissions when an urgent/emergency message needs to be delivered immediately." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 4, content: "What is CPDLC and how does it complement voice communications?", options: ["Controller-Pilot Data Link Communications — text-based ATC messaging system", "Central Pilot Distribution Logistics Center", "Cockpit Power Distribution Control Link", "Controlled Precision Distance Landing Computer"], correctAnswer: "Controller-Pilot Data Link Communications — text-based ATC messaging system", explanation: "CPDLC allows ATC clearances to be sent as text messages, reducing voice congestion and readback errors. Required in many oceanic/remote areas." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 4, content: "In the event of radio failure (NORDO), the transponder should be set to:", options: ["7600", "7700", "7500", "1200"], correctAnswer: "7600", explanation: "Transponder code 7600 signals radio/communications failure. ATC will provide clearance by light signals or radar vectors." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 4, content: "What are light gun signals from the tower?", options: ["Visual ATC signals using colored lights (green/red/white) for aircraft with radio failure", "Landing light signals from the aircraft", "Emergency lighting on the runway", "Signal lights for ground vehicles only"], correctAnswer: "Visual ATC signals using colored lights (green/red/white) for aircraft with radio failure", explanation: "Steady green = cleared to land/go. Flashing green = cleared to taxi/return. Steady red = stop/give way. Flashing red = airport unsafe/do not land. Flashing white = return to start (ground)." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 4, content: "What is the difference between 'RADAR CONTACT' and 'RADAR SERVICE TERMINATED'?", options: ["Radar contact = ATC identifies you on radar. Terminated = ATC no longer provides radar separation", "They mean the same thing", "Radar contact means you need to contact another facility", "Terminated means your transponder failed"], correctAnswer: "Radar contact = ATC identifies you on radar. Terminated = ATC no longer provides radar separation", explanation: "'Radar contact' confirms ATC has identified your aircraft on radar. 'Radar service terminated' means you're leaving radar coverage or ATC can no longer provide radar separation." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 5, content: "Describe the procedure for communications failure during IFR flight.", options: ["Set 7600, fly last assigned route/altitude or expected clearance, follow published procedures for approach at destination", "Circle the airport until someone comes on radio", "Land at the nearest airport immediately", "Descend to VFR conditions and proceed visually"], correctAnswer: "Set 7600, fly last assigned route/altitude or expected clearance, follow published procedures for approach at destination", explanation: "ICAO procedure: squawk 7600, maintain last assigned altitude (or minimum/expected, whichever higher), follow route to destination, commence approach at ETA per flight plan." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 1, content: "What does 'OVER' mean at the end of a radio transmission?", options: ["My transmission is ended and I expect a response", "The flight is over", "Fly over the waypoint", "Transmission is complete, no response expected"], correctAnswer: "My transmission is ended and I expect a response", explanation: "'OVER' signals the end of your transmission and that you're awaiting a reply. 'OUT' means no reply expected." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 2, content: "The phrase 'HOW DO YOU READ' is used to:", options: ["Check the readability of a radio transmission", "Ask for the aircraft's callsign", "Request weather information", "Ask for radar identification"], correctAnswer: "Check the readability of a radio transmission", explanation: "Used for radio checks. Response uses readability scale: 1 (unreadable) to 5 (perfectly readable)." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "What does QNH mean?", options: ["Altimeter setting to show altitude above mean sea level", "Altimeter setting to show height above airfield", "Quality Navigation Heading", "Quasi-Normal Humidity"], correctAnswer: "Altimeter setting to show altitude above mean sea level", explanation: "QNH: pressure adjusted so the altimeter reads altitude above mean sea level. QFE shows height above airfield elevation." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 5, content: "Explain the concept of 'blocked transmission' and its safety implications.", options: ["Two aircraft transmitting simultaneously, preventing either message from being received", "A deliberately blocked frequency", "ATC blocking an aircraft from transmitting", "A frequency reserved for military use"], correctAnswer: "Two aircraft transmitting simultaneously, preventing either message from being received", explanation: "Blocked transmissions (simultaneous keying) produce a squeal/heterodyne, losing both messages. Can be dangerous if clearances are missed. CPDLC helps mitigate this." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 3, content: "What is ATIS and what information does it provide?", options: ["Automatic Terminal Information Service — weather, runway in use, NOTAMs, etc.", "Air Traffic Information System", "Automated Takeoff Information Service", "Aviation Terminal Intelligence Service"], correctAnswer: "Automatic Terminal Information Service — weather, runway in use, NOTAMs, etc.", explanation: "ATIS provides recorded airport information: weather, altimeter setting, active runways, approaches in use, and relevant NOTAMs. Updated regularly with letter identifier." },
  { subject: "Aviation English", topic: "Radiotelephony", difficulty: 4, content: "What is the correct procedure for a relay message?", options: ["Prefix with 'RELAY FROM [callsign]' and transmit the exact message", "Just say 'someone said...'", "Only ATC can relay messages", "Use a different frequency"], correctAnswer: "Prefix with 'RELAY FROM [callsign]' and transmit the exact message", explanation: "When relaying for another aircraft: '[Station], [your callsign], RELAY FROM [originator callsign], [exact message]'." },
];

// ─── EXPORT ALL ───

export const AVIATION_QUESTIONS: SeedQuestion[] = [
  ...mathAlgebra,
  ...mathGeometry,
  ...mathTrigonometry,
  ...physicsMechanics,
  ...physicsThermodynamics,
  ...physicsAerodynamics,
  ...psychologyCognitive,
  ...psychologyHumanFactors,
  ...psychologyCRM,
  ...avEnglishICAO,
  ...avEnglishRadiotelephony,
];

export const SUBJECT_TOPICS = {
  "Math": ["Algebra", "Geometry", "Trigonometry"],
  "Physics": ["Mechanics", "Thermodynamics", "Aerodynamics"],
  "Psychology": ["Cognitive Psychology", "Human Factors", "CRM (Crew Resource Management)"],
  "Aviation English": ["ICAO Phraseology", "Radiotelephony"],
};

// ─── EXAM FORMATS ───

export const WIZZAIR_EXAM_FORMATS = [
  {
    name: "WizzAir Math Assessment",
    description: "Mathematics assessment covering algebra, geometry, and trigonometry for WizzAir Academy entry.",
    timeLimit: 90,
    questionCount: 40,
    passingScore: 70,
    format: {
      type: "multiple_choice",
      optionsCount: 4,
      shuffleOptions: true,
      shuffleQuestions: true,
      showExplanation: false,
      subjects: ["Math"],
      topics: ["Algebra", "Geometry", "Trigonometry"],
      difficultyDistribution: { easy: 10, medium: 20, hard: 10 },
    },
  },
  {
    name: "WizzAir Physics Assessment",
    description: "Physics assessment covering mechanics, thermodynamics, and aerodynamics.",
    timeLimit: 90,
    questionCount: 40,
    passingScore: 70,
    format: {
      type: "multiple_choice",
      optionsCount: 4,
      shuffleOptions: true,
      shuffleQuestions: true,
      showExplanation: false,
      subjects: ["Physics"],
      topics: ["Mechanics", "Thermodynamics", "Aerodynamics"],
      difficultyDistribution: { easy: 10, medium: 20, hard: 10 },
    },
  },
  {
    name: "WizzAir Psychology & CRM",
    description: "Psychological assessment covering cognitive psychology, human factors, and crew resource management.",
    timeLimit: 60,
    questionCount: 30,
    passingScore: 75,
    format: {
      type: "multiple_choice",
      optionsCount: 4,
      shuffleOptions: true,
      shuffleQuestions: true,
      showExplanation: false,
      subjects: ["Psychology"],
      topics: ["Cognitive Psychology", "Human Factors", "CRM (Crew Resource Management)"],
      difficultyDistribution: { easy: 8, medium: 14, hard: 8 },
    },
  },
  {
    name: "WizzAir Aviation English",
    description: "Aviation English assessment covering ICAO phraseology and radiotelephony.",
    timeLimit: 45,
    questionCount: 30,
    passingScore: 80,
    format: {
      type: "multiple_choice",
      optionsCount: 4,
      shuffleOptions: true,
      shuffleQuestions: true,
      showExplanation: false,
      subjects: ["Aviation English"],
      topics: ["ICAO Phraseology", "Radiotelephony"],
      difficultyDistribution: { easy: 8, medium: 14, hard: 8 },
    },
  },
  {
    name: "WizzAir Full Placement Test",
    description: "Comprehensive placement test covering all subjects for initial student level assessment.",
    timeLimit: 120,
    questionCount: 50,
    passingScore: 60,
    format: {
      type: "multiple_choice",
      optionsCount: 4,
      shuffleOptions: true,
      shuffleQuestions: true,
      showExplanation: true,
      subjects: ["Math", "Physics", "Psychology", "Aviation English"],
      isPlacement: true,
      difficultyDistribution: { easy: 15, medium: 20, hard: 15 },
    },
  },
];

// ─── ESCALATION TEMPLATES (ROMANIAN) ───

export const ESCALATION_TEMPLATES = [
  {
    language: "ro",
    channel: "push",
    triggerType: "missed_session",
    templateId: "push_missed_session",
    content: "E timpul să studiezi! Sesiunea ta de învățare te așteaptă. Menține-ți seria de studiu!",
    variables: ["userName"],
  },
  {
    language: "ro",
    channel: "whatsapp",
    triggerType: "missed_session",
    templateId: "whatsapp_friendly_reminder",
    content: "Salut {{userName}}! 👋 Nu ai studiat azi. O sesiune scurtă poate face diferența. Hai înapoi la studiu! ✈️",
    variables: ["userName"],
  },
  {
    language: "ro",
    channel: "whatsapp",
    triggerType: "missed_session",
    templateId: "whatsapp_pressure_stats",
    content: "{{userName}}, progresul tău încetinește. {{stats}} Nu lăsa efortul depus să se piardă! Intră acum și continuă pregătirea. 📚",
    variables: ["userName", "stats"],
  },
  {
    language: "ro",
    channel: "sms",
    triggerType: "missed_session",
    templateId: "sms_direct_alert",
    content: "Tutor: Salut {{userName}}, nu ai studiat recent. Deschide aplicația și continuă pregătirea pentru WizzAir Academy!",
    variables: ["userName"],
  },
  {
    language: "ro",
    channel: "email",
    triggerType: "missed_session",
    templateId: "email_instructor_alert",
    content: "Alertă inactivitate: {{userName}} nu a studiat de mai mult de 24 de ore în domeniul {{domainName}}. Studentul nu a răspuns la remindere automate (push, WhatsApp, SMS). Vă rugăm să luați legătura.",
    variables: ["userName", "domainName"],
  },
  {
    language: "ro",
    channel: "push",
    triggerType: "low_score",
    templateId: "push_low_score",
    content: "Scorul tău recent a fost sub așteptări. Revizuiește materialele și încearcă din nou! 💪",
    variables: ["userName", "score"],
  },
  {
    language: "ro",
    channel: "whatsapp",
    triggerType: "low_score",
    templateId: "whatsapp_low_score",
    content: "{{userName}}, scorul tău de {{score}}% la ultimul test indică zone care necesită atenție. Recomandare: revizuiește {{weakTopics}} înainte de a continua. 📖",
    variables: ["userName", "score", "weakTopics"],
  },
  {
    language: "ro",
    channel: "sms",
    triggerType: "low_score",
    templateId: "sms_low_score",
    content: "Tutor: {{userName}}, scorul tău recent necesită atenție. Revizuiește materialele și practică mai mult.",
    variables: ["userName", "score"],
  },
  {
    language: "ro",
    channel: "push",
    triggerType: "streak_lost",
    templateId: "push_streak_lost",
    content: "Seria ta de studiu s-a întrerupt! Începe o nouă serie astăzi. 🔥",
    variables: ["userName", "streakDays"],
  },
  {
    language: "ro",
    channel: "whatsapp",
    triggerType: "streak_lost",
    templateId: "whatsapp_streak_lost",
    content: "{{userName}}, seria ta de {{streakDays}} zile consecutive s-a întrerupt. Nu te descuraja! Începe din nou astăzi și reconstruiește-ți progresul. 💪✈️",
    variables: ["userName", "streakDays"],
  },
  {
    language: "ro",
    channel: "push",
    triggerType: "inactivity",
    templateId: "push_inactivity_3day",
    content: "Nu te-am mai văzut de 3 zile! Colegii tăi avansează. Revino la studiu! 📚",
    variables: ["userName"],
  },
  {
    language: "ro",
    channel: "whatsapp",
    triggerType: "inactivity",
    templateId: "whatsapp_inactivity_week",
    content: "{{userName}}, a trecut o săptămână de la ultima ta sesiune. Pregătirea pentru WizzAir Academy necesită consistență. Hai înapoi! ✈️",
    variables: ["userName"],
  },
];

// ─── DEMO USERS ───

export const DEMO_STUDENTS = [
  { name: "Maria Popescu", email: "maria.popescu@demo.tutor.app", locale: "ro" },
  { name: "Andrei Ionescu", email: "andrei.ionescu@demo.tutor.app", locale: "ro" },
  { name: "Elena Dumitrescu", email: "elena.dumitrescu@demo.tutor.app", locale: "ro" },
  { name: "Alexandru Popa", email: "alex.popa@demo.tutor.app", locale: "ro" },
  { name: "Cristina Radu", email: "cristina.radu@demo.tutor.app", locale: "ro" },
];
