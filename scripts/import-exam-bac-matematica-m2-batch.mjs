#!/usr/bin/env node
/**
 * import-exam-bac-matematica-m1-batch.mjs — BAC Matematică M2 (Științele naturii) → SIMULĂRI (full papers, batch)
 *
 * Clone of import-exam-bac-matematica-m1-batch.mjs (M1) but with a PAPERS[] array so the
 * remaining Faza-B simulări (13 lucrări: 2022/2023/2024 model+simulare+var-XX, minus
 * 2024 model already shipped by the -model script) accumulate here, one entry each.
 *
 * Per paper: Subiectul I (6 × 5p, SHORT + finalAnswer + rubric) + Subiectul al II-lea
 * (2 × 15p, OPEN, rubric a/b/c) + Subiectul al III-lea (2 × 15p, OPEN, rubric a/b/c) = 90p
 * (+10 oficiu = 100). examType="BAC", subjectKey="matematica_m1", grade 12, timeLimit 180.
 * Content + rubrics transcribed VERBATIM from the official CNPEE subject + barem (rendered
 * PDF, not the garbled fitz dump). Math notation = plain Unicode inline (UI has no KaTeX).
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed. Idempotent per (examType,year,subjectKey,variant).
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const PAPERS = [
  {
    source: "BAC 2022 Model — Matematică M_st-nat (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m2", subjectName: "Matematică M2 (Științele naturii)",
    grade: 12, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Logaritmi",
        content: "Arătați că numărul N=log₂24−log₂12+3 este pătratul unui număr natural.",
        finalAnswer: "N=4=2²",
        rubric: [{ label: "barem", points: 5, answer: "N=log₂(24/12)+3=log₂2+3=1+3=4=2², deci N este pătratul numărului natural 2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−1. Determinați numărul real a pentru care punctul A(a,a²) aparține graficului funcției f.",
        finalAnswer: "a=1",
        rubric: [{ label: "barem", points: 5, answer: "A(a,a²)∈grafic ⟺ a²=2a−1 ⟺ a²−2a+1=0 ⟺ (a−1)²=0, deci a=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații cu radicali",
        content: "Rezolvați în mulțimea numerelor reale ecuația √(x²−2x−2)=x−2.",
        finalAnswer: "x=3",
        rubric: [{ label: "barem", points: 5, answer: "Condiție x≥2. Ridicând la pătrat: x²−2x−2=x²−4x+4 ⟺ 2x=6, deci x=3 (verifică x≥2)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea A={1!,2!,3!,…,10!}, acesta să fie divizibil cu 9.",
        finalAnswer: "1/2",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea A are 10 elemente. Numerele divizibile cu 9 sunt 6!,7!,8!,9!,10! (deoarece 6!=720=9·80), deci 5 cazuri favorabile. p=5/10=1/2." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori",
        content: "Se consideră triunghiul ABC și punctul D mijlocul segmentului BC. Arătați că, pentru orice puncte E și F astfel încât AE⃗=FD⃗, are loc relația 2(EB⃗+FC⃗)=AB⃗+AC⃗.",
        finalAnswer: "2(EB⃗+FC⃗)=AB⃗+AC⃗",
        rubric: [{ label: "barem", points: 5, answer: "EB⃗+FC⃗=EA⃗+AB⃗+FD⃗+DC⃗; cum AE⃗=FD⃗ avem EA⃗+FD⃗=0⃗, deci EB⃗+FC⃗=AB⃗+DC⃗. Atunci 2(EB⃗+FC⃗)=2AB⃗+2DC⃗=AB⃗+(AB⃗+BC⃗)=AB⃗+AC⃗ (D mijlocul lui BC: 2DC⃗=BC⃗)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie",
        content: "Arătați că (sin x+cos x)²−(sin x−cos x)²=2cos(π/2−2x), pentru orice număr real x.",
        finalAnswer: "2sin2x",
        rubric: [{ label: "barem", points: 5, answer: "(sin x+cos x)²−(sin x−cos x)²=4sin x·cos x=2sin2x=2cos(π/2−2x), pentru orice x∈ℝ." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Inversa",
        content: "Se consideră matricea A(x)=(x² 1 / x−1 1), unde x este număr real.\na) Arătați că det(A(−1))=3.\nb) Demonstrați că matricea A(x) este inversabilă, pentru orice număr real x.\nc) Determinați matricea X∈M₂(ℝ) pentru care A(1)·X·A(1)=A(2).",
        rubric: [
          { label: "a)", points: 5, answer: "A(−1)=(1 1 / −2 1), deci det(A(−1))=1·1−1·(−2)=3." },
          { label: "b)", points: 5, answer: "det(A(x))=x²·1−1·(x−1)=x²−x+1. Cum Δ=1−4=−3<0, det(A(x))>0≠0 pentru orice x∈ℝ, deci A(x) este inversabilă." },
          { label: "c)", points: 5, answer: "A(1)=(1 1 / 0 1), (A(1))⁻¹=(1 −1 / 0 1), A(2)=(4 1 / 1 1). X=(A(1))⁻¹·A(2)·(A(1))⁻¹=(3 −3 / 1 0)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru. Simetric",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție asociativă și cu element neutru x∘y=xy−√2(x+y−1)+2.\na) Arătați că √2∘0=√2.\nb) Determinați numerele reale x pentru care (x−√2)∘(x+√2)=x.\nc) Determinați numerele raționale al căror simetric în raport cu legea de compoziție „∘” este număr rațional.",
        rubric: [
          { label: "a)", points: 5, answer: "√2∘0=√2·0−√2(√2+0−1)+2=−2+√2+2=√2." },
          { label: "b)", points: 5, answer: "(x−√2)∘(x+√2)=(x²−2)−√2(2x−1)+2=x²−2√2x+√2. Ecuația x²−2√2x+√2=x devine x²−(2√2+1)x+√2=0, cu Δ=9, deci x=√2−1 sau x=√2+2." },
          { label: "c)", points: 5, answer: "Cum x∘y−√2=(x−√2)(y−√2), elementul neutru este e=√2+1, iar simetricul a′ verifică (a−√2)(a′−√2)=1, deci a′=√2+1/(a−√2). Pentru a rațional, a′ este rațional ⟺ coeficientul lui √2 se anulează ⟺ a²−1=0, deci a∈{−1, 1} (simetricele lor sunt 1, respectiv −1)." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Tangentă. Bijectivitate",
        content: "Se consideră funcția f:(0,+∞)→(0,+∞), f(x)=x(1−(1/x)·ln(x²+1)).\na) Arătați că f′(x)=(x−1)²/(x²+1), x∈(0,+∞).\nb) Determinați numărul natural nenul n, știind că tangenta la graficul funcției f în punctul A(n,f(n)) este paralelă cu dreapta de ecuație y=(1/5)x+1.\nc) Demonstrați că funcția f este bijectivă.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)=x−ln(x²+1), deci f′(x)=1−2x/(x²+1)=(x²−2x+1)/(x²+1)=(x−1)²/(x²+1), x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "Tangenta este paralelă cu dreapta dată ⟺ f′(n)=1/5 ⟺ (n−1)²/(n²+1)=1/5 ⟺ 5(n−1)²=n²+1 ⟺ 2n²−5n+2=0, de unde n=2 (număr natural nenul)." },
          { label: "c)", points: 5, answer: "f′(x)=(x−1)²/(x²+1)≥0, cu f′(x)=0 doar pentru x=1, deci f este strict crescătoare pe (0,+∞), deci injectivă. f este continuă, lim_{x→0⁺}f(x)=0 și lim_{x→+∞}f(x)=+∞, deci f((0,+∞))=(0,+∞), adică f este surjectivă. Prin urmare f este bijectivă." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Primitive",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=1/x³−2ln x/x³ și funcția F:(0,+∞)→ℝ, F(x)=ln x/x², o primitivă a lui f.\na) Arătați că ∫₁ᵉ x²·(f(x)+2ln x/x³) dx = 1.\nb) Arătați că ∫₁^√5 x·f(x²+3) dx = −5ln2/128.\nc) Determinați numerele reale a pentru care ∫ₑ^(e²) x·F(x) dx = (a²−1)/2.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)+2ln x/x³=1/x³, deci x²·(f(x)+2ln x/x³)=1/x. ∫₁ᵉ (1/x) dx=ln x|₁ᵉ=1−0=1." },
          { label: "b)", points: 5, answer: "Cu substituția u=x²+3 (du=2x dx): ∫₁^√5 x·f(x²+3) dx=(1/2)∫₄⁸ f(u) du=(1/2)(F(8)−F(4))=(1/2)(ln8/64−ln4/16)=(1/2)(3ln2/64−8ln2/64)=−5ln2/128." },
          { label: "c)", points: 5, answer: "x·F(x)=ln x/x, deci ∫ₑ^(e²) (ln x/x) dx=((ln x)²/2)|ₑ^(e²)=(2²−1²)/2=3/2. Din 3/2=(a²−1)/2 obținem a²=4, deci a∈{−2, 2}." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Simulare — Matematică M_st-nat (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m2", subjectName: "Matematică M2 (Științele naturii)",
    grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Progresii geometrice",
        content: "Calculați termenul b₄ al progresiei geometrice (bₙ)ₙ≥₁, știind că b₁=√2 și b₂=4.",
        finalAnswer: "b₄=32",
        rubric: [{ label: "barem", points: 5, answer: "q=b₂/b₁=4/√2=2√2; b₄=b₁·q³=√2·(2√2)³=√2·16√2=32." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcția de gradul II. Tangentă",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=mx²−2x+1, unde m este număr real nenul. Determinați numărul real nenul m pentru care axa Ox este tangentă graficului funcției f.",
        finalAnswer: "m=1",
        rubric: [{ label: "barem", points: 5, answer: "Axa Ox tangentă ⟺ Δ=0 ⟺ 4−4m=0, deci m=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 3^(x+2)−3^x−6·3^(x−1)=6.",
        finalAnswer: "x=0",
        rubric: [{ label: "barem", points: 5, answer: "9·3^x−3^x−2·3^x=6 ⟺ 6·3^x=6 ⟺ 3^x=1, deci x=0." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Se consideră mulțimea A, a numerelor naturale de două cifre. Determinați probabilitatea ca, alegând un număr n din mulțimea A, numărul 2n−60 să aparțină mulțimii A.",
        finalAnswer: "1/2",
        rubric: [{ label: "barem", points: 5, answer: "A are 90 de elemente. 2n−60∈A ⟺ 35≤n≤79, deci 45 de cazuri favorabile. p=45/90=1/2." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică. Perpendicularitate",
        content: "În reperul cartezian xOy se consideră punctele A(−1,4), B(5,2) și C, mijlocul segmentului AB. Determinați ecuația dreptei d care trece prin punctul C și este perpendiculară pe dreapta AB.",
        finalAnswer: "y=3x−3",
        rubric: [{ label: "barem", points: 5, answer: "C(2,3); m_AB=−1/3, deci m_d=3. Ecuația: y−3=3(x−2), adică y=3x−3." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul isoscel ABC, cu măsura unghiului A egală cu 120° și AB=6. Arătați că aria triunghiului ABC este egală cu 9√3.",
        finalAnswer: "9√3",
        rubric: [{ label: "barem", points: 5, answer: "AB=AC=6, aria=(1/2)·AB·AC·sin120°=(1/2)·36·(√3/2)=9√3." }] },

      // ── SUBIECTUL al II-lea (30p) ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Numere complexe. Inversabilitate",
        content: "Se consideră matricele I₂=(1 0 / 0 1), A=(0 1 / −1 0) și B(x)=xI₂+iA, unde x este număr real și i²=−1.\na) Arătați că det A=1.\nb) Determinați numărul real x pentru care B(3)·B(5)=8B(x).\nc) Determinați perechile (m,n) de numere întregi pentru care matricea B(m)+iB(n) nu este inversabilă.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=|0 1; −1 0|=0·0−1·(−1)=1." },
          { label: "b)", points: 5, answer: "B(3)·B(5)=(3I₂+iA)(5I₂+iA)=15I₂+8iA+i²A². Cum A²=−I₂, obținem 15I₂+8iA+I₂=16I₂+8iA=8(2I₂+iA)=8B(2), deci x=2." },
          { label: "c)", points: 5, answer: "B(m)+iB(n)=((m+in) i−1 / 1−i m+in), deci det(B(m)+iB(n))=(m+in)²−2i=(m²−n²)+2(mn−1)i. Matricea nu este inversabilă ⟺ det=0 ⟺ m²−n²=0 și mn=1, de unde, cu m,n întregi, obținem perechile (1,1) și (−1,−1)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru. Inegalități",
        content: "Pe mulțimea M=[1,+∞) se definește legea de compoziție x∗y=xy−√((x−1)(y−1)).\na) Arătați că 2∗5=8.\nb) Arătați că e=1 este elementul neutru al legii de compoziție „∗”.\nc) Demonstrați că (nx)∗y≥x(n∗y), pentru orice x,y∈M și orice număr natural n, n≥2.",
        rubric: [
          { label: "a)", points: 5, answer: "2∗5=2·5−√((2−1)(5−1))=10−√4=8." },
          { label: "b)", points: 5, answer: "x∗1=x·1−√((x−1)(1−1))=x și 1∗x=x, pentru orice x∈M, deci e=1 este elementul neutru." },
          { label: "c)", points: 5, answer: "(nx)∗y−x(n∗y)=√(y−1)·(x√(n−1)−√(nx−1)). Cum x√(n−1)≥√(nx−1) ⟺ x²(n−1)≥nx−1 ⟺ (x−1)((n−1)x−1)≥0 (adevărat pentru x≥1 și n≥2), rezultă (nx)∗y≥x(n∗y)." },
        ] },

      // ── SUBIECTUL al III-lea (30p) ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie. Inegalități",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=4√x/(x²+3).\na) Arătați că f′(x)=6(1−x²)/(√x·(x²+3)²), x∈(0,+∞).\nb) Determinați a∈(0,+∞), știind că tangenta la graficul funcției f în punctul A(a,f(a)) este paralelă cu axa Ox.\nc) Demonstrați că √x/(x²+3) > √(x+1/x)/(x²+1/x²+5), pentru orice x∈(1,+∞).",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=(4·(1/(2√x))·(x²+3)−4√x·2x)/(x²+3)²=(2(x²+3)−8x²)/(√x(x²+3)²)=6(1−x²)/(√x·(x²+3)²), x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "Tangenta este paralelă cu Ox ⟺ f′(a)=0 ⟺ 1−a²=0, deci a=1 (a>0)." },
          { label: "c)", points: 5, answer: "Notând g(x)=√x/(x²+3)=f(x)/4, cum x²+1/x²+5=(x+1/x)²+3, inegalitatea revine la g(x)>g(x+1/x). Cum f′(x)<0 pe (1,+∞), g este strict descrescătoare, iar x+1/x>x>1, deci g(x)>g(x+1/x)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Primitive",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(eˣ+2x)/eˣ.\na) Arătați că ∫₀¹ eˣ·f(x) dx = e.\nb) Arătați că ∫₋₁⁰ f(x) dx = −1.\nc) Determinați numărul real a pentru care ∫₀¹ F(x)·f″(x) dx = a(e+1)/e², unde F:ℝ→ℝ este primitiva funcției f cu proprietatea F(0)=0.",
        rubric: [
          { label: "a)", points: 5, answer: "eˣ·f(x)=eˣ+2x, deci ∫₀¹(eˣ+2x)dx=(eˣ+x²)|₀¹=(e+1)−1=e." },
          { label: "b)", points: 5, answer: "f(x)=1+2x·e^(−x), deci ∫₋₁⁰(1+2xe^(−x))dx=1+2·(−(x+1)e^(−x))|₋₁⁰=1+2·(−1)=−1." },
          { label: "c)", points: 5, answer: "Prin integrare prin părți: ∫₀¹ F·f″ dx=(F·f′)|₀¹−∫₀¹ f·f′ dx=0−(f²/2)|₀¹=−(f(1)²−f(0)²)/2=−(((e+2)/e)²−1)/2=−2(e+1)/e². Din −2(e+1)/e²=a(e+1)/e² obținem a=−2." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 1 — Matematică M_st-nat (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m2", subjectName: "Matematică M2 (Științele naturii)",
    grade: 12, variant: "var-01", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Progresii aritmetice",
        content: "Determinați termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, știind că a₂=6 și a₃=12.",
        finalAnswer: "a₁=0",
        rubric: [{ label: "barem", points: 5, answer: "r=a₃−a₂=6, deci a₁=a₂−r=6−6=0." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−5. Determinați numărul real a pentru care f(a)+f(2a)=2.",
        finalAnswer: "a=4",
        rubric: [{ label: "barem", points: 5, answer: "(a−5)+(2a−5)=2 ⟺ 3a=12, deci a=4." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 5^x·(1/5)=25.",
        finalAnswer: "x=3",
        rubric: [{ label: "barem", points: 5, answer: "5^(x−1)=5², deci x−1=2, adică x=3." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să fie multiplu de 16.",
        finalAnswer: "1/15",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea are 90 de elemente; multiplii de 16 sunt 16, 32, 48, 64, 80, 96 — 6 cazuri favorabile. p=6/90=1/15." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică. Vectori",
        content: "În reperul cartezian xOy se consideră punctele A(3,2) și B(1,4). Determinați coordonatele punctului C, astfel încât punctul A este mijlocul segmentului BC.",
        finalAnswer: "C(5, 0)",
        rubric: [{ label: "barem", points: 5, answer: "A=(B+C)/2, deci C=2A−B=(6−1, 4−4)=(5,0)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie",
        content: "Se consideră expresia E(x)=sin x+sin(3x/2)−cos(x/2), unde x este număr real. Arătați că E(π/3)=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "E(π/3)=sin(π/3)+sin(π/2)−cos(π/6)=√3/2+1−√3/2=1." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Inversabilitate",
        content: "Se consideră matricele A=(1 −1 / −1 1), I₂=(1 0 / 0 1) și B(x)=(x 3−x / 2−x x), unde x este număr real.\na) Arătați că det A=0.\nb) Arătați că B(x)−B(0)=xA, pentru orice număr real x.\nc) Arătați că matricea C(a)=B(a)·B(1)−B(a+1) este inversabilă, pentru orice număr întreg a.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=1·1−(−1)·(−1)=1−1=0." },
          { label: "b)", points: 5, answer: "B(x)−B(0)=(x−0 (3−x)−3 / (2−x)−2 x−0)=(x −x / −x x)=x·(1 −1 / −1 1)=xA, pentru orice x∈ℝ." },
          { label: "c)", points: 5, answer: "C(a)=B(a)·B(1)−B(a+1)=(2−a 2a+1 / 1+a 3−2a), deci det(C(a))=(2−a)(3−2a)−(2a+1)(1+a)=5(1−2a). Pentru a întreg, 1−2a este impar, deci det(C(a))≠0, adică C(a) este inversabilă." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=(2x−1)(2y−1)+1.\na) Arătați că 1∗2=4.\nb) Determinați numerele reale x pentru care x∗x=2.\nc) Determinați numărul întreg nenul m pentru care m∗(1+1/m)=1.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗2=(2·1−1)(2·2−1)+1=1·3+1=4." },
          { label: "b)", points: 5, answer: "x∗x=(2x−1)²+1=2 ⟺ (2x−1)²=1 ⟺ 2x−1=±1, deci x=0 sau x=1." },
          { label: "c)", points: 5, answer: "m∗(1+1/m)=(2m−1)(2(1+1/m)−1)+1=(2m−1)(1+2/m)+1=(2m²+4m−2)/m. Din (2m²+4m−2)/m=1 obținem 2m²+3m−2=0, adică (2m−1)(m+2)=0; cu m întreg nenul, m=−2." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Limite. Bijectivitate",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=2x²+1+ln x.\na) Arătați că f′(x)=(4x²+1)/x, x∈(0,+∞).\nb) Arătați că lim_{x→+∞} (f(x)−ln x)/(x²+x+4)=2.\nc) Demonstrați că funcția f este bijectivă.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=4x+1/x=(4x²+1)/x, x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "f(x)−ln x=2x²+1, deci lim_{x→+∞} (2x²+1)/(x²+x+4)=2." },
          { label: "c)", points: 5, answer: "f′(x)=(4x²+1)/x>0 pe (0,+∞), deci f este strict crescătoare, adică injectivă. f este continuă, lim_{x→0⁺}f(x)=−∞ și lim_{x→+∞}f(x)=+∞, deci f((0,+∞))=ℝ, adică f este surjectivă. Prin urmare f este bijectivă." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x(eˣ+2x²).\na) Arătați că ∫₀⁴ f(x)/(eˣ+2x²) dx = 8.\nb) Arătați că ∫₀¹ (f(x)−2x³) dx = 1.\nc) Determinați numărul real a pentru care ∫₁² (1/x)·f(x²) dx = (e⁴−e)/2 + a.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)/(eˣ+2x²)=x, deci ∫₀⁴ x dx=(x²/2)|₀⁴=8." },
          { label: "b)", points: 5, answer: "f(x)−2x³=x·eˣ, deci ∫₀¹ x·eˣ dx=((x−1)eˣ)|₀¹=0−(−1)=1." },
          { label: "c)", points: 5, answer: "(1/x)·f(x²)=x·e^(x²)+2x⁵, deci ∫₁²(x·e^(x²)+2x⁵)dx=((1/2)e^(x²)+x⁶/3)|₁²=(e⁴−e)/2+(64−1)/3=(e⁴−e)/2+21. Din egalitate obținem a=21." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 3 — Matematică M_st-nat (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m2", subjectName: "Matematică M2 (Științele naturii)",
    grade: 12, variant: "var-03", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale. Radicali",
        content: "Arătați că √2·(√2−1)·(2+√2)=2.",
        finalAnswer: "2",
        rubric: [{ label: "barem", points: 5, answer: "(√2−1)(2+√2)=2√2+2−2−√2=√2, deci √2·√2=2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcția de gradul II",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x²−4x. Determinați abscisele punctelor de intersecție a graficului funcției f cu axa Ox.",
        finalAnswer: "0 și 2",
        rubric: [{ label: "barem", points: 5, answer: "f(x)=0 ⟺ 2x(x−2)=0, deci abscisele sunt x=0 și x=2." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 2^(x−3)=1/2^(2x).",
        finalAnswer: "x=1",
        rubric: [{ label: "barem", points: 5, answer: "2^(x−3)=2^(−2x) ⟺ x−3=−2x ⟺ 3x=3, deci x=1." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să fie multiplu de 11.",
        finalAnswer: "1/10",
        rubric: [{ label: "barem", points: 5, answer: "90 de elemente; multiplii de 11 de două cifre sunt 11,22,…,99 — 9 cazuri favorabile. p=9/90=1/10." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică. Triunghi isoscel",
        content: "În reperul cartezian xOy se consideră punctele A(−1,0), B(0,3) și C(4,0). Arătați că triunghiul ABC este isoscel.",
        finalAnswer: "AC=BC=5",
        rubric: [{ label: "barem", points: 5, answer: "AC=√((4+1)²+0)=5 și BC=√((4−0)²+(0−3)²)=√25=5, deci AC=BC=5, triunghiul ABC este isoscel." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie",
        content: "Se consideră expresia E(x)=tg x+sin(3x/2)−2cos(x/2), unde x∈(0,π/2). Arătați că E(π/3)=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "E(π/3)=tg(π/3)+sin(π/2)−2cos(π/6)=√3+1−2·(√3/2)=√3+1−√3=1." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Relații matriceale",
        content: "Se consideră matricele M(x)=(x+1 −x / −2x 2x+1), unde x este număr real.\na) Arătați că det(M(1))=4.\nb) Arătați că M(x)·M(1)=M(4x+1), pentru orice număr real x.\nc) Determinați numărul real x pentru care M(x)·M(1)·M(1)=M(x+2).",
        rubric: [
          { label: "a)", points: 5, answer: "M(1)=(2 −1 / −2 3), deci det(M(1))=2·3−(−1)(−2)=6−2=4." },
          { label: "b)", points: 5, answer: "M(x)·M(1)=(4x+2 −4x−1 / −8x−2 8x+3)=M(4x+1), pentru orice x∈ℝ (calcul direct)." },
          { label: "c)", points: 5, answer: "Aplicând b) de două ori, M(x)·M(1)·M(1)=M(4x+1)·M(1)=M(16x+5). Cum M(a)=M(b) ⟺ a=b, din M(16x+5)=M(x+2) obținem 16x+5=x+2, deci x=−1/5." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∘y=5xy+10x+10y+18.\na) Arătați că (−1)∘0=8.\nb) Demonstrați că x∘y=5(x+2)(y+2)−2, pentru orice numere reale x și y.\nc) Determinați numărul întreg m pentru care m∘m=m.",
        rubric: [
          { label: "a)", points: 5, answer: "(−1)∘0=5·(−1)·0+10·(−1)+10·0+18=−10+18=8." },
          { label: "b)", points: 5, answer: "5(x+2)(y+2)−2=5(xy+2x+2y+4)−2=5xy+10x+10y+20−2=5xy+10x+10y+18=x∘y." },
          { label: "c)", points: 5, answer: "m∘m=5(m+2)²−2=m ⟺ 5(m+2)²=m+2 ⟺ (m+2)(5m+9)=0; cu m întreg, m=−2." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Tangentă. Inegalități",
        content: "Se consideră funcția f:(1,+∞)→ℝ, f(x)=(x²+1)/(x−1)+ln(x−1).\na) Arătați că f′(x)=(x²−x−2)/(x−1)², x∈(1,+∞).\nb) Determinați ecuația tangentei la graficul funcției f în punctul de abscisă x=2, situat pe graficul funcției f.\nc) Demonstrați că (x²+1)/(x−1)+ln(x−1)≥5, pentru orice x∈(1,+∞).",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=(2x(x−1)−(x²+1))/(x−1)²+1/(x−1)=(x²−2x−1)/(x−1)²+(x−1)/(x−1)²=(x²−x−2)/(x−1)², x∈(1,+∞)." },
          { label: "b)", points: 5, answer: "f(2)=5/1+ln1=5 și f′(2)=(4−2−2)/1=0. Tangenta: y−5=0·(x−2), adică y=5." },
          { label: "c)", points: 5, answer: "f′(x)=(x−2)(x+1)/(x−1)², deci pe (1,+∞) f este descrescătoare pe (1,2) și crescătoare pe (2,+∞), cu minimul f(2)=5. Prin urmare f(x)≥5 pentru orice x∈(1,+∞)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x+4)/(6x²+1).\na) Arătați că ∫₀² f(x)·(6x²+1) dx = 10.\nb) Arătați că ∫₀² (f(x)−4/(6x²+1)) dx = ln5/6.\nc) Determinați numărul real m pentru care ∫₀¹ ((x+4)/f(x))·e^(2x) dx = m(e²−1).",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)·(6x²+1)=x+4, deci ∫₀²(x+4)dx=(x²/2+4x)|₀²=2+8=10." },
          { label: "b)", points: 5, answer: "f(x)−4/(6x²+1)=x/(6x²+1), deci ∫₀² x/(6x²+1)dx=(1/12)ln(6x²+1)|₀²=(1/12)ln25=ln5/6." },
          { label: "c)", points: 5, answer: "(x+4)/f(x)=6x²+1, deci ∫₀¹(6x²+1)e^(2x)dx=(e^(2x)(3x²−3x+2))|₀¹=2e²−2=2(e²−1). Din 2(e²−1)=m(e²−1) obținem m=2." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 7 — Matematică M_st-nat (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m2", subjectName: "Matematică M2 (Științele naturii)",
    grade: 12, variant: "var-07", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale. Media aritmetică",
        content: "Determinați media aritmetică a numerelor a=20−√21 și b=22+√21.",
        finalAnswer: "21",
        rubric: [{ label: "barem", points: 5, answer: "(a+b)/2=((20−√21)+(22+√21))/2=42/2=21." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=x−1 și g:ℝ→ℝ, g(x)=3−x. Arătați că f(a)+g(a)=2, pentru orice număr real a.",
        finalAnswer: "2",
        rubric: [{ label: "barem", points: 5, answer: "f(a)+g(a)=(a−1)+(3−a)=2, pentru orice a∈ℝ." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații cu radicali",
        content: "Rezolvați în mulțimea numerelor reale ecuația √(7x−6)=x.",
        finalAnswer: "{1, 6}",
        rubric: [{ label: "barem", points: 5, answer: "Condiție x≥0; 7x−6=x² ⟺ x²−7x+6=0 ⟺ x=1 sau x=6 (ambele verifică)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Combinatorică",
        content: "Determinați numărul numerelor naturale pare, de două cifre, care au cifrele elemente ale mulțimii {1,2,3,4}.",
        finalAnswer: "8",
        rubric: [{ label: "barem", points: 5, answer: "Cifra unităților pară ∈{2,4} (2 alegeri), cifra zecilor ∈{1,2,3,4} (4 alegeri): 4·2=8." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică. Triunghi isoscel",
        content: "În reperul cartezian xOy se consideră punctele A(6,0) și B(6,6), iar M mijlocul segmentului OB. Arătați că triunghiul AOM este isoscel.",
        finalAnswer: "OM=AM=3√2",
        rubric: [{ label: "barem", points: 5, answer: "M(3,3); OM=√(9+9)=3√2, AM=√((6−3)²+(0−3)²)=√18=3√2, deci OM=AM=3√2, triunghiul AOM este isoscel." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=4 și măsura unghiului B egală cu 60°. Determinați lungimea înălțimii din vârful A a triunghiului ABC.",
        finalAnswer: "2",
        rubric: [{ label: "barem", points: 5, answer: "AB=AC/tg60°=4/√3, BC=AC/sin60°=8/√3. Înălțimea din A: h=AB·AC/BC=2." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice",
        content: "Se consideră matricele I₂=(1 0 / 0 1) și A(x)=(1 −x / x x+1), unde x este număr real.\na) Arătați că det(A(1))=3.\nb) Arătați că A(−1)·A(2)−A(−1)=2I₂.\nc) Determinați numerele reale x pentru care A(x)·A(−x)+xA(x)=3I₂.",
        rubric: [
          { label: "a)", points: 5, answer: "A(1)=(1 −1 / 1 2), deci det(A(1))=1·2−(−1)·1=2+1=3." },
          { label: "b)", points: 5, answer: "A(−1)·A(2)=(3 1 / −1 2), deci A(−1)·A(2)−A(−1)=(3 1 / −1 2)−(1 1 / −1 0)=(2 0 / 0 2)=2I₂." },
          { label: "c)", points: 5, answer: "A(x)·A(−x)+xA(x)=((1+x²+x) 0 / 0 (1+x²+x)). Din 1+x²+x=3 obținem x²+x−2=0, deci x=−2 sau x=1." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Inecuații",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∘y=4(xy+1)−3(x+y).\na) Arătați că 1∘2=3.\nb) Arătați că, dacă a∘3=4, atunci a∘(−a)=0.\nc) Determinați valorile reale ale lui x pentru care (x∘1)∘(x−1)≤4.",
        rubric: [
          { label: "a)", points: 5, answer: "1∘2=4(1·2+1)−3(1+2)=12−9=3." },
          { label: "b)", points: 5, answer: "a∘3=4(3a+1)−3(a+3)=9a−5=4 ⟹ a=1. Atunci a∘(−a)=1∘(−1)=4(−1+1)−3(1−1)=0." },
          { label: "c)", points: 5, answer: "x∘1=4(x+1)−3(x+1)=x+1, deci (x∘1)∘(x−1)=(x+1)∘(x−1)=4((x²−1)+1)−3(2x)=4x²−6x. Din 4x²−6x≤4 ⟺ (2x+1)(x−2)≤0 obținem x∈[−1/2, 2]." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Limite. Inegalități",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=2x²+x+3−5ln x.\na) Arătați că f′(x)=(x−1)(4x+5)/x, x∈(0,+∞).\nb) Arătați că lim_{x→+∞} (f(x)+5ln x)/(3−x−x²)=−2.\nc) Demonstrați că 2x²+x≥3+5ln x, pentru orice x∈(0,+∞).",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=4x+1−5/x=(4x²+x−5)/x=(x−1)(4x+5)/x, x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "f(x)+5ln x=2x²+x+3, deci lim_{x→+∞} (2x²+x+3)/(3−x−x²)=2/(−1)=−2." },
          { label: "c)", points: 5, answer: "f′(x)=(x−1)(4x+5)/x, deci pe (0,+∞) f are minimul în x=1, f(1)=2+1+3−0=6. Astfel f(x)≥6, adică 2x²+x+3−5ln x≥6, echivalent cu 2x²+x≥3+5ln x." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(3−2x)eˣ.\na) Arătați că ∫₀¹ f(x)/eˣ dx = 2.\nb) Arătați că ∫₀² f(x) dx = e²−5.\nc) Determinați a∈(−∞,1) pentru care ∫ₐ¹ e^(3x)/f³(x) dx = 2/9.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)/eˣ=3−2x, deci ∫₀¹(3−2x)dx=(3x−x²)|₀¹=3−1=2." },
          { label: "b)", points: 5, answer: "Prin părți: ∫₀²(3−2x)eˣ dx=((3−2x)eˣ)|₀²+2eˣ|₀²=(−e²−3)+(2e²−2)=e²−5." },
          { label: "c)", points: 5, answer: "e^(3x)/f³(x)=1/(3−2x)³, deci ∫ₐ¹ dx/(3−2x)³=(1/(4(3−2x)²))|ₐ¹=1/4−1/(4(3−2a)²). Din 1/4−1/(4(3−2a)²)=2/9 obținem (3−2a)²=9; cum a<1, 3−2a=3, deci a=0." },
        ] },
    ],
  },
];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.year}-${p.variant}`;
    const expected = p.maxScore - p.officeBonus;
    let sum = 0;
    const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number") errors.push(`[${tag}] item missing field: ${it.label}`);
      if (!it.content || !it.content.trim()) errors.push(`[${tag}] item ${it.label} empty content`);
      const key = `${it.section}::${it.label}`;
      if (labels.has(key)) errors.push(`[${tag}] duplicate ${key}`);
      labels.add(key);
      if (it.autoGradable && it.type === "OPEN") errors.push(`[${tag}] ${it.label} autoGradable but OPEN`);
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points) errors.push(`[${tag}] ${it.label} rubric ${rsum} != points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expected) errors.push(`[${tag}] points sum ${sum} != ${expected}`);
    console.log(`  ${tag.padEnd(16)} items=${p.items.length} pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus})`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); for (const e of errors) console.error("   - " + e); process.exit(1); }
  console.log(`\n✅ VALIDATE OK — ${PAPERS.length} paper(s), 90p (+10 oficiu = 100) fiecare.`);
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        include: { _count: { select: { items: true } } },
      });
      console.log(`  ${p.year}-${p.variant} ${existing ? "UPDATE" : "CREATE"} → items=${p.items.length}` + (existing ? ` (replacing ${existing._count.items})` : ""));
      if (dry) continue;
      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        update: { source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
        create: { source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey, subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx,
          type: it.type, points: it.points, content: it.content,
          options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null,
          rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null,
          hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null,
          figureUrl: it.figureUrl ?? null, autoGradable: !!it.autoGradable,
          finalAnswer: it.finalAnswer ?? null, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items] = await Promise.all([prisma.examPaper.count(), prisma.examItem.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items}`);
  } finally { await prisma.$disconnect(); }
}

(async () => {
  console.log(`\n=== import-exam-bac-matematica-m1-batch (mode=${MODE}, papers=${PAPERS.length}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
