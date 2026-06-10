#!/usr/bin/env node
/**
 * import-exam-bac-matematica-m1-batch.mjs — BAC Matematică M1 (Mate-Info) → SIMULĂRI (full papers, batch)
 *
 * Clone of import-exam-bac-matematica-m1-model.mjs but with a PAPERS[] array so the
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
    source: "BAC 2022 Model — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Progresii geometrice",
        content: "Arătați că numerele 6−3√3, √3 și 2+√3 sunt termeni consecutivi ai unei progresii geometrice.",
        finalAnswer: "(√3)²=(6−3√3)(2+√3)=3",
        rubric: [{ label: "barem", points: 5, answer: "(6−3√3)(2+√3)=12+6√3−6√3−9=3=(√3)², deci numerele 6−3√3, √3 și 2+√3 sunt termeni consecutivi ai unei progresii geometrice." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcția de gradul al II-lea. Tangență",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+mx+1, unde m este număr real. Determinați numerele reale m pentru care graficul funcției f este tangent axei Ox.",
        finalAnswer: "m∈{−2, 2}",
        rubric: [{ label: "barem", points: 5, answer: "Axa Ox este tangentă graficului funcției f ⟺ Δ=0 ⟺ m²−4=0, de unde obținem m=−2 sau m=2." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 5^(x+2) − 5^x = 24.",
        finalAnswer: "x=0",
        rubric: [{ label: "barem", points: 5, answer: "5^(x+2)−5^x=24 ⟺ 25·5^x−5^x=24 ⟺ 24·5^x=24, deci 5^x=1, de unde obținem x=0." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre distincte, acesta să aibă cifra zecilor multiplu de 3.",
        finalAnswer: "1/3",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea numerelor naturale de două cifre distincte are 81 de elemente, deci sunt 81 de cazuri posibile. Cifra zecilor multiplu de 3 înseamnă cifra zecilor ∈{3,6,9}; pentru fiecare, cifra unităților are 9 valori (distinctă de cea a zecilor), deci 3·9=27 de cazuri favorabile. p=27/81=1/3." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori",
        content: "Se consideră triunghiul ABC, punctul D mijlocul laturii AC și punctul M astfel încât MA⃗+2MB⃗+3MC⃗=0⃗. Arătați că dreptele MD și AB sunt paralele.",
        finalAnswer: "MD⃗=−(1/3)·AB⃗, deci MD ∥ AB",
        rubric: [{ label: "barem", points: 5, answer: "MA⃗+2MB⃗+3MC⃗=0⃗ ⟺ 3(MA⃗+MC⃗)+2AB⃗=0⃗ și, cum MA⃗+MC⃗=2MD⃗ (D mijlocul laturii AC), obținem 6MD⃗+2AB⃗=0⃗, deci MD⃗=−(1/3)AB⃗. Vectorii MD⃗ și AB⃗ sunt coliniari, deci dreptele MD și AB sunt paralele." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie. Triunghi dreptunghic",
        content: "Calculați lungimea laturii AB a triunghiului ABC, în care AC=3 și măsurile unghiurilor A și B sunt de 30°, respectiv 60°.",
        finalAnswer: "AB=2√3",
        rubric: [{ label: "barem", points: 5, answer: "Unghiul C are măsura de 90°, deci triunghiul ABC este dreptunghic în C. sin B=AC/AB, sin 60°=√3/2, deci AB=AC/sin B=3/(√3/2)=2√3." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Numere complexe",
        content: "Se consideră matricele I₃=(1 0 0 / 0 1 0 / 0 0 1) și B=(1 0 1 / 0 i 0 / −2 0 −1), iar A(z)=aI₃+bB, unde z=a+ib, cu a și b numere reale și i²=−1.\na) Arătați că det B=i.\nb) Demonstrați că A(z₁)·A(z₂)=A(z₁z₂), pentru orice numere complexe z₁ și z₂.\nc) Determinați numărul natural n pentru care A(1+i)·A(2+i)·A(3+i)·A(1−i)·A(2−i)·A(3−i)=nI₃.",
        rubric: [
          { label: "a)", points: 5, answer: "det B=|1 0 1; 0 i 0; −2 0 −1|=1·(i·(−1)−0·0)−0+1·(0·0−i·(−2))=−i+2i=i." },
          { label: "b)", points: 5, answer: "A(z)=aI₃+bB, cu z=a+ib. Pentru z₁=a+ib și z₂=c+id: A(z₁)·A(z₂)=(aI₃+bB)(cI₃+dB)=acI₃+(ad+bc)B+bdB². Cum B²=−I₃, obținem A(z₁)·A(z₂)=(ac−bd)I₃+(ad+bc)B. Cum z₁z₂=(ac−bd)+i(ad+bc), rezultă A(z₁z₂)=(ac−bd)I₃+(ad+bc)B=A(z₁)·A(z₂)." },
          { label: "c)", points: 5, answer: "A(1+i)·A(2+i)·A(3+i)·A(1−i)·A(2−i)·A(3−i)=A((1+i)(1−i)·(2+i)(2−i)·(3+i)(3−i))=A(2·5·10)=A(100)=100I₃, deci n=100." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru",
        content: "Pe mulțimea M=[1,+∞) se definește legea de compoziție asociativă x∗y=log₂(2^(x+y) − 2^(x+1) − 2^(y+1) + 6).\na) Arătați că x∗y=log₂((2ˣ−2)(2ʸ−2)+2), pentru orice x,y∈M.\nb) Determinați elementul neutru al legii de compoziție „∗”.\nc) Arătați că x∗x∗x < 3x, pentru orice x∈M.",
        rubric: [
          { label: "a)", points: 5, answer: "x∗y=log₂(2ˣ·2ʸ−2·2ˣ−2·2ʸ+4+2)=log₂(2ˣ(2ʸ−2)−2(2ʸ−2)+2)=log₂((2ˣ−2)(2ʸ−2)+2), pentru orice x,y∈M." },
          { label: "b)", points: 5, answer: "x∗e=x, pentru orice x∈M, unde e este elementul neutru ⟺ (2ˣ−2)(2ᵉ−2)+2=2ˣ ⟺ (2ˣ−2)(2ᵉ−3)=0, pentru orice x∈M, de unde obținem 2ᵉ=3, deci e=log₂3 este elementul neutru al legii „∗”." },
          { label: "c)", points: 5, answer: "x∗x∗x=log₂((2ˣ−2)³+2), pentru orice x∈M. (x∗x∗x)−3x=log₂(((2ˣ−2)³+2)/2^(3x))=log₂(1−6(2ˣ−1)²/2^(3x))<0, pentru orice x∈M (deoarece 6(2ˣ−1)²/2^(3x)>0), deci x∗x∗x<3x." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Limite. Extreme",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x³+3x+1)·e^(−x).\na) Arătați că f′(x)=(2−x)(x²−x+1)·e^(−x), x∈ℝ.\nb) Arătați că lim_{x→+∞} ((f(x)−e^(−x))/(f(x)+e^(−x)))^(f(x)·eˣ) = e^(−2).\nc) Demonstrați că funcția g:ℝ→ℝ, g(x)=|f(x)/e^(−x) − 1| are un singur punct de extrem.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=(3x²+3)e^(−x)+(x³+3x+1)·(−e^(−x))=(3x²+3−x³−3x−1)e^(−x)=(−x³+3x²−3x+2)e^(−x)=(2−x)(x²−x+1)e^(−x), x∈ℝ." },
          { label: "b)", points: 5, answer: "f(x)−e^(−x)=(x³+3x)e^(−x), f(x)+e^(−x)=(x³+3x+2)e^(−x), iar f(x)·eˣ=x³+3x+1. lim_{x→+∞}((x³+3x)/(x³+3x+2))^(x³+3x+1)=lim(1+(−2)/(x³+3x+2))^(x³+3x+1)=e^(lim_{x→+∞}(−2(x³+3x+1)/(x³+3x+2)))=e^(−2)." },
          { label: "c)", points: 5, answer: "f(x)/e^(−x)=x³+3x+1, deci g(x)=|x³+3x|, adică g(x)=−x³−3x pentru x∈(−∞,0) și g(x)=x³+3x pentru x∈[0,+∞). g este continuă; pentru x<0, g′(x)=−3x²−3<0 ⇒ g strict descrescătoare pe (−∞,0]; pentru x>0, g′(x)=3x²+3>0 ⇒ g strict crescătoare pe [0,+∞). Deci g are un singur punct de extrem (minim în x=0)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Primitive",
        content: "Se consideră funcția f:(1,+∞)→ℝ, f(x)=x·ln(x−1).\na) Arătați că ∫₄⁶ f(x)/ln(x−1) dx = 10.\nb) Demonstrați că F(√7) < F(3), pentru orice primitivă F a funcției f.\nc) Determinați numărul real m, știind că ∫₃⁵ f(x) dx = m(4ln2 − 1).",
        rubric: [
          { label: "a)", points: 5, answer: "∫₄⁶ f(x)/ln(x−1) dx=∫₄⁶ x·ln(x−1)/ln(x−1) dx=∫₄⁶ x dx=(x²/2)|₄⁶=18−8=10." },
          { label: "b)", points: 5, answer: "F este o primitivă a lui f, deci F′(x)=f(x)=x·ln(x−1)>0 pentru orice x∈(2,+∞), deci F este strict crescătoare pe (2,+∞). Cum 2<√7<3, obținem F(√7)<F(3)." },
          { label: "c)", points: 5, answer: "∫₃⁵ x·ln(x−1) dx=((x²/2)ln(x−1)−x²/4−x/2−(1/2)ln(x−1))|₃⁵=(24ln2−35/4)−(4ln2−15/4)=20ln2−5=5(4ln2−1), deci m=5." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 1 — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "var-01", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere reale. Radicali",
        content: "Arătați că 8−6√6+6(√6−1)=2.",
        finalAnswer: "2",
        rubric: [{ label: "barem", points: 5, answer: "8−6√6+6(√6−1)=8−6√6+6√6−6=8−6=2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x+m, unde m este număr real. Determinați numărul real m pentru care (f∘f)(0)=4.",
        finalAnswer: "m=1",
        rubric: [{ label: "barem", points: 5, answer: "f(0)=m; (f∘f)(0)=f(m)=3m+m=4m. Din 4m=4 obținem m=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 3·2^(2x) + 4^x = 4.",
        finalAnswer: "x=0",
        rubric: [{ label: "barem", points: 5, answer: "2^(2x)=4^x, deci 3·4^x+4^x=4 ⟺ 4·4^x=4 ⟺ 4^x=1, de unde obținem x=0." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă cifra zecilor divizor al numărului 6.",
        finalAnswer: "4/9",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea numerelor naturale de două cifre are 90 de elemente, deci 90 de cazuri posibile. Cifra zecilor poate fi 1, 2, 3 sau 6 (divizorii lui 6), deci 4·10=40 de numere favorabile. p=40/90=4/9." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie analitică. Dreapta",
        content: "În reperul cartezian xOy se consideră dreapta d de ecuație y=3x−2 și punctul A(a,a), unde a este număr real. Determinați numărul real a, știind că punctul A aparține dreptei d.",
        finalAnswer: "a=1",
        rubric: [{ label: "barem", points: 5, answer: "A(a,a)∈d ⟺ a=3a−2 ⟺ 2a=2, de unde obținem a=1." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul isoscel ABC, cu AB=10 și cos A=0. Arătați că aria triunghiului ABC este egală cu 50.",
        finalAnswer: "50",
        rubric: [{ label: "barem", points: 5, answer: "cos A=0 ⟹ A=90°. Triunghiul fiind isoscel cu unghiul drept în A, catetele sunt egale: AB=AC=10. Aria=(AB·AC)/2=(10·10)/2=50." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți",
        content: "Se consideră matricea A(x)=(1 −x x² / 0 1 −2x / 0 0 1), unde x este număr real.\na) Arătați că det(A(1))=1.\nb) Arătați că A(x)·A(y)=A(x+y), pentru orice numere reale x și y.\nc) Determinați numărul natural n pentru care A(n)·A(n+1)·A(n+2)·A(n+3)=A(2n²).",
        rubric: [
          { label: "a)", points: 5, answer: "A(1)=(1 −1 1 / 0 1 −2 / 0 0 1). Matricea este superior triunghiulară cu 1 pe diagonală, deci det(A(1))=1." },
          { label: "b)", points: 5, answer: "A(x)·A(y)=(1 −(x+y) (x+y)² / 0 1 −2(x+y) / 0 0 1)=A(x+y), pentru orice x,y∈ℝ (elementul (1,3) este x²+2xy+y²=(x+y)²)." },
          { label: "c)", points: 5, answer: "A(n)·A(n+1)·A(n+2)·A(n+3)=A(n+(n+1)+(n+2)+(n+3))=A(4n+6). Din A(4n+6)=A(2n²) obținem 4n+6=2n² ⟺ n²−2n−3=0 ⟺ (n−3)(n+1)=0, deci n=3 (număr natural)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru",
        content: "Pe mulțimea M=[0,+∞) se definește legea de compoziție x∗y=2x/(y+2) + 2y/(x+2).\na) Arătați că 1∗0=1.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∗”.\nc) Determinați x∈M, x nenul, pentru care x∗(4/x)=x.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗0=2·1/(0+2)+2·0/(1+2)=2/2+0=1." },
          { label: "b)", points: 5, answer: "x∗0=2x/(0+2)+2·0/(x+2)=x și 0∗x=2·0/(x+2)+2x/(0+2)=x, pentru orice x∈M, deci e=0 este elementul neutru al legii „∗”." },
          { label: "c)", points: 5, answer: "x∗(4/x)=2x/((4/x)+2)+2(4/x)/(x+2)=x²/(x+2)+8/(x(x+2))=(x³+8)/(x(x+2))=(x²−2x+4)/x. Din (x²−2x+4)/x=x obținem x²−2x+4=x², deci x=2." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie. Ecuații",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2 + x/(eˣ−x).\na) Arătați că f′(x)=eˣ(1−x)/(eˣ−x)², x∈ℝ.\nb) Determinați intervalele de monotonie ale funcției f.\nc) Demonstrați că, pentru orice m∈(1,2], ecuația f(x)=m are soluție unică.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=(1·(eˣ−x)−x(eˣ−1))/(eˣ−x)²=(eˣ−x−xeˣ+x)/(eˣ−x)²=(eˣ−xeˣ)/(eˣ−x)²=eˣ(1−x)/(eˣ−x)², x∈ℝ (eˣ−x>0 pentru orice x)." },
          { label: "b)", points: 5, answer: "Cum eˣ>0 și (eˣ−x)²>0, semnul lui f′ este dat de (1−x). f′(x)>0 pentru x<1 și f′(x)<0 pentru x>1, deci f este strict crescătoare pe (−∞,1] și strict descrescătoare pe [1,+∞)." },
          { label: "c)", points: 5, answer: "lim_{x→−∞}f(x)=1, f(1)=2+1/(e−1) (maxim), lim_{x→+∞}f(x)=2. Pe (−∞,1] f crește de la 1 (exclus) la 2+1/(e−1), iar pe [1,+∞) f scade de la 2+1/(e−1) la 2 (exclus). Pentru m∈(1,2], valoarea m se atinge exact o dată pe ramura crescătoare și niciodată pe ramura descrescătoare (unde f>2), deci ecuația f(x)=m are soluție unică." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Șiruri de integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3−x+√(x²+9).\na) Arătați că ∫₁⁵ (f(x)−√(x²+9)) dx = 0.\nb) Arătați că ∫₀⁴ x/(f(x)+x−3) dx = 2.\nc) Pentru fiecare număr natural nenul n se consideră numărul Iₙ=∫₀¹ xⁿ/f(x) dx. Demonstrați că lim_{n→+∞} Iₙ = 0.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)−√(x²+9)=3−x, deci ∫₁⁵ (f(x)−√(x²+9)) dx=∫₁⁵ (3−x) dx=(3x−x²/2)|₁⁵=(15−25/2)−(3−1/2)=5/2−5/2=0." },
          { label: "b)", points: 5, answer: "f(x)+x−3=√(x²+9), deci ∫₀⁴ x/(f(x)+x−3) dx=∫₀⁴ x/√(x²+9) dx=√(x²+9)|₀⁴=√25−√9=5−3=2." },
          { label: "c)", points: 5, answer: "Pe [0,1], f(x)=3−x+√(x²+9)≥1 (f este descrescătoare, f(1)=2+√10), deci 0≤xⁿ/f(x)≤xⁿ pentru orice x∈[0,1]. Atunci 0≤Iₙ≤∫₀¹ xⁿ dx=1/(n+1). Cum lim_{n→+∞} 1/(n+1)=0, prin criteriul cleștelui obținem lim_{n→+∞} Iₙ=0." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Simulare — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere complexe",
        content: "Se consideră numerele complexe z₁=1−2i și z₂=2+i. Arătați că (z₁+i)(z₂−1)=2.",
        finalAnswer: "(z₁+i)(z₂−1)=(1−i)(1+i)=2",
        rubric: [{ label: "barem", points: 5, answer: "z₁+i=1−2i+i=1−i, z₂−1=2+i−1=1+i, deci (z₁+i)(z₂−1)=(1−i)(1+i)=1−i²=2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcția de gradul al II-lea. Semnul",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+4x+m, unde m este număr real. Determinați valorile reale ale lui m pentru care f(x)>0, pentru orice număr real x.",
        finalAnswer: "m∈(4, +∞)",
        rubric: [{ label: "barem", points: 5, answer: "f(x)>0 pentru orice x∈ℝ ⟺ Δ<0. Δ=16−4m<0, de unde obținem m∈(4,+∞)." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
        content: "Rezolvați în mulțimea numerelor reale ecuația 1+2log₂√(x−2)=log₂x.",
        finalAnswer: "x=4",
        rubric: [{ label: "barem", points: 5, answer: "Condiție de existență: x>2. 1+2log₂√(x−2)=1+log₂(x−2)=log₂(2(x−2)); ecuația devine log₂(2(x−2))=log₂x ⟺ 2(x−2)=x, de unde obținem x=4 (verifică x>2)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Se consideră mulțimea A, a numerelor naturale de două cifre. Calculați probabilitatea ca, alegând un număr din mulțimea A, acesta să aibă exact doi multipli în mulțimea A.",
        finalAnswer: "8/45",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea A are 90 de elemente, deci 90 de cazuri posibile. Un număr n∈A are exact doi multipli în A (anume n și 2n) ⟺ 33<n≤49 (deoarece 2n≤99<3n), deci numerele 34, 35, …, 49 — 16 cazuri favorabile. p=16/90=8/45." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(−2,−2), B(3,1) și M(2,4). Determinați coordonatele punctului N, știind că patrulaterul ABMN este paralelogram.",
        finalAnswer: "N(−3, 1)",
        rubric: [{ label: "barem", points: 5, answer: "ABMN paralelogram ⟺ AB⃗=NM⃗. AB⃗=(5,3) și NM⃗=(2−x_N, 4−y_N), deci 2−x_N=5 și 4−y_N=3, de unde obținem N(−3,1)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie",
        content: "Se consideră triunghiul ABC, în care sin(A+B)+cos C=1. Arătați că triunghiul ABC este dreptunghic.",
        finalAnswer: "C=90°",
        rubric: [{ label: "barem", points: 5, answer: "Cum A+B+C=π, avem sin(A+B)=sin(π−C)=sin C, deci sin C+cos C=1. Ridicând la pătrat: 1+2sin C·cos C=1 ⟺ sin2C=0, deci 2C=π (C∈(0,π)), adică C=π/2; triunghiul ABC este dreptunghic în C." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Sisteme",
        content: "Se consideră matricea A(a)=(1 3 a / 2 1 −1 / a 3 1) și sistemul de ecuații {x+3y+az=2; 2x+y−z=−1; ax+3y+z=1}, unde a este număr real.\na) Arătați că det(A(1))=0.\nb) Arătați că B(a)·B(a)·B(a)=a³B(1), pentru orice număr real a, unde B(a)=A(a)−A(0).\nc) Demonstrați că, dacă sistemul de ecuații are o infinitate de soluții, atunci x₀y₀+y₀z₀+z₀x₀≤0, pentru orice soluție (x₀,y₀,z₀) a sistemului, cu x₀,y₀,z₀ numere reale.",
        rubric: [
          { label: "a)", points: 5, answer: "A(1)=(1 3 1 / 2 1 −1 / 1 3 1). Liniile 1 și 3 sunt identice, deci det(A(1))=0." },
          { label: "b)", points: 5, answer: "B(a)=A(a)−A(0)=(0 0 a / 0 0 0 / a 0 0)=a·M, unde M=(0 0 1 / 0 0 0 / 1 0 0). Cum M²=(1 0 0 / 0 0 0 / 0 0 1) și M³=M, obținem B(a)³=a³M³=a³M=a³B(1)." },
          { label: "c)", points: 5, answer: "det(A(a))=−(a−1)(a−2). Sistemul are o infinitate de soluții doar pentru a=2 (pentru a=1 este incompatibil). Pentru a=2 soluțiile sunt (x₀,y₀,z₀)=(t−1, 1−t, t), t∈ℝ, iar x₀y₀+y₀z₀+z₀x₀=(t−1)(1−t)+(1−t)t+t(t−1)=−(t−1)²≤0." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Numere complexe. Module",
        content: "Pe mulțimea numerelor complexe se definește legea de compoziție z₁∗z₂=(z₁+z₂)/(4·|z₁z₂|+1).\na) Arătați că (−1)∗2=1/9.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∗”.\nc) Demonstrați că există cel puțin trei numere complexe distincte și nenule care verifică egalitatea |z∗z|=|z|.",
        rubric: [
          { label: "a)", points: 5, answer: "(−1)∗2=(−1+2)/(4·|(−1)·2|+1)=1/(4·2+1)=1/9." },
          { label: "b)", points: 5, answer: "z∗0=(z+0)/(4·|z·0|+1)=z/1=z și, analog, 0∗z=z, pentru orice z∈ℂ, deci e=0 este elementul neutru al legii „∗”." },
          { label: "c)", points: 5, answer: "z∗z=2z/(4|z|²+1), deci |z∗z|=2|z|/(4|z|²+1). |z∗z|=|z| ⟺ (z≠0) 2/(4|z|²+1)=1 ⟺ |z|²=1/4 ⟺ |z|=1/2. Orice z cu |z|=1/2 verifică egalitatea; de exemplu z∈{1/2, −1/2, i/2} sunt trei numere complexe distincte și nenule." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Asimptote. Ecuații",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=√(x⁴+16)/x.\na) Arătați că f′(x)=((x²−4)(x²+4))/(x²·√(x⁴+16)), x∈(0,+∞).\nb) Determinați ecuația asimptotei oblice spre +∞ la graficul funcției f.\nc) Determinați valorile reale ale lui m pentru care ecuația f(x)+f(4/x)=m are exact două soluții.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=(2x³/√(x⁴+16))/x − √(x⁴+16)/x² = (2x⁴−(x⁴+16))/(x²√(x⁴+16))=(x⁴−16)/(x²√(x⁴+16))=((x²−4)(x²+4))/(x²√(x⁴+16)), x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "m=lim_{x→+∞} f(x)/x=lim √(x⁴+16)/x²=1; n=lim_{x→+∞}(f(x)−x)=lim 16/(x(√(x⁴+16)+x²))=0. Asimptota oblică spre +∞ este y=x." },
          { label: "c)", points: 5, answer: "f(4/x)=√((4/x)⁴+16)/(4/x)=√(x⁴+16)/x=f(x), deci ecuația devine 2f(x)=m. Cum f este strict descrescătoare pe (0,2], strict crescătoare pe [2,+∞) și f(2)=2√2, ecuația f(x)=m/2 are exact două soluții ⟺ m/2>2√2, adică m∈(4√2,+∞)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Primitive. Convexitate",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x²+1)/eˣ.\na) Arătați că ∫₀³ eˣ·f(x) dx = 12.\nb) Arătați că orice primitivă G a funcției g:ℝ→ℝ, g(x)=1/f(x), este convexă.\nc) Determinați numărul real a pentru care ∫₀¹ x³/√(eˣ·f(x)) dx = (a−√2)/3.",
        rubric: [
          { label: "a)", points: 5, answer: "∫₀³ eˣ·f(x) dx=∫₀³ eˣ·(x²+1)/eˣ dx=∫₀³(x²+1)dx=(x³/3+x)|₀³=9+3=12." },
          { label: "b)", points: 5, answer: "g(x)=1/f(x)=eˣ/(x²+1). G primitivă ⟹ G′=g, G″=g′. g′(x)=(eˣ(x²+1)−eˣ·2x)/(x²+1)²=eˣ(x−1)²/(x²+1)²≥0, deci G″≥0, adică G este convexă pe ℝ." },
          { label: "c)", points: 5, answer: "eˣ·f(x)=x²+1, deci ∫₀¹ x³/√(x²+1) dx. Cu substituția u=x²+1: ∫₀¹ x³/√(x²+1) dx=((1/3)(x²+1)^(3/2)−√(x²+1))|₀¹=(2√2/3−√2)−(1/3−1)=(−√2/3)−(−2/3)=(2−√2)/3. Din (2−√2)/3=(a−√2)/3 obținem a=2." },
        ] },
    ],
  },
  {
    source: "BAC 2022 Varianta 3 — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2022, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "var-03", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2022/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere complexe",
        content: "Arătați că 5(1+2i)−2i(5−i)=3, unde i²=−1.",
        finalAnswer: "3",
        rubric: [{ label: "barem", points: 5, answer: "5(1+2i)−2i(5−i)=5+10i−10i+2i²=5+2·(−1)=5−2=3." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții de gradul al II-lea",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²−2x−3. Determinați numărul real a pentru care f(a)=1+a².",
        finalAnswer: "a=−2",
        rubric: [{ label: "barem", points: 5, answer: "f(a)=a²−2a−3=1+a² ⟺ −2a−3=1 ⟺ −2a=4, de unde obținem a=−2." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
        content: "Rezolvați în mulțimea numerelor reale ecuația log₃(2x²+1)=2.",
        finalAnswer: "x∈{−2, 2}",
        rubric: [{ label: "barem", points: 5, answer: "log₃(2x²+1)=2 ⟺ 2x²+1=9 ⟺ x²=4, de unde obținem x=−2 sau x=2 (ambele verifică 2x²+1>0)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă cifrele impare și distincte.",
        finalAnswer: "2/9",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea numerelor naturale de două cifre are 90 de elemente, deci 90 de cazuri posibile. Cifrele impare sunt 1, 3, 5, 7, 9; cifra zecilor are 5 alegeri, iar cifra unităților impară și distinctă are 4 alegeri, deci 5·4=20 de cazuri favorabile. p=20/90=2/9." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(2,0), B(1,6) și C(4,2). Determinați coordonatele punctului D, știind că AB⃗=DC⃗.",
        finalAnswer: "D(5, −4)",
        rubric: [{ label: "barem", points: 5, answer: "AB⃗=(−1,6) și DC⃗=(4−x_D, 2−y_D). Din AB⃗=DC⃗ obținem 4−x_D=−1 și 2−y_D=6, deci D(5,−4)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, astfel încât BC=10 și sin B=2sin C. Arătați că lungimea laturii AB este egală cu 2√5.",
        finalAnswer: "AB=2√5",
        rubric: [{ label: "barem", points: 5, answer: "În triunghiul dreptunghic în A: sin B=AC/BC, sin C=AB/BC, deci sin B=2sin C ⟹ AC=2·AB. Din teorema lui Pitagora AB²+AC²=BC²: AB²+4AB²=100 ⟹ 5AB²=100 ⟹ AB²=20, deci AB=2√5." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Relații matriceale",
        content: "Se consideră matricele I₃=(1 0 0 / 0 1 0 / 0 0 1), O₃ (matricea nulă de ordin 3) și A(x)=(x+1 −x 0 / x 1−x 0 / 0 0 1), unde x este număr real.\na) Arătați că det(A(1))=1.\nb) Arătați că (A(x)−I₃)(A(x)−I₃)=O₃, pentru orice număr real x.\nc) Determinați numerele reale x pentru care A(x)·A(x)=xA(x)−(x−1)I₃.",
        rubric: [
          { label: "a)", points: 5, answer: "A(1)=(2 −1 0 / 1 0 0 / 0 0 1). Dezvoltând după ultima linie, det(A(1))=1·(2·0−(−1)·1)=1." },
          { label: "b)", points: 5, answer: "A(x)−I₃=(x −x 0 / x −x 0 / 0 0 0). Produsul (A(x)−I₃)² are pe primele două linii x·x+(−x)·x=0 și x·(−x)+(−x)(−x)=0, iar restul 0, deci (A(x)−I₃)(A(x)−I₃)=O₃." },
          { label: "c)", points: 5, answer: "Din b), A(x)²−2A(x)+I₃=O₃, deci A(x)²=2A(x)−I₃. Ecuația A(x)²=xA(x)−(x−1)I₃ devine 2A(x)−I₃=xA(x)−(x−1)I₃ ⟺ (2−x)(A(x)−I₃)=O₃, de unde x=2 sau A(x)=I₃ (adică x=0). Soluții: x∈{0, 2}." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție",
        content: "Pe mulțimea numerelor reale se definește legea de compoziție x∗y=(x+y)²−2(x−y)−3.\na) Arătați că 0∗2=5.\nb) Determinați numerele reale x pentru care x∗(x+1)=8.\nc) Determinați perechile (m,n) de numere naturale pentru care m∗n=2mn.",
        rubric: [
          { label: "a)", points: 5, answer: "0∗2=(0+2)²−2(0−2)−3=4+4−3=5." },
          { label: "b)", points: 5, answer: "x∗(x+1)=(2x+1)²−2(−1)−3=(2x+1)²−1=8 ⟺ (2x+1)²=9 ⟺ 2x+1=±3, de unde obținem x=1 sau x=−2." },
          { label: "c)", points: 5, answer: "m∗n=2mn ⟺ (m+n)²−2(m−n)−3=2mn ⟺ m²+n²−2m+2n−3=0 ⟺ (m−1)²+(n+1)²=5. Cu m,n numere naturale obținem perechile (0,1), (2,1) și (3,0)." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie. Limite",
        content: "Se consideră funcția f:(0,+∞)→ℝ, f(x)=(x²−5x+10)√x.\na) Arătați că f′(x)=5(x²−3x+2)/(2√x), x∈(0,+∞).\nb) Determinați intervalele de monotonie ale funcției f.\nc) Arătați că lim_{x→+∞} (f(x)/(x²√x))^(x/5) = 1/e.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)=x^(5/2)−5x^(3/2)+10x^(1/2), deci f′(x)=(5/2)x^(3/2)−(15/2)x^(1/2)+5x^(−1/2)=(5/(2√x))(x²−3x+2)=5(x²−3x+2)/(2√x), x∈(0,+∞)." },
          { label: "b)", points: 5, answer: "f′(x)=5(x−1)(x−2)/(2√x). Cum √x>0, semnul lui f′ este dat de (x−1)(x−2): f′>0 pe (0,1)∪(2,+∞), f′<0 pe (1,2). Deci f este strict crescătoare pe (0,1] și pe [2,+∞), strict descrescătoare pe [1,2]." },
          { label: "c)", points: 5, answer: "f(x)/(x²√x)=(x²−5x+10)/x²=1−5/x+10/x². lim_{x→+∞}(1−5/x+10/x²)^(x/5)=e^(lim (x/5)·(−5/x+10/x²))=e^(−1)=1/e." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale definite",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x+eˣ+1/(eˣ+1).\na) Arătați că ∫₀² (f(x)−1/(eˣ+1)) dx = e²+1.\nb) Arătați că ∫₋₁¹ eˣ(f(x)−x−eˣ) dx = 1.\nc) Determinați numărul real m pentru care ∫₀¹ x(f(x)+f(−x)) dx = m/2 − 2/e.",
        rubric: [
          { label: "a)", points: 5, answer: "f(x)−1/(eˣ+1)=x+eˣ, deci ∫₀²(x+eˣ)dx=(x²/2+eˣ)|₀²=(2+e²)−(0+1)=e²+1." },
          { label: "b)", points: 5, answer: "f(x)−x−eˣ=1/(eˣ+1), deci ∫₋₁¹ eˣ/(eˣ+1) dx=ln(eˣ+1)|₋₁¹=ln(e+1)−ln((e+1)/e)=ln e=1." },
          { label: "c)", points: 5, answer: "1/(eˣ+1)+1/(e^(−x)+1)=1/(eˣ+1)+eˣ/(eˣ+1)=1, deci f(x)+f(−x)=eˣ+e^(−x)+1. ∫₀¹ x(eˣ+e^(−x)+1)dx=∫₀¹ xeˣdx+∫₀¹ xe^(−x)dx+∫₀¹ x dx=1+(1−2/e)+1/2=5/2−2/e. Din 5/2−2/e=m/2−2/e obținem m=5." },
        ] },
    ],
  },
  {
    source: "BAC 2023 Model — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2023, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2023/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere complexe",
        content: "Determinați numerele reale a și b pentru care (a+bi)(1+i)=4, unde i²=−1.",
        finalAnswer: "a=2, b=−2",
        rubric: [{ label: "barem", points: 5, answer: "(a+bi)(1+i)=(a−b)+(a+b)i=4 ⟺ a−b=4 și a+b=0, de unde obținem a=2 și b=−2." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcția de gradul al II-lea. Simetrie",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=mx²−2x+m, unde m este număr real nenul. Determinați numerele reale m pentru care f(m−x)=f(m+x), pentru orice număr real x.",
        finalAnswer: "m∈{−1, 1}",
        rubric: [{ label: "barem", points: 5, answer: "f(m−x)=f(m+x) pentru orice x ⟺ axa de simetrie a parabolei este x=m ⟺ 1/m=m ⟺ m²=1, de unde obținem m=−1 sau m=1 (ambele nenule)." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
        content: "Rezolvați în mulțimea numerelor reale ecuația 2log₂(2x)−1=log₂(x²+x+2).",
        finalAnswer: "x=2",
        rubric: [{ label: "barem", points: 5, answer: "Condiție: x>0. 2log₂(2x)−1=log₂(4x²)−log₂2=log₂(2x²); ecuația devine log₂(2x²)=log₂(x²+x+2) ⟺ 2x²=x²+x+2 ⟺ x²−x−2=0 ⟺ (x−2)(x+1)=0, de unde x=2 (x>0)." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Probabilități",
        content: "Se consideră mulțimile A={1,2,3,4} și F={f | f:A→A}. Determinați probabilitatea ca, alegând un element f din mulțimea F, acesta să verifice inegalitatea f(n)≤n, pentru orice n∈A.",
        finalAnswer: "3/32",
        rubric: [{ label: "barem", points: 5, answer: "|F|=4⁴=256 (cazuri posibile). Condiția f(n)≤n dă: f(1)=1 (1 alegere), f(2)∈{1,2} (2), f(3)∈{1,2,3} (3), f(4)∈{1,2,3,4} (4), deci 1·2·3·4=24 funcții favorabile. p=24/256=3/32." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(5,3) și B(−1,5). Determinați coordonatele punctului C, știind că CA⃗+CB⃗=2OC⃗.",
        finalAnswer: "C(1, 2)",
        rubric: [{ label: "barem", points: 5, answer: "CA⃗+CB⃗=(A−C)+(B−C)=A+B−2OC⃗. Din CA⃗+CB⃗=2OC⃗ obținem A+B=4OC⃗, deci OC⃗=(A+B)/4=((5−1)/4,(3+5)/4)=(1,2), adică C(1,2)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Geometrie. Cerc circumscris",
        content: "Se consideră triunghiul ABC, cu AB=8, măsura unghiului C de 30° și punctul O, centrul cercului circumscris triunghiului ABC. Determinați distanța de la punctul O la latura AB.",
        finalAnswer: "4√3",
        rubric: [{ label: "barem", points: 5, answer: "Din teorema sinusurilor AB/sin C=2R, deci 8/sin30°=2R ⟹ R=8. Distanța de la O la coarda AB este d=√(R²−(AB/2)²)=√(64−16)=√48=4√3." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Sisteme",
        content: "Se consideră matricea A(a)=(3 a −2 / 2a+1 1−a −1 / a+2 −2 1) și sistemul de ecuații {3x+ay−2z=b; (2a+1)x+(1−a)y−z=c; (a+2)x−2y+z=−1}, unde a, b și c sunt numere reale.\na) Arătați că det(A(0))=5.\nb) Determinați numerele reale a pentru care matricea A(a) este inversabilă.\nc) Determinați numerele reale b și c pentru care sistemul de ecuații este compatibil, oricare ar fi numărul real a.",
        rubric: [
          { label: "a)", points: 5, answer: "A(0)=(3 0 −2 / 1 1 −1 / 2 −2 1). det(A(0))=3·(1·1−(−1)(−2))+(−2)·(1·(−2)−1·2)=3·(−1)−2·(−4)=−3+8=5." },
          { label: "b)", points: 5, answer: "det(A(a))=5(1−a²)=−5(a−1)(a+1). Matricea A(a) este inversabilă ⟺ det(A(a))≠0 ⟺ a∈ℝ∖{−1,1}." },
          { label: "c)", points: 5, answer: "Matricea sistemului este A(a). Pentru a∉{−1,1} sistemul este compatibil determinat. Tripletul (x,y,z)=(0,0,−1) verifică toate cele trei ecuații pentru orice a dacă și numai dacă b=2 și c=1 (din ecuațiile 1, 2, 3: −2z=b ⟹ b=2; −z=c ⟹ c=1; z=−1), iar această soluție comună asigură compatibilitatea și pentru a=−1, a=1. Deci b=2 și c=1." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Polinoame. Rădăcini",
        content: "Se consideră polinomul f=X⁴+aX³+aX²+8X−8, unde a este număr real.\na) Arătați că f(−1)=−15, pentru orice număr real a.\nb) Determinați numărul real a pentru care restul împărțirii polinomului f la polinomul g=X²−1 este egal cu 15X.\nc) Arătați că, pentru orice număr real a, polinomul f nu are toate rădăcinile numere întregi.",
        rubric: [
          { label: "a)", points: 5, answer: "f(−1)=1−a+a−8−8=−15, pentru orice a∈ℝ (termenii −a și +a se reduc)." },
          { label: "b)", points: 5, answer: "Restul împărțirii la X²−1 este rX+s, cu f(1)=r+s și f(−1)=−r+s. Din rest=15X: r=15, s=0, deci f(1)=15. Cum f(1)=1+a+a+8−8=1+2a, din 1+2a=15 obținem a=7." },
          { label: "c)", points: 5, answer: "Presupunem că f are toate rădăcinile întregi x₁,x₂,x₃,x₄. Atunci f(−1)=(−1−x₁)(−1−x₂)(−1−x₃)(−1−x₄)=−15 (impar), deci fiecare factor este impar, adică fiecare xᵢ este par. Atunci produsul x₁x₂x₃x₄ se divide cu 16, dar x₁x₂x₃x₄=−8 (termenul liber) nu se divide cu 16 — contradicție. Deci f nu are toate rădăcinile întregi." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Tangentă. Inegalități",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=1−x−(x⁴−1)·arctg x.\na) Arătați că f′(x)=−x²(4x·arctg x+1), x∈ℝ.\nb) Determinați ecuația tangentei la graficul funcției f care este paralelă cu axa Ox.\nc) Demonstrați că tg(f(x))≥f(x)≥f(tg x), pentru orice x∈[0,1].",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=−1−(4x³·arctg x+(x⁴−1)·1/(1+x²))=−1−4x³arctg x−(x²−1)=−x²−4x³arctg x=−x²(4x·arctg x+1), x∈ℝ." },
          { label: "b)", points: 5, answer: "Tangenta este paralelă cu Ox ⟺ f′(x)=0. Cum 4x·arctg x≥0, avem 4x·arctg x+1≥1>0, deci f′(x)=0 ⟺ x=0. f(0)=1, deci ecuația tangentei este y=1." },
          { label: "c)", points: 5, answer: "f′(x)=−x²(4x·arctg x+1)≤0, deci f este descrescătoare pe ℝ; f(0)=1, f(1)=0, deci f([0,1])=[0,1]. Pentru x∈[0,1]: tg x≥x și f descrescătoare ⟹ f(x)≥f(tg x); iar f(x)∈[0,1] și tg u≥u pentru u∈[0,1] ⟹ tg(f(x))≥f(x). Deci tg(f(x))≥f(x)≥f(tg x)." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale. Limite",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x²+eˣ)/(1+e^(−x)).\na) Arătați că ∫₀³ (1+e^(−x))·f(x) dx = 8+e³.\nb) Arătați că ∫₋ₘᵐ f(x)/(x²+eˣ) dx = m, pentru orice m∈(0,+∞).\nc) Determinați numărul real nenul a pentru care lim_{x→0} (1/(e^(ax)−1))·∫₀ˣ f(t) dt = 1.",
        rubric: [
          { label: "a)", points: 5, answer: "(1+e^(−x))·f(x)=x²+eˣ, deci ∫₀³(x²+eˣ)dx=(x³/3+eˣ)|₀³=(9+e³)−1=8+e³." },
          { label: "b)", points: 5, answer: "f(x)/(x²+eˣ)=1/(1+e^(−x))=eˣ/(eˣ+1). Notând g(x)=eˣ/(eˣ+1), avem g(x)+g(−x)=1, deci ∫₋ₘᵐ g(x)dx=∫₀ᵐ(g(x)+g(−x))dx=∫₀ᵐ 1 dx=m." },
          { label: "c)", points: 5, answer: "Fie F(x)=∫₀ˣ f(t)dt, F(0)=0, F′(0)=f(0)=1/2. lim_{x→0} F(x)/(e^(ax)−1)=lim_{x→0} (F(x)/x)·(x/(e^(ax)−1))=f(0)·(1/a)=1/(2a). Din 1/(2a)=1 obținem a=1/2." },
        ] },
    ],
  },
  {
    source: "BAC 2024 Simulare — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2024, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2024/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Logaritmi",
        content: "Arătați că (3+lg(1/10))·lg√10=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "lg(1/10)=−1, deci 3+lg(1/10)=2. (3+lg(1/10))·lg√10=2·lg√10=2·(1/2)=1." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−1, unde a este număr real. Determinați numerele reale a pentru care (f∘f)(1)=1.",
        finalAnswer: "a∈{−1, 1}",
        rubric: [{ label: "barem", points: 5, answer: "f(1)=1+a−1=a; (f∘f)(1)=f(a)=a²+a·a−1=2a²−1. 2a²−1=1, de unde obținem a=−1 sau a=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 2^(x+1)·8^x=32.",
        finalAnswer: "x=1",
        rubric: [{ label: "barem", points: 5, answer: "2^(x+1)·2^(3x)=32, deci 2^(4x+1)=2^5, de unde obținem 4x+1=5; x=1." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr n din mulțimea numerelor naturale de două cifre, numărul √(n+100) să fie natural.",
        finalAnswer: "2/45",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea numerelor naturale de două cifre are 90 de elemente, deci sunt 90 de cazuri posibile. Cum 110≤n+100≤199 și n+100 este pătratul unui număr natural, obținem 4 numere: 21, 44, 69 și 96, deci p=4/90=2/45." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,4), B(4,6) și C(4,2). Determinați coordonatele punctului D, știind că OD⃗=½(AB⃗+AC⃗).",
        finalAnswer: "D(3, 0)",
        rubric: [{ label: "barem", points: 5, answer: "AB⃗=3i⃗+2j⃗, AC⃗=3i⃗−2j⃗ ⇒ OD⃗=½(3i⃗+2j⃗+3i⃗−2j⃗)=3i⃗, deci punctul D are coordonatele (3,0)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie. Expresii",
        content: "Se consideră expresia E(x)=tg x−4cos(x/2)·cos x, unde x∈(0,π/2). Arătați că E(π/3)=0.",
        finalAnswer: "0",
        rubric: [{ label: "barem", points: 5, answer: "tg(π/3)=√3, cos(π/6)=√3/2, cos(π/3)=1/2. E(π/3)=√3−4·(√3/2)·(1/2)=√3−√3=0." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Inversa",
        content: "Se consideră matricele I₃=(1 0 0 / 0 1 0 / 0 0 1) și A(x)=(1 −1 x / −1 0 0 / x 0 −1), unde x este număr real.\na) Arătați că det(A(0))=1.\nb) Arătați că det(A(x)·A(x)−I₃)≤0, pentru orice număr real x.\nc) Se consideră matricea B∈M₂,₃(ℝ), B=(1 0 1 / 0 1 0). Determinați matricea X∈M₂,₃(ℝ) pentru care X·(A(0))⁻¹=B·A(0), unde (A(0))⁻¹ este inversa matricei A(0).",
        rubric: [
          { label: "a)", points: 5, answer: "A(0)=(1 −1 0 / −1 0 0 / 0 0 −1) ⇒ det(A(0))=0+0+0−0−0−(−1)=1." },
          { label: "b)", points: 5, answer: "A(x)·A(x)=(2+x² −1 0 / −1 1 −x / 0 −x x²+1), deci A(x)·A(x)−I₃=(1+x² −1 0 / −1 0 −x / 0 −x x²). det(A(x)·A(x)−I₃)=−x²(1+x²)−x²=−x²(2+x²)≤0, pentru orice număr real x." },
          { label: "c)", points: 5, answer: "X·(A(0))⁻¹=B·A(0) ⇒ X=B·A(0)·A(0). X=(2 −1 1 / −1 1 0)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru",
        content: "Pe mulțimea M=[0,+∞) se definește legea de compoziție x∗y=(x²+y²+x+y)/(x+y+1).\na) Arătați că 1∗2=2.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∗”.\nc) Determinați perechile (m,n) de numere naturale pentru care m∗n=5.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗2=(1²+2²+1+2)/(1+2+1)=8/4=2." },
          { label: "b)", points: 5, answer: "x∗0=(x²+x)/(x+1)=x(x+1)/(x+1)=x, pentru orice x∈M și, analog, 0∗x=x, pentru orice x∈M, deci e=0 este elementul neutru al legii de compoziție „∗”." },
          { label: "c)", points: 5, answer: "(m²+n²+m+n)/(m+n+1)=5, de unde obținem (m−2)²+(n−2)²=13. Cum m și n sunt numere naturale, obținem perechile (0,5), (4,5), (5,0) și (5,4)." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x+6)√(x²+4).\na) Arătați că f′(x)=2(x²+3x+2)/√(x²+4), x∈ℝ.\nb) Determinați intervalele de monotonie ale funcției f.\nc) Demonstrați că ecuația f(x)=m are soluție unică, pentru orice număr întreg m.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=√(x²+4)+(x+6)·2x/(2√(x²+4))=((x²+4)+(x+6)x)/√(x²+4)=(2x²+6x+4)/√(x²+4)=2(x²+3x+2)/√(x²+4), x∈ℝ." },
          { label: "b)", points: 5, answer: "f′(x)=2(x+1)(x+2)/√(x²+4). f′(x)>0 pentru x∈(−∞,−2)∪(−1,+∞) ⇒ f strict crescătoare pe (−∞,−2] și pe [−1,+∞); f′(x)<0 pentru x∈(−2,−1) ⇒ f strict descrescătoare pe [−2,−1]." },
          { label: "c)", points: 5, answer: "lim_{x→−∞}f(x)=−∞, f(−2)=√128, f(−1)=√125, lim_{x→+∞}f(x)=+∞, f continuă; 11<√125<√128<12. Cum f este strict crescătoare pe (−∞,−2], descrescătoare pe [−2,−1] și strict crescătoare pe [−1,+∞), iar valorile extremelor locale √128 și √125 nu sunt întregi, ecuația f(x)=m are soluție unică, pentru orice număr întreg m." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale definite. Șiruri de integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x+1)/eˣ.\na) Arătați că ∫₀⁴ eˣ·f(x) dx=12.\nb) Arătați că ∫₀¹ f(x) dx=(2e−3)/e.\nc) Pentru fiecare număr natural n, n≥2, se consideră numărul Iₙ=∫₀¹ x^(n−1)/f(xⁿ) dx. Demonstrați că (ln2)/n ≤ Iₙ ≤ (e−1)/n, pentru orice număr natural n, n≥2.",
        rubric: [
          { label: "a)", points: 5, answer: "∫₀⁴ eˣ·f(x) dx=∫₀⁴ (x+1) dx=(x²/2+x)|₀⁴=8+4=12." },
          { label: "b)", points: 5, answer: "∫₀¹ f(x) dx=∫₀¹ (x+1)(−e^(−x))′ dx=(x+1)(−e^(−x))|₀¹−e^(−x)|₀¹=−2/e+1−1/e+1=(2e−3)/e." },
          { label: "c)", points: 5, answer: "Iₙ=∫₀¹ x^(n−1)e^(xⁿ)/(xⁿ+1) dx=(1/n)∫₀¹ (xⁿ)′e^(xⁿ)/(xⁿ+1) dx=(1/n)∫₀¹ eᵗ/(t+1) dt, pentru orice n≥2. Cum 1≤eᵗ și 1/(t+1)≤eᵗ/(t+1)≤eᵗ pe [0,1]: Iₙ≥(1/n)∫₀¹ 1/(t+1) dt=(1/n)ln(t+1)|₀¹=(ln2)/n și Iₙ≤(1/n)∫₀¹ eᵗ dt=(e−1)/n, pentru orice n≥2." },
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
