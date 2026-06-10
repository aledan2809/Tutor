#!/usr/bin/env node
/**
 * import-exam-bac-matematica-m1-batch.mjs — BAC Matematică M3 (Tehnologic) → SIMULĂRI (full papers, batch)
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
    source: "BAC 2022 Model — Matematică M_tehnologic (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m3", subjectName: "Matematică M3 (Tehnologic)",
    grade: 12, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale. Radicali",
        content: "Arătați că (√8+1)·(2√2−1)−√36=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "√8=2√2; (2√2+1)(2√2−1)−6=8−1−6=1." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Grafic",
        content: "Determinați coordonatele punctului de intersecție a graficelor funcțiilor f:ℝ→ℝ, f(x)=5x−1 și g:ℝ→ℝ, g(x)=5+2x.",
        finalAnswer: "(2, 9)",
        rubric: [{ label: "barem", points: 5, answer: "5x−1=5+2x ⟺ 3x=6 ⟺ x=2; y=9. Punctul de intersecție este (2,9)." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații cu radicali",
        content: "Rezolvați în mulțimea numerelor reale ecuația √(x²+6x)=x.",
        finalAnswer: "x=0",
        rubric: [{ label: "barem", points: 5, answer: "x²+6x=x² ⟺ 6x=0 ⟺ x=0 (convine)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Determinați probabilitatea ca, alegând un număr n din mulțimea A={0,1,2,3,4,5,6,7,8,9}, numărul 4·n să fie element al mulțimii A.",
        finalAnswer: "3/10",
        rubric: [{ label: "barem", points: 5, answer: "4n∈A ⟺ n∈{0,1,2}, 3 cazuri din 10. p=3/10." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(2,1), B(3,4) și C, astfel încât A este mijlocul segmentului BC. Arătați că triunghiul AOC (O fiind originea reperului) este dreptunghic isoscel.",
        finalAnswer: "dreptunghic isoscel",
        rubric: [{ label: "barem", points: 5, answer: "C=2A−B=(1,−2); OA=√5, OC=√5, AC=√10; OA²+OC²=AC² și OA=OC, deci triunghiul AOC este dreptunghic isoscel." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie",
        content: "În triunghiul ascuțitunghic ABC are loc relația sin30°·sin A=cos60°·cos A. Calculați tg A.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "(1/2)sin A=(1/2)cos A ⟺ sin A=cos A ⟺ tg A=1." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți",
        content: "Se consideră matricele A=(3 −6 / 2 −3), I₂ și B(a)=(0 a−2 / 1 3a), unde a este număr real.\na) Arătați că det A=3.\nb) Determinați numărul real x pentru care A·A+A=2B(x).\nc) Determinați numărul real a pentru care det(B(a)·A+B(3a))=4.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=3·(−3)−(−6)·2=−9+12=3." },
          { label: "b)", points: 5, answer: "A²=−3I₂, deci A²+A=(0 −6 / 2 −6). Din 2B(x)=(0 2x−4 / 2 6x)=(0 −6 / 2 −6) obținem x=−1." },
          { label: "c)", points: 5, answer: "B(a)·A+B(3a)=(2a−4 4 / 6a+4 −6), det=−36a+8. Din −36a+8=4 obținem a=1/9." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=(xy+1)(x+y).\na) Arătați că 1∗2=9.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∗”.\nc) Determinați numerele naturale nenule n pentru care numărul N=n∗(1/n) este întreg.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗2=(1·2+1)(1+2)=3·3=9." },
          { label: "b)", points: 5, answer: "x∗0=(x·0+1)(x+0)=x și 0∗x=x, pentru orice x∈ℝ, deci e=0 este elementul neutru." },
          { label: "c)", points: 5, answer: "N=n∗(1/n)=(1+1)(n+1/n)=2n+2/n. N este întreg ⟺ n divide 2, deci n∈{1,2}." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Limite. Monotonie",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x−1)eˣ−x²/2.\na) Arătați că f′(x)=x(eˣ−1), x∈ℝ.\nb) Arătați că lim_{x→0} (f(x)−f(0))/x²=0.\nc) Arătați că f(x)≤f(x²), pentru orice x∈(−∞,0].",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=eˣ+(x−1)eˣ−x=xeˣ−x=x(eˣ−1), x∈ℝ." },
          { label: "b)", points: 5, answer: "Prin regula lui l'Hôpital: lim_{x→0}(f(x)−f(0))/x²=lim_{x→0} f′(x)/(2x)=lim_{x→0} (eˣ−1)/2=0." },
          { label: "c)", points: 5, answer: "f′(x)=x(eˣ−1)≥0 pentru orice x∈ℝ (factorii au același semn), deci f este crescătoare pe ℝ. Cum pentru x≤0 avem x≤x², rezultă f(x)≤f(x²)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Convexitate",
        content: "Se consideră funcția f:(−4,+∞)→ℝ, f(x)=4x/(x+4).\na) Arătați că ∫₁² (x+4)f(x) dx = 6.\nb) Arătați că ∫₁⁴ (1/x)·f(x²) dx = 4ln2.\nc) Demonstrați că orice primitivă a funcției f este convexă.",
        rubric: [
          { label: "a)", points: 5, answer: "(x+4)f(x)=4x, deci ∫₁² 4x dx=(2x²)|₁²=8−2=6." },
          { label: "b)", points: 5, answer: "(1/x)·f(x²)=4x/(x²+4), deci ∫₁⁴ 4x/(x²+4)dx=2ln(x²+4)|₁⁴=2(ln20−ln5)=2ln4=4ln2." },
          { label: "c)", points: 5, answer: "Pentru o primitivă F, F″=f′(x)=16/(x+4)²>0 pe (−4,+∞), deci orice primitivă a lui f este convexă." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Simulare — Matematică M_tehnologic (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m3", subjectName: "Matematică M3 (Tehnologic)",
    grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Progresii aritmetice",
        content: "Calculați termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, știind că a₃=6 și a₄=9.",
        finalAnswer: "a₁=0",
        rubric: [{ label: "barem", points: 5, answer: "r=a₄−a₃=3; a₁=a₃−2r=6−6=0." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=x²+2x−3 și g:ℝ→ℝ, g(x)=x−3. Determinați numerele reale a pentru care f(a)=g(a).",
        finalAnswer: "{−1, 0}",
        rubric: [{ label: "barem", points: 5, answer: "a²+2a−3=a−3 ⟺ a²+a=0 ⟺ a(a+1)=0, deci a∈{−1, 0}." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
        content: "Rezolvați în mulțimea numerelor reale ecuația log₃(x+3)=2.",
        finalAnswer: "x=6",
        rubric: [{ label: "barem", points: 5, answer: "x+3=9, deci x=6." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Procente",
        content: "În urma unei scumpiri cu 30%, prețul unui produs a crescut cu 60 de lei. Determinați prețul produsului după scumpire.",
        finalAnswer: "260 lei",
        rubric: [{ label: "barem", points: 5, answer: "30% din preț=60 ⟹ preț=200; după scumpire 200+60=260 lei." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică",
        content: "Se consideră punctele A(−4,1), B(2,3) și dreapta d de ecuație y=2x+a. Determinați valoarea reală a lui a, știind că mijlocul segmentului AB aparține dreptei d.",
        finalAnswer: "a=4",
        rubric: [{ label: "barem", points: 5, answer: "Mijlocul AB=(−1,2); 2=2·(−1)+a, deci a=4." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Aria triunghiului",
        content: "Determinați aria triunghiului ABC, cu AB=AC, BC=12 și măsura unghiului B egală cu 45°.",
        finalAnswer: "36",
        rubric: [{ label: "barem", points: 5, answer: "Triunghi dreptunghic isoscel cu ipotenuza BC=12, catetele AB=AC=6√2; aria=(6√2·6√2)/2=36." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice",
        content: "Se consideră matricea A(x)=(x x / 1 2x+1), unde x este număr real.\na) Arătați că det(A(0))=0.\nb) Determinați numărul real a pentru care 2A(4)+A(−2)=aA(2).\nc) Arătați că, dacă X∈M₂(ℝ) astfel încât X·A(1)=A(m), unde m este număr întreg, atunci matricea X are toate elementele numere întregi.",
        rubric: [
          { label: "a)", points: 5, answer: "A(0)=(0 0 / 1 1), deci det(A(0))=0·1−0·1=0." },
          { label: "b)", points: 5, answer: "2A(4)+A(−2)=(6 6 / 3 15)=3·(2 2 / 1 5)=3A(2), deci a=3." },
          { label: "c)", points: 5, answer: "A(1)=(1 1 / 1 3) este inversabilă (det=2), iar X=A(m)·(A(1))⁻¹=(m 0 / 1−m m). Pentru m întreg, toate elementele lui X sunt întregi." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Inecuații",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=(x+y)(x−1)(y−1)+1.\na) Arătați că 2∗1=1.\nb) Arătați că legea de compoziție „∗” este comutativă.\nc) Determinați numerele naturale n pentru care n∗(1−n)≥n².",
        rubric: [
          { label: "a)", points: 5, answer: "2∗1=(2+1)(2−1)(1−1)+1=3·1·0+1=1." },
          { label: "b)", points: 5, answer: "Atât x+y, cât și (x−1)(y−1) sunt simetrice în x și y, deci x∗y=y∗x, adică legea este comutativă." },
          { label: "c)", points: 5, answer: "n∗(1−n)=(1)(n−1)(−n)+1=−n²+n+1. Din −n²+n+1≥n² ⟺ 2n²−n−1≤0 ⟺ (2n+1)(n−1)≤0 obținem n∈{0,1}." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Tangentă. Inegalități",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=(x+3)/x²+ln x.\na) Arătați că f′(x)=(x²−x−6)/x³, x∈(0,+∞).\nb) Determinați ecuația tangentei la graficul funcției f în punctul de abscisă x=1, situat pe graficul funcției f.\nc) Demonstrați că ln(x/3)≥2/3−1/x−3/x², pentru orice x∈(0,+∞).",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)=1/x+3/x²+ln x, f′(x)=−1/x²−6/x³+1/x=(x²−x−6)/x³, x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "f(1)=4 și f′(1)=−6, deci tangenta: y−4=−6(x−1), adică y=−6x+10." },
          { label: "c)", points: 5, answer: "f′(x)=(x−3)(x+2)/x³, deci pe (0,+∞) f are minimul f(3)=2/3+ln3. Din f(x)≥2/3+ln3 obținem ln x−ln3≥2/3−1/x−3/x², adică ln(x/3)≥2/3−1/x−3/x²." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x+eˣ/2+1.\na) Arătați că ∫₀² (f(x)−eˣ/2) dx = 4.\nb) Arătați că ∫₀¹ 2x(f(x)−1) dx = 5/3.\nc) Determinați numărul real a pentru care ∫₋₁⁰ (f(x)−x)·f(x) dx = (3e+1)(3e+a)/(8e²).",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)−eˣ/2=x+1, deci ∫₀²(x+1)dx=(x²/2+x)|₀²=2+2=4." },
          { label: "b)", points: 5, answer: "2x(f(x)−1)=2x²+x·eˣ, deci ∫₀¹(2x²+xeˣ)dx=2/3+((x−1)eˣ)|₀¹=2/3+1=5/3." },
          { label: "c)", points: 5, answer: "Cum f(x)−x=eˣ/2+1=f′(x), avem (f(x)−x)f(x)=f′(x)f(x), deci ∫₋₁⁰ f′f dx=(f²/2)|₋₁⁰=(f(0)²−f(−1)²)/2=(9/4−1/(4e²))/2=(3e−1)(3e+1)/(8e²). Din egalitate, a=−1." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 1 — Matematică M_tehnologic (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m3", subjectName: "Matematică M3 (Tehnologic)",
    grade: 12, variant: "var-01", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale",
        content: "Arătați că 5−3·(1+1/3)=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "5−3·(4/3)=5−4=1." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−4. Determinați valoarea reală a lui a pentru care f(a)=2.",
        finalAnswer: "a=6",
        rubric: [{ label: "barem", points: 5, answer: "a−4=2, deci a=6." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații cu radicali",
        content: "Rezolvați în mulțimea numerelor reale ecuația √(4+2x)=2.",
        finalAnswer: "x=0",
        rubric: [{ label: "barem", points: 5, answer: "4+2x=4 ⟺ x=0 (convine)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Procente",
        content: "Un produs costă 90 de lei. Determinați prețul produsului după o scumpire cu 10%.",
        finalAnswer: "99 lei",
        rubric: [{ label: "barem", points: 5, answer: "90+10%·90=90+9=99 lei." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,4), B(5,0) și M(a,b). Determinați numerele reale a și b, știind că M este mijlocul segmentului AB.",
        finalAnswer: "a=3, b=2",
        rubric: [{ label: "barem", points: 5, answer: "a=(1+5)/2=3, b=(4+0)/2=2." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu măsura unghiului C egală cu 30° și AB=3. Determinați lungimea ipotenuzei BC.",
        finalAnswer: "6",
        rubric: [{ label: "barem", points: 5, answer: "sin C=AB/BC ⟹ sin30°=3/BC ⟹ BC=6." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți",
        content: "Se consideră matricele A=(2 1 / 4 3), B=(2 −2 / 1 3) și C=(2 −1 / 2 3).\na) Arătați că det A=2.\nb) Arătați că A+2B=3C.\nc) Determinați numerele reale x pentru care det(B·C+x(A−C))=0.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=2·3−1·4=2." },
          { label: "b)", points: 5, answer: "A+2B=(6 −3 / 6 9)=3·(2 −1 / 2 3)=3C." },
          { label: "c)", points: 5, answer: "B·C=(0 −8 / 8 8), A−C=(0 2 / 2 0), deci B·C+x(A−C)=(0 2x−8 / 2x+8 8) și det=64−4x². Din 64−4x²=0 obținem x=−4 sau x=4." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Inegalități",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=(x+2y)(y+2x)+2.\na) Arătați că 1∗1=11.\nb) Determinați numerele reale x pentru care x∗0=4.\nc) Demonstrați că x∗(1/x)>7, pentru orice număr real nenul x.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗1=(1+2)(1+2)+2=3·3+2=11." },
          { label: "b)", points: 5, answer: "x∗0=(x)(2x)+2=2x²+2=4 ⟺ x²=1, deci x=−1 sau x=1." },
          { label: "c)", points: 5, answer: "x∗(1/x)=(x+2/x)(1/x+2x)+2=2x²+2/x²+5+2=2x²+2/x²+7. Cum 2x²+2/x²>0, rezultă x∗(1/x)>7." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Tangentă. Inegalități",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x⁵+5x⁴−10x³+1.\na) Arătați că f′(x)=10x²(x²+2x−3), x∈ℝ.\nb) Determinați ecuația tangentei la graficul funcției f în punctul de abscisă x=0, situat pe graficul funcției f.\nc) Demonstrați că 2x⁵+5x⁴−10x³+3≥0, pentru orice x∈[−3,+∞).",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=10x⁴+20x³−30x²=10x²(x²+2x−3), x∈ℝ." },
          { label: "b)", points: 5, answer: "f(0)=1 și f′(0)=0, deci tangenta este y=1." },
          { label: "c)", points: 5, answer: "f′(x)=10x²(x+3)(x−1), deci pe [−3,+∞) f are minimul f(1)=2+5−10+1=−2. Din f(x)≥−2 obținem 2x⁵+5x⁴−10x³+3≥0." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:(−1,+∞)→ℝ, f(x)=6x+2/(x+1).\na) Arătați că ∫₀² (f(x)−2/(x+1)) dx = 12.\nb) Arătați că ∫₀¹ (f(x)−6x) dx = 2ln2.\nc) Determinați numărul real a pentru care ∫₁ᵉ (f(x)−2/(x+1))·ln²x dx = a(e²−1)/2.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)−2/(x+1)=6x, deci ∫₀² 6x dx=(3x²)|₀²=12." },
          { label: "b)", points: 5, answer: "f(x)−6x=2/(x+1), deci ∫₀¹ 2/(x+1)dx=2ln(x+1)|₀¹=2ln2." },
          { label: "c)", points: 5, answer: "∫₁ᵉ 6x(ln x)² dx=(3x²(ln x)²−3x²ln x+3x²/2)|₁ᵉ=3e²/2−3/2=3(e²−1)/2. Din egalitate, a=3." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 3 — Matematică M_tehnologic (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m3", subjectName: "Matematică M3 (Tehnologic)",
    grade: 12, variant: "var-03", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale",
        content: "Arătați că (1,5−0,5)·3−2·0,5=2.",
        finalAnswer: "2",
        rubric: [{ label: "barem", points: 5, answer: "1·3−1=3−1=2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−3. Determinați valoarea reală a lui a pentru care f(a)=9.",
        finalAnswer: "a=6",
        rubric: [{ label: "barem", points: 5, answer: "2a−3=9, deci a=6." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
        content: "Rezolvați în mulțimea numerelor reale ecuația log₄(3x−1)=log₄5.",
        finalAnswer: "x=2",
        rubric: [{ label: "barem", points: 5, answer: "3x−1=5, deci x=2." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Determinați probabilitatea ca, alegând un număr n din mulțimea A={0,1,2,3,4,5,6,7,8,9}, acesta să verifice inegalitatea 5n≤22.",
        finalAnswer: "1/2",
        rubric: [{ label: "barem", points: 5, answer: "5n≤22 ⟺ n≤4, deci n∈{0,1,2,3,4}, 5 cazuri din 10. p=5/10=1/2." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică",
        content: "Determinați coordonatele mijlocului segmentului AB, cu A(−2,1) și B(6,3).",
        finalAnswer: "(2, 2)",
        rubric: [{ label: "barem", points: 5, answer: "((−2+6)/2,(1+3)/2)=(2,2)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Aria triunghiului",
        content: "Determinați aria triunghiului ABC, dreptunghic în A, cu AC=4 și BC=5.",
        finalAnswer: "6",
        rubric: [{ label: "barem", points: 5, answer: "AB=√(BC²−AC²)=√(25−16)=3; aria=(1/2)·3·4=6." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice",
        content: "Se consideră matricele A=(2 1 / 1 3) și B(x)=(2−x x / x 2), unde x este număr real.\na) Arătați că det A=5.\nb) Arătați că 2A−B(2)=2B(0).\nc) Determinați numerele reale x pentru care det(B(x)·B(1)−(x+1)A)=1.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=2·3−1·1=5." },
          { label: "b)", points: 5, answer: "2A−B(2)=(4 0 / 0 4)=2·(2 0 / 0 2)=2B(0)." },
          { label: "c)", points: 5, answer: "B(x)·B(1)−(x+1)A=(−2x 1 / 1 −2x+1), det=4x²−2x−1. Din 4x²−2x−1=1 ⟺ 2x²−x−1=0 ⟺ (2x+1)(x−1)=0 obținem x=−1/2 sau x=1." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Inecuații",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∘y=x+y−6xy.\na) Arătați că 1∘1=−4.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∘”.\nc) Determinați numerele întregi m pentru care m∘(3−m)<3.",
        rubric: [
          { label: "a)", points: 5, answer: "1∘1=1+1−6·1·1=2−6=−4." },
          { label: "b)", points: 5, answer: "x∘0=x+0−6x·0=x și 0∘x=x, pentru orice x∈ℝ, deci e=0 este elementul neutru." },
          { label: "c)", points: 5, answer: "m∘(3−m)=3−6m(3−m)=3−18m+6m². Din 3−18m+6m²<3 ⟺ 6m(m−3)<0 ⟺ 0<m<3 obținem m∈{1,2}." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Limite. Inegalități",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x³−3x⁴+2.\na) Arătați că f′(x)=6x²(1−2x), x∈ℝ.\nb) Arătați că lim_{x→+∞} (f(x)+3x⁴)/(x³+4)=2.\nc) Demonstrați că −32≤2x³−3x⁴≤1/16, pentru orice x∈[0,2].",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=6x²−12x³=6x²(1−2x), x∈ℝ." },
          { label: "b)", points: 5, answer: "f(x)+3x⁴=2x³+2, deci lim_{x→+∞} (2x³+2)/(x³+4)=2." },
          { label: "c)", points: 5, answer: "g(x)=2x³−3x⁴, g′(x)=6x²(1−2x), deci pe [0,2] g are maximul g(1/2)=1/16 și minimul g(2)=16−48=−32. Astfel −32≤2x³−3x⁴≤1/16." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x+3eˣ.\na) Arătați că ∫₂³ (f(x)−3eˣ) dx = 5.\nb) Arătați că ∫₀¹ x(f(x)−2x) dx = 3.\nc) Determinați numărul real a, știind că ∫₀¹ (f′(x)−x)/(2f(x)−x²) dx = a·ln(e+1/2).",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)−3eˣ=2x, deci ∫₂³ 2x dx=(x²)|₂³=9−4=5." },
          { label: "b)", points: 5, answer: "f(x)−2x=3eˣ, deci ∫₀¹ 3x·eˣ dx=3((x−1)eˣ)|₀¹=3·1=3." },
          { label: "c)", points: 5, answer: "f′(x)−x=(1/2)(2f(x)−x²)′, deci integrandul=(1/2)(ln(2f(x)−x²))′. ∫₀¹=(1/2)ln(2f(x)−x²)|₀¹=(1/2)(ln(3+6e)−ln6)=(1/2)ln(e+1/2). Din egalitate, a=1/2." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 7 — Matematică M_tehnologic (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m3", subjectName: "Matematică M3 (Tehnologic)",
    grade: 12, variant: "var-07", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale",
        content: "Arătați că 1+6·(1/2+1/3)=6.",
        finalAnswer: "6",
        rubric: [{ label: "barem", points: 5, answer: "1+6·(5/6)=1+5=6." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−2. Calculați f(3)−f(2).",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "f(3)−f(2)=1−0=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații cu radicali",
        content: "Rezolvați în mulțimea numerelor reale ecuația √(3x+1)=2.",
        finalAnswer: "x=1",
        rubric: [{ label: "barem", points: 5, answer: "3x+1=4 ⟺ x=1." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Determinați probabilitatea ca, alegând un număr n din mulțimea A={1,2,3,4,5,6,7,8,9}, numărul 10−n să fie par.",
        finalAnswer: "4/9",
        rubric: [{ label: "barem", points: 5, answer: "10−n par ⟺ n par ⟺ n∈{2,4,6,8}, 4 cazuri din 9. p=4/9." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică",
        content: "Arătați că, pentru orice număr real a, lungimea segmentului AB, unde A(a,0) și B(a,6), este 6.",
        finalAnswer: "6",
        rubric: [{ label: "barem", points: 5, answer: "AB=√((a−a)²+(6−0)²)=√36=6." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Aria triunghiului",
        content: "Determinați aria triunghiului ABC, dreptunghic în A, cu AB=5 și AC=2AB.",
        finalAnswer: "25",
        rubric: [{ label: "barem", points: 5, answer: "AC=2·5=10; aria=(1/2)·AB·AC=(1/2)·5·10=25." }] },

      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Ecuații matriceale",
        content: "Se consideră matricele A=(7 3 / 3 1), B=(1 1 / 1 −1) și I₂.\na) Arătați că det A=−2.\nb) Arătați că A−4I₂=3B.\nc) Determinați matricea X∈M₂(ℝ) pentru care X+X·B=A.",
        rubric: [
          { label: "a)", points: 5, answer: "det A=7·1−3·3=7−9=−2." },
          { label: "b)", points: 5, answer: "A−4I₂=(3 3 / 3 −3)=3·(1 1 / 1 −1)=3B." },
          { label: "c)", points: 5, answer: "X(I₂+B)=A, cu I₂+B=(2 1 / 1 0) inversabilă; X=A·(I₂+B)⁻¹=(7 3 / 3 1)(0 1 / 1 −2)=(3 1 / 1 1)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Ecuații",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=xy(x+y−4).\na) Arătați că 2∗3=6.\nb) Determinați numerele reale x pentru care 1∗x=4.\nc) Determinați numărul real x pentru care 2^x∗2^x=2^(3x).",
        rubric: [
          { label: "a)", points: 5, answer: "2∗3=2·3·(2+3−4)=6·1=6." },
          { label: "b)", points: 5, answer: "1∗x=x(1+x−4)=x²−3x=4 ⟺ x²−3x−4=0 ⟺ (x−4)(x+1)=0, deci x=−1 sau x=4." },
          { label: "c)", points: 5, answer: "Cu t=2^x>0: t∗t=t²(2t−4)=2t²(t−2)=t³ ⟺ t²(t−4)=0, deci t=4, adică 2^x=4 și x=2." },
        ] },

      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie. Limite",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x³−9x²+3.\na) Arătați că f′(x)=3x(x−6), x∈ℝ.\nb) Determinați intervalele de monotonie a funcției f.\nc) Arătați că lim_{x→1} (f′(x)−f′(1))/(3f(x)−xf′(x))=2/3.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=3x²−18x=3x(x−6), x∈ℝ." },
          { label: "b)", points: 5, answer: "f′(x)=3x(x−6) are rădăcinile 0 și 6; f este crescătoare pe (−∞,0] și pe [6,+∞), descrescătoare pe [0,6]." },
          { label: "c)", points: 5, answer: "f′(x)−f′(1)=3(x−1)(x−5), iar 3f(x)−xf′(x)=−9(x−1)(x+1). Raportul=−(x−5)/(3(x+1)), cu limita în x=1 egală cu 4/6=2/3." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x−1)eˣ.\na) Arătați că ∫₀² f(x)/eˣ dx = 0.\nb) Arătați că ∫₀¹ f(x) dx = 2−e.\nc) Determinați numărul natural n, n>2, pentru care ∫₂ⁿ x/(f(x)·f(−x)) dx = (1/2)ln(3/8).",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)/eˣ=x−1, deci ∫₀²(x−1)dx=(x²/2−x)|₀²=2−2=0." },
          { label: "b)", points: 5, answer: "∫₀¹(x−1)eˣ dx=((x−2)eˣ)|₀¹=(−e)−(−2)=2−e." },
          { label: "c)", points: 5, answer: "f(x)·f(−x)=(x−1)(−x−1)=1−x², deci ∫₂ⁿ x/(1−x²)dx=(−1/2)ln(x²−1)|₂ⁿ=(1/2)ln(3/(n²−1)). Din (1/2)ln(3/(n²−1))=(1/2)ln(3/8) obținem n²−1=8, deci n=3." },
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
